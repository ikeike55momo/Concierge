# パチスロ店舗情報管理システム - Claude Code実装指示書

## プロジェクト概要
パチンコ・パチスロ店舗の出玉データを管理し、独自のスコアリングで「明日のおすすめホール」を提案するWebサービスのMVP版を開発してください。

## 技術スタック
- Frontend: Next.js 14 (App Router)
- Backend: Supabase (Database + Storage + Auth)
- Hosting: Vercel
- Language: TypeScript
- AI: OpenAI API または Claude API

## プロジェクト構造
```
pachislot-recommendation/
├── app/
│   ├── page.tsx                    # トップページ（2ボタン）
│   ├── ranking/
│   │   └── page.tsx                # 店舗ランキング一覧
│   ├── store/[id]/
│   │   └── page.tsx                # 店舗分析詳細
│   ├── admin/
│   │   ├── page.tsx                # 管理画面
│   │   └── upload/
│   │       └── page.tsx            # CSVアップロード
│   └── api/
│       ├── ranking/
│       │   └── tomorrow/route.ts   # ランキングAPI
│       ├── analysis/
│       │   └── [storeId]/route.ts  # 分析API
│       ├── llm/
│       │   ├── comment/route.ts    # コメント生成
│       │   └── strategy/route.ts   # 戦略生成
│       └── admin/
│           └── upload/route.ts     # CSV処理
├── components/
│   ├── StoreCard.tsx               # 店舗カード
│   ├── ScoreDisplay.tsx            # スコア表示
│   ├── FileUploader.tsx            # CSVアップローダー
│   └── StrategyDisplay.tsx         # 立ち回り表示
├── lib/
│   ├── supabase.ts                 # Supabase設定
│   ├── csv-processor.ts            # CSV処理
│   ├── scoring.ts                  # スコアリング
│   └── llm.ts                      # LLM連携
├── types/
│   └── index.ts                    # 型定義
└── data/
    ├── store_production_info.csv   # 店舗データ
    ├── machines.csv                # 機種マスタ
    └── events.csv                  # イベント情報
```

## 実装手順

### 1. 環境構築
```bash
npx create-next-app@latest pachislot-recommendation --typescript --tailwind --app
cd pachislot-recommendation
npm install @supabase/supabase-js openai papaparse date-fns
```

### 2. 環境変数設定（.env.local）
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
```

### 3. Supabaseテーブル作成
以下のSQLを実行：
```sql
-- CSVファイル管理
CREATE TABLE csv_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  store_name VARCHAR(255),
  upload_date TIMESTAMP DEFAULT NOW(),
  file_path TEXT,
  row_count INTEGER
);

-- 日次パフォーマンス
CREATE TABLE daily_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  total_difference INTEGER,
  average_difference INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, store_name)
);

-- スコアリング結果
CREATE TABLE store_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL,
  target_date DATE NOT NULL,
  total_score INTEGER NOT NULL,
  win_rate DECIMAL(5,2),
  comment TEXT,
  factors JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_name, target_date)
);
```

### 4. CSVデータ構造の実装

#### store_production_info.csv の処理
```typescript
// lib/csv-processor.ts
interface StoreProductionRow {
  number: number;
  element: string;
  要素名: string;
  情報: string;
}

interface DailySummary {
  total_diff: number;
  avg_diff: number;
}

interface MachineDetail {
  machine_name: string;
  units: {
    [unitNumber: string]: {
      diff: number;
      games: number;
      rate: string;
    };
  };
  total_diff: number;
  avg_diff: number;
}

export async function parseStoreProductionInfo(csvContent: string) {
  // CSVをパースして、各要素のJSONデータを取得
  const rows = Papa.parse<StoreProductionRow>(csvContent, { 
    header: true 
  }).data;
  
  const storeData: any = {};
  
  rows.forEach(row => {
    if (row.element.includes('daily_summary_')) {
      storeData[row.element] = JSON.parse(row.情報);
    } else if (row.element.includes('machine_detail_')) {
      storeData[row.element] = JSON.parse(row.情報);
    } else {
      storeData[row.element] = row.情報;
    }
  });
  
  return storeData;
}
```

### 5. スコアリング実装
```typescript
// lib/scoring.ts
export async function calculateScore(
  storeName: string, 
  targetDate: string
): Promise<number> {
  // 1. 直近30日の平均差枚を取得
  const recentPerformance = await getRecentPerformance(storeName, 30);
  const performanceScore = normalizeToScore(recentPerformance.avgDiff) * 0.4;
  
  // 2. 安定度（変動係数）
  const stability = await calculateStability(storeName, 90);
  const stabilityScore = (1 - stability.cv) * 100 * 0.15;
  
  // 3. イベント期待値
  const eventExpectation = await getEventExpectation(storeName, targetDate);
  const eventScore = eventExpectation * 0.25;
  
  // 4. 機種魅力度
  const machineAttractiveness = await getMachineScore(storeName);
  const machineScore = machineAttractiveness * 0.1;
  
  // 5. アクセス快適度（固定値として仮実装）
  const accessScore = 80 * 0.1;
  
  const totalScore = Math.min(100, Math.max(0,
    performanceScore + stabilityScore + eventScore + 
    machineScore + accessScore
  ));
  
  return Math.round(totalScore);
}
```

### 6. LLM連携実装
```typescript
// lib/llm.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateComment(
  score: number,
  eventInfo: string,
  recentTrend: string
): Promise<string> {
  const prompt = `
    あなたはパチスロ店舗の分析専門家です。
    以下の情報から、ユーザーが「今日行きたい！」と思う
    15文字以内のキャッチーなコメントを生成してください。
    
    スコア: ${score}/100点
    明日のイベント: ${eventInfo}
    最近の傾向: ${recentTrend}
    
    例: "新台北斗で万枚チャンス！"
  `;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 50,
    temperature: 0.8
  });
  
  return response.choices[0].message.content || '今日がチャンス！';
}
```

### 7. メイン画面の実装

#### トップページ (app/page.tsx)
```typescript
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-8">
        3タップで明日の行き先が決まる
      </h1>
      
      <div className="max-w-md mx-auto space-y-4">
        <Link href="/ranking?type=recommend">
          <button className="w-full bg-green-500 text-white p-6 rounded-lg">
            明日のおすすめホール
          </button>
        </Link>
        
        <Link href="/ranking?type=local">
          <button className="w-full bg-blue-500 text-white p-6 rounded-lg">
            地元から探す
          </button>
        </Link>
      </div>
    </div>
  );
}
```

#### ランキングページ (app/ranking/page.tsx)
```typescript
export default async function Ranking({ searchParams }) {
  const rankings = await fetch('/api/ranking/tomorrow').then(r => r.json());
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">明日のおすすめホール</h1>
      
      <div className="space-y-4">
        {rankings.map((store) => (
          <Link href={`/store/${store.store_id}`} key={store.store_id}>
            <div className={`p-4 rounded-lg ${getScoreColor(store.score)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-bold">{store.store_name}</h2>
                  <p className="text-sm mt-1">{store.comment}</p>
                </div>
                <div className="text-2xl font-bold">
                  {store.score}点
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### 8. データ更新バッチ処理
```typescript
// scripts/update-scores.ts
async function updateDailyScores() {
  const stores = ['アイランド秋葉原店', 'マルハン新宿店', 'ダイナム渋谷店'];
  const tomorrow = addDays(new Date(), 1);
  
  for (const storeName of stores) {
    // スコア計算
    const score = await calculateScore(storeName, format(tomorrow, 'yyyy-MM-dd'));
    
    // コメント生成
    const comment = await generateComment(score, eventInfo, recentTrend);
    
    // DB保存
    await supabase.from('store_scores').upsert({
      store_name: storeName,
      target_date: tomorrow,
      total_score: score,
      comment: comment,
      factors: scoreFactors
    });
  }
}
```

## 実装時の注意点

1. **CSV処理**
   - store_production_info.csvは縦持ち構造
   - 情報列のJSONは必ずパースエラーチェック
   - 月跨ぎのデータ取得に注意

2. **パフォーマンス**
   - スコアは日次バッチで事前計算
   - LLM結果は24時間キャッシュ
   - 大きなJSONデータは適切に分割

3. **エラーハンドリング**
   - LLM API失敗時は定型文フォールバック
   - CSV形式エラーは管理画面で通知
   - スコア計算失敗時は前日値を使用

4. **セキュリティ**
   - 管理画面は認証必須
   - CSVアップロードはサイズ制限（100MB）
   - SQLインジェクション対策

## デプロイ手順

1. Vercelにプロジェクト作成
2. 環境変数設定
3. Supabaseとの連携設定
4. デプロイ実行

```bash
vercel --prod
```

## 開発の進め方

1. まず基本的なCSV読み込みとスコア計算を実装
2. 次にUI画面を作成
3. LLM連携を追加
4. 最後に管理画面を実装

この指示書に従って、MVP版を段階的に実装してください。
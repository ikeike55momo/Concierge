# パチスロ店舗情報管理システム MVP版 要件定義書

## 1. システム概要

### 1.1 目的
3店舗のパチンコ・パチスロ店舗データを対象に、出玉情報の管理・検索・表示機能を実装し、サービスの実現可能性を検証する

### 1.2 MVP版の範囲
- 対象店舗数: 3店舗（東京都内）
- 対象期間: 過去3ヶ月分のデータ
- 主要機能: データ管理、スコアリング、検索、表示機能

### 1.3 技術スタック
- フロントエンド: Next.js 14 (App Router)
- ホスティング: Vercel
- バックエンド: Supabase (Storage + Database)
- AI/LLM: OpenAI API または Claude API
- 言語: TypeScript

## 2. データ構造

### 2.1 CSV ファイル構成

#### 店舗実績統合データ（store_production_info.csv）
```csv
number,element,要素名,情報
1,store_id,店舗ID,001
2,store_name,店舗名,アイランド秋葉原店
3,address,住所,東京都千代田区外神田3-1-1
4,total_slots,総台数,385
5,daily_summary_202401,2024年1月日次サマリー,"{""2024-01-01"":{""total_diff"":150000,""avg_diff"":385},""2024-01-02"":{""total_diff"":145000,""avg_diff"":375}...}"
6,machine_detail_202401,2024年1月機種別詳細,"{""2024-01-01"":{""M001"":{""machine_name"":""北斗の拳"",""units"":{""101"":{""diff"":15000,""games"":8000,""rate"":""110.5%""},""102"":{""diff"":-2000,""games"":5000,""rate"":""92.0%""}},""total_diff"":21000,""avg_diff"":7000}}...}"
7,top_performers_202401,2024年1月TOP10台,"{""2024-01-01"":[{""rank"":1,""machine_id"":""M001"",""machine_name"":""北斗の拳"",""unit"":""101"",""diff"":15000},{""rank"":2,""machine_id"":""M002"",""machine_name"":""ゴッドイーター"",""unit"":""205"",""diff"":12000}]...}"
8,event_results_202401,2024年1月イベント実績,"{""2024-01-15"":{""event_type"":""取材"",""event_name"":""某誌取材"",""actual_diff"":280000,""vs_average"":""125%""}...}"
...
```

### 2.2 データ格納方式
- **縦軸（行）**: データ要素種別（1ヶ月単位で集約）
- **横軸（セル内）**: JSON形式で日次データを格納
- **更新方式**: 月次で新しい行を追加
- **保持期間**: 過去3ヶ月分のデータを保持

### 2.3 データ統合フロー
1. **元データ取得**（3つのCSVファイル）
   - 台番別差枚数（日次詳細）
   - 日付毎サマリー（日次集計）
   - 機種別差枚数（機種別集計）

2. **月次集約処理**
   - 日次データを月単位でJSON化
   - 要素名に年月を付与（例：daily_summary_202401）
   - 既存データがある場合は情報セルを更新

3. **CSV更新**
   - 新規月の場合：新しい行を追加
   - 既存月の場合：該当セルのJSONを更新

## 3. 機能要件

### 3.1 データ管理機能
- 管理者用CSVアップロード（ドラッグ&ドロップ対応）
- データ統合処理
  - 3つの元CSVファイルから月次データを生成
  - JSON形式でセル内に日次データを格納
  - store_production_info.csvの該当行を更新
- データ読み取り処理
  - JSON形式のセルデータをパース
  - 必要な期間のデータを抽出
  - スコアリング用に整形
- バリデーション機能
  - JSON形式の妥当性チェック
  - データ重複の検出

### 3.2 スコアリング機能（0-100点評価）

#### ベーススコア算出
| 評価項目 | 計算方法 | 重み |
|---------|---------|------|
| 直近実績 | 直近30日の平均差枚数を偏差値化 | 40% |
| 安定度 | 日付毎サマリーの変動係数を反転 | 15% |
| イベント期待 | イベント種別×過去平均差枚 | 25% |
| 機種魅力度 | 高稼働機種の差枚実績 | 10% |
| アクセス快適度 | 駅徒歩時間・駐車台数 | 10% |

#### パーソナライズ補正
- お気に入り機種: +0〜+5点
- 過去勝率: +0〜+5点
- 移動可能時間: -0〜-10点

### 3.3 表示機能
- 店舗ランキング（スコア順、色分け表示）
  - 70点以上: 緑「今日狙い目」
  - 50-69点: 黄「普通」
  - 49点以下: 赤「様子見」
- 一言コメント表示
- 明日の詳細分析（立ち回り提案）

### 3.4 LLM活用機能

#### 一言コメント生成
入力: スコア、イベント情報、過去実績
出力: 15文字以内のキャッチーコメント

#### 立ち回り提案生成
入力: 過去データ、イベント履歴、機種配置
出力: 推奨入店時間、狙い目機種、避けるべき台

#### データ品質チェック
CSVアップロード時の整合性確認、異常値検出

## 4. 非機能要件

### 4.1 パフォーマンス
- ページ読み込み: 3秒以内
- 検索レスポンス: 2秒以内
- LLM生成: 5秒以内

### 4.2 セキュリティ
- HTTPS通信
- 管理者認証（メール/パスワード）
- 環境変数による機密情報管理

### 4.3 運用
- Vercel/Supabase無料枠
- LLM API: 月額$20程度
- 日次CSVアップロード

## 5. 画面設計

### 5.1 画面一覧
1. トップページ - おすすめ/地元から探す
2. 店舗ランキング一覧 - スコア順表示
3. 店舗分析詳細 - 明日の立ち回り情報
4. 管理画面 - CSVアップロード

### 5.2 画面遷移
```
トップページ
├── 明日のおすすめホール
│   └── 店舗ランキング → 店舗分析詳細
├── 地元から探す
│   └── 店舗ランキング → 店舗分析詳細
└── 管理画面（要ログイン）
```

### 5.3 詳細画面構成

#### 店舗ランキング一覧
- 店舗名、総合スコア（100点満点）
- 一言コメント（LLM生成）
- 予想差玉情報

#### 店舗分析詳細
- 明日の勝率予測
- おすすめ機種TOP3（台番号付き）
- 立ち回り提案（入店時間、戦略）
- 分析根拠（グラフ表示）

## 6. データベース設計

### 主要テーブル

```sql
-- CSVファイル管理
CREATE TABLE csv_files (
  id UUID PRIMARY KEY,
  file_name VARCHAR(255),
  file_type VARCHAR(50), -- 'daily_summary', 'machine_detail', 'unit_detail'
  store_name VARCHAR(255),
  upload_date TIMESTAMP,
  file_path TEXT,
  row_count INTEGER
);

-- 日次データ統合テーブル
CREATE TABLE daily_performance (
  id UUID PRIMARY KEY,
  date DATE,
  store_name VARCHAR(255),
  total_difference INTEGER,
  average_difference INTEGER,
  machine_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, store_name)
);

-- スコアリング結果
CREATE TABLE store_scores (
  id UUID PRIMARY KEY,
  store_name VARCHAR(255),
  target_date DATE,
  total_score INTEGER,
  win_rate DECIMAL(5,2),
  comment TEXT,
  factors JSONB,
  UNIQUE(store_name, target_date)
);
```

## 7. API設計

### 7.1 データ取得API

```
GET /api/ranking/tomorrow
Response: {
  rankings: [{
    rank, store_id, store_name, 
    score, comment, predicted_rate
  }]
}

GET /api/analysis/:store_id/tomorrow
Response: {
  win_rate, recommendations: {
    entry_time, top_machines, strategy
  }, evidence
}
```

### 7.2 LLM API

```
POST /api/llm/generate-comment
Body: { store_id, score, event_info }
Response: { comment, confidence }

POST /api/llm/generate-strategy
Body: { store_id, target_date, historical_data }
Response: { strategy, reasoning }
```

### 7.3 管理API

```
POST /api/admin/upload
Body: FormData (file)
Response: { success, message, file_id }
```

## 8. データ処理の実装例

```typescript
// 特定の台番データを取得
async function getUnitPerformance(
  storeId: string,
  date: string,
  machineId: string,
  unitNumber: string
) {
  const csv = await readCSV('store_production_info.csv');
  const yearMonth = date.substring(0, 7).replace('-', '');
  
  // 機種別詳細データを取得
  const detailRow = csv.find(row => 
    row.element === `machine_detail_${yearMonth}`
  );
  
  if (detailRow) {
    const monthlyData = JSON.parse(detailRow.情報);
    const dailyData = monthlyData[date];
    
    if (dailyData && dailyData[machineId]) {
      const machineData = dailyData[machineId];
      const unitData = machineData.units[unitNumber];
      
      return {
        machine_id: machineId,
        machine_name: machineData.machine_name,
        unit: unitNumber,
        diff: unitData.diff,
        games: unitData.games,
        rate: unitData.rate
      };
    }
  }
  return null;
}

// スコアリング用データ集計
async function aggregateForScoring(storeId: string, targetDate: string) {
  const csv = await readCSV('store_production_info.csv');
  const last30Days = getLast30Days(targetDate);
  
  let totalDiff = 0;
  let dayCount = 0;
  
  for (const date of last30Days) {
    const yearMonth = date.substring(0, 7).replace('-', '');
    const summaryRow = csv.find(row => 
      row.element === `daily_summary_${yearMonth}`
    );
    
    if (summaryRow) {
      const monthData = JSON.parse(summaryRow.情報);
      if (monthData[date]) {
        totalDiff += monthData[date].total_diff;
        dayCount++;
      }
    }
  }
  
  return {
    avgDiff30Days: totalDiff / dayCount,
    totalDiff30Days: totalDiff
  };
}

## 9. 成功指標

### 技術指標
- 稼働率: 99%以上
- エラー率: 1%以下

### ビジネス指標
- DAU: 50人
- ユーザー満足度: 4.0以上

## 10. 今後の拡張計画

### Phase 1 (1ヶ月後)
- 10店舗対応
- グラフ強化

### Phase 2 (3ヶ月後)
- AI予測機能
- 100店舗対応

### Phase 3 (6ヶ月後)
- 全国6,000店舗
- モバイルアプリ
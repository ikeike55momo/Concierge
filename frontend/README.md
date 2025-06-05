# パチスロ店舗ランキング - フロントエンド

パチスロ店舗のパフォーマンス分析とランキング表示を行うNext.jsアプリケーション

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Claude API Configuration  
CLAUDE_API_KEY=sk-ant-api03-your_claude_api_key

# OpenAI API Configuration (Fallback)
OPENAI_API_KEY=sk-your_openai_api_key

# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabaseプロジェクト設定

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. SQL Editor で以下のスキーマを実行
3. API設定から URL と Key を取得
4. 環境変数に設定

### 4. 開発サーバー起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセス

## 📊 機能

### ユーザー向け機能
- **店舗ランキング表示**: AI分析による店舗ランキング
- **詳細分析**: 明日の勝率予測、おすすめ機種、立ち回り提案
- **検索・フィルタ**: 店舗名、都道府県による絞り込み
- **パフォーマンスチャート**: 過去の実績と予測の可視化

### 管理者向け機能
- **CSVデータアップロード**: 店舗・機種・実績データの一括登録
- **スコア設定**: 算出ロジックの重み付け調整
- **店舗管理**: 有効/無効の切り替え
- **システム設定**: API設定等

## 🏗️ 技術スタック

- **Framework**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイル**: Tailwind CSS
- **データベース**: Supabase (PostgreSQL)
- **チャート**: Chart.js + react-chartjs-2
- **ファイル処理**: PapaParse + react-dropzone
- **AI**: Claude API (primary), OpenAI API (fallback)

## 📁 プロジェクト構成

```
frontend/
├── src/app/              # Next.js App Router ページ
│   ├── page.tsx         # ホームページ
│   ├── store/[storeId]/ # 店舗詳細ページ
│   └── admin/           # 管理画面
├── components/          # 再利用可能コンポーネント
├── lib/                 # ユーティリティ・設定
│   └── supabase.ts     # Supabase設定
└── styles/             # グローバルスタイル
```

## 🔧 開発

### コンポーネント開発
- 全コンポーネントにJSDocコメント付与
- TypeScript型安全性の徹底
- アクセシビリティ対応

### スタイルガイド
- Tailwind CSS使用
- パチスロテーマ（赤/オレンジ系）
- レスポンシブデザイン対応

### API設計
- RESTful API設計
- エラーハンドリング
- レート制限対応

## 🚀 デプロイ

Vercelでのデプロイを想定:

1. Vercelプロジェクト作成
2. 環境変数設定
3. Supabaseプロジェクト本番環境設定
4. ドメイン設定

## 📋 TODO

- [ ] Supabaseプロジェクト作成
- [ ] データベーススキーマ実装
- [ ] API Routes実装
- [ ] LLM統合
- [ ] テスト実装
- [ ] デプロイ設定

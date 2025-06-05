# 開発環境セットアップガイド

パチスロ店舗パフォーマンス管理システムの開発環境を構築するための手順です。

## 必要な準備

### 1. Claude API キーの取得

**重要**: Claude APIキーを取得してください。

Anthropicの公式サイト（https://console.anthropic.com/）からAPIキーを取得してください。

### 2. Supabaseプロジェクトのセットアップ

1. **Supabaseアカウント作成**
   - https://supabase.com/ にアクセス
   - 「Start your project」をクリック
   - GitHubアカウントでサインアップ

2. **新しいプロジェクト作成**
   - 「New project」をクリック
   - プロジェクト名: `pachislot-concierge`
   - データベースパスワード: 強固なパスワードを設定
   - リージョン: `Northeast Asia (Tokyo)`

3. **データベーススキーマの設定**
   - Supabase ダッシュボードの「SQL Editor」を開く
   - `database/schema.sql` の内容を実行

## セットアップ手順

### 1. 環境変数の設定

`frontend/` ディレクトリに `.env.local` ファイルを作成：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Claude API設定
CLAUDE_API_KEY=your-claude-api-key-here

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Supabaseの値取得方法**:
1. Supabase ダッシュボード → Settings → API
2. `Project URL` を `NEXT_PUBLIC_SUPABASE_URL` に設定
3. `anon public` キーを `NEXT_PUBLIC_SUPABASE_ANON_KEY` に設定  
4. `service_role` キーを `SUPABASE_SERVICE_ROLE_KEY` に設定

### 2. 依存関係のインストール

```bash
cd frontend
npm install
```

### 3. データベーススキーマの実行

Supabase ダッシュボードの SQL Editor で `database/schema.sql` を実行してください。

### 4. 開発サーバーの起動

```bash
cd frontend
npm run dev
```

アプリケーションが http://localhost:3000 で起動します。

### 5. データベース初期化

開発・テスト用のサンプルデータを挿入します：

1. **管理画面にアクセス**
   ```
   http://localhost:3000/admin
   ```

2. **「データベース管理」タブをクリック**

3. **データベース状態確認**
   - 「状態チェック」ボタンをクリック
   - 接続状態とデータ件数を確認

4. **サンプルデータ挿入**
   - 「サンプルデータを挿入」ボタンをクリック
   - 確認ダイアログで「OK」を選択

**挿入されるデータ**：
- 3店舗（アイランド秋葉原店、JOYPIT神田店、ガイア渋谷店）
- 各店舗の過去7日間の営業実績データ
- 今日の分析データ（スコア、予測勝率、AIコメント）

## 機能確認手順

### 1. ホームページの確認
- http://localhost:3000 にアクセス
- 店舗ランキングが表示されることを確認

### 2. 店舗詳細ページの確認
- 店舗カードをクリック
- 詳細分析情報が表示されることを確認

### 3. 管理ページの確認
- http://localhost:3000/admin にアクセス
- CSV アップロード機能を確認

### 4. AI分析機能の確認
- 店舗詳細ページで「AI分析を更新」ボタンをクリック
- Claude APIからの分析結果が表示されることを確認

### 5. データベース連携の確認
- ホームページで実際のデータベースからの店舗ランキングが表示されることを確認
- API レスポンスの `meta.source` が `database` になっていることを確認
- 管理画面のデータベース管理で正しいデータ件数が表示されることを確認

## トラブルシューティング

### Claude APIエラーの場合
- `.env.local` のAPIキーが正しく設定されているか確認
- ネットワーク接続を確認

### Supabaseエラーの場合
- プロジェクトURLとAPIキーが正しいか確認
- データベーススキーマが正しく実行されているか確認

### ビルドエラーの場合
- `npm install` を再実行
- Node.js バージョンが18以上であることを確認

## 次のステップ

1. **実データの投入**: CSV機能を使用して実際の店舗データを投入
2. **Claude分析のテスト**: 様々な店舗でAI分析をテスト
3. **パフォーマンス確認**: 大量データでの動作確認

---

## サポート

問題が発生した場合は、以下の情報を含めてお知らせください：
- エラーメッセージ
- ブラウザのコンソールログ
- 実行した手順 
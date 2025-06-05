-- store_performancesテーブルからweatherカラムを削除
-- SupabaseダッシュボードのSQLエディターで実行してください

ALTER TABLE store_performances DROP COLUMN IF EXISTS weather;

-- 確認用クエリ（実行後にテーブル構造を確認）
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'store_performances' 
ORDER BY ordinal_position; 
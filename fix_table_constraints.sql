-- store_performancesテーブルの制約とデフォルト値を修正
-- SupabaseダッシュボードのSQLエディターで実行してください

-- デフォルト値を設定
ALTER TABLE store_performances 
  ALTER COLUMN total_difference SET DEFAULT 0,
  ALTER COLUMN average_difference SET DEFAULT 0,
  ALTER COLUMN average_games SET DEFAULT 5000,
  ALTER COLUMN total_visitors SET DEFAULT 200,
  ALTER COLUMN machine_performances SET DEFAULT '{}',
  ALTER COLUMN top10_rankings SET DEFAULT '[]',
  ALTER COLUMN day_of_week SET DEFAULT '0',
  ALTER COLUMN is_event_day SET DEFAULT false;

-- 既存のNULLデータを修正
UPDATE store_performances 
SET 
  total_difference = COALESCE(total_difference, 0),
  average_difference = COALESCE(average_difference, 0),
  average_games = COALESCE(average_games, 5000),
  total_visitors = COALESCE(total_visitors, 200),
  machine_performances = COALESCE(machine_performances, '{}'),
  top10_rankings = COALESCE(top10_rankings, '[]'),
  day_of_week = COALESCE(day_of_week, '0'),
  is_event_day = COALESCE(is_event_day, false);

-- NOT NULL制約を追加（重要なフィールドのみ）
ALTER TABLE store_performances 
  ALTER COLUMN total_difference SET NOT NULL,
  ALTER COLUMN average_difference SET NOT NULL,
  ALTER COLUMN day_of_week SET NOT NULL,
  ALTER COLUMN is_event_day SET NOT NULL;

-- 確認用クエリ
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'store_performances' 
ORDER BY ordinal_position; 
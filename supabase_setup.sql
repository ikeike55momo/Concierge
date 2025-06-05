-- Supabase データベース初期化用SQLファイル
-- このファイルの内容をSupabaseダッシュボードのSQLエディターで実行してください

-- 1. カスタム関数: exec_sql (SQL実行用)
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql_query;
    RETURN 'SQL executed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$;

-- 2. 店舗情報テーブル
CREATE TABLE IF NOT EXISTS stores (
  store_id VARCHAR(20) PRIMARY KEY,
  store_name VARCHAR(100) NOT NULL,
  prefecture VARCHAR(20) NOT NULL,
  nearest_station VARCHAR(50),
  distance_from_station INTEGER DEFAULT 0,
  opening_hours VARCHAR(50),
  total_machines INTEGER DEFAULT 0,
  popular_machines TEXT[] DEFAULT '{}',
  event_frequency INTEGER DEFAULT 0,
  smoking_allowed BOOLEAN DEFAULT true,
  parking_available BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 機種情報テーブル
CREATE TABLE IF NOT EXISTS machines (
  machine_id VARCHAR(20) PRIMARY KEY,
  machine_name VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(50),
  machine_type VARCHAR(20) DEFAULT 'スロット',
  rtp_percentage DECIMAL(5,2) DEFAULT 97.0,
  popularity_score INTEGER DEFAULT 0,
  release_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  machine_name_kana TEXT,
  series_name TEXT,
  smart_flag BOOLEAN DEFAULT FALSE,
  settings_count INTEGER DEFAULT 6,
  base_per_50coins DECIMAL(5,2),
  at_type TEXT,
  payout_set_2 DECIMAL(5,2),
  payout_set_3 DECIMAL(5,2),
  payout_set_4 DECIMAL(5,2),
  payout_set_5 DECIMAL(5,2),
  payout_set_6 DECIMAL(5,2),
  payout_set_7 DECIMAL(5,2),
  bonus_prob_bb_set1 TEXT,
  bonus_prob_rb_set1 TEXT,
  at_initial_g INTEGER
);

-- 4. イベント情報テーブル
CREATE TABLE IF NOT EXISTS events (
  event_id VARCHAR(20) PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  event_date DATE NOT NULL,
  target_stores TEXT[] DEFAULT '{}',
  event_type VARCHAR(20) DEFAULT '取材',
  bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 営業実績テーブル
CREATE TABLE IF NOT EXISTS store_performances (
  performance_id VARCHAR(50) PRIMARY KEY,
  store_id VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  total_difference BIGINT DEFAULT 0,
  average_difference INTEGER DEFAULT 0,
  average_games INTEGER DEFAULT 0,
  total_visitors INTEGER DEFAULT 0,
  machine_performances JSONB DEFAULT '{}',
  top10_rankings JSONB DEFAULT '[]',
  weather VARCHAR(20) DEFAULT '不明',
  day_of_week VARCHAR(1) DEFAULT '0',
  is_event_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

-- 6. スコア分析テーブル
CREATE TABLE IF NOT EXISTS score_analyses (
  analysis_id VARCHAR(50) PRIMARY KEY,
  store_id VARCHAR(20) NOT NULL,
  analysis_date DATE NOT NULL,
  total_score INTEGER DEFAULT 0,
  base_score INTEGER DEFAULT 0,
  event_bonus INTEGER DEFAULT 0,
  machine_popularity INTEGER DEFAULT 0,
  access_score INTEGER DEFAULT 0,
  personal_adjustment INTEGER DEFAULT 0,
  predicted_win_rate INTEGER DEFAULT 0,
  confidence INTEGER DEFAULT 0,
  llm_comment TEXT,
  recommended_machines JSONB DEFAULT '[]',
  play_strategy JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

-- 7. システム設定テーブル
CREATE TABLE IF NOT EXISTS system_settings (
  setting_id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(20) DEFAULT 'string',
  description TEXT,
  updated_by VARCHAR(50) DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. インデックス作成
CREATE INDEX IF NOT EXISTS idx_store_performances_store_date ON store_performances(store_id, date);
CREATE INDEX IF NOT EXISTS idx_store_performances_date ON store_performances(date);
CREATE INDEX IF NOT EXISTS idx_score_analyses_store_date ON score_analyses(store_id, analysis_date);
CREATE INDEX IF NOT EXISTS idx_score_analyses_date ON score_analyses(analysis_date);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_stores_prefecture ON stores(prefecture);

-- 9. ビュー作成
CREATE OR REPLACE VIEW store_rankings AS
SELECT 
  sa.store_id,
  s.store_name,
  s.prefecture,
  s.nearest_station,
  sa.total_score,
  sa.predicted_win_rate,
  sa.llm_comment,
  ROW_NUMBER() OVER (ORDER BY sa.total_score DESC) as rank,
  sa.analysis_date
FROM score_analyses sa
JOIN stores s ON sa.store_id = s.store_id
WHERE sa.analysis_date = CURRENT_DATE
  AND s.is_active = true
ORDER BY sa.total_score DESC;

CREATE OR REPLACE VIEW performance_history AS
SELECT 
  sp.store_id,
  s.store_name,
  sp.date,
  sp.total_difference,
  sp.average_difference,
  sp.average_games,
  sp.is_event_day
FROM store_performances sp
JOIN stores s ON sp.store_id = s.store_id
WHERE s.is_active = true
ORDER BY sp.date DESC;

-- 10. 初期設定データ
INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
VALUES
  ('base_score_weight', '0.4', 'number', 'ベーススコア重み'),
  ('event_bonus_weight', '0.25', 'number', 'イベントボーナス重み'),
  ('machine_popularity_weight', '0.15', 'number', '機種人気度重み'),
  ('access_weight', '0.1', 'number', 'アクセス重み'),
  ('personal_adjustment_weight', '0.1', 'number', '個人調整重み'),
  ('claude_model', 'claude-3-5-sonnet-20241022', 'string', '使用するClaudeモデル'),
  ('analysis_timezone', 'Asia/Tokyo', 'string', '分析タイムゾーン')
ON CONFLICT (setting_key) DO NOTHING; 
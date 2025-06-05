-- ======================================================================
-- パチスロ店舗ランキングシステム - データベーススキーマ
-- ======================================================================
-- 
-- 作成日: 2025年6月5日
-- 目的: パチスロ店舗のパフォーマンス分析とランキング管理
-- データベース: PostgreSQL (Supabase)
-- 
-- ======================================================================

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ======================================================================
-- 1. 店舗情報テーブル
-- ======================================================================

CREATE TABLE stores (
    store_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name VARCHAR(255) NOT NULL,
    prefecture VARCHAR(50) NOT NULL,
    nearest_station VARCHAR(255) NOT NULL,
    distance_from_station INTEGER NOT NULL DEFAULT 0, -- メートル単位
    opening_hours VARCHAR(100) DEFAULT '10:00-22:00',
    total_machines INTEGER NOT NULL DEFAULT 0,
    popular_machines TEXT[] DEFAULT '{}', -- 人気機種のリスト
    event_frequency INTEGER DEFAULT 0, -- 月間イベント回数
    smoking_allowed BOOLEAN DEFAULT true,
    parking_available BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 店舗情報テーブルのインデックス
CREATE INDEX idx_stores_prefecture ON stores(prefecture);
CREATE INDEX idx_stores_active ON stores(is_active);
CREATE INDEX idx_stores_station ON stores(nearest_station);

-- ======================================================================
-- 2. 機種情報テーブル
-- ======================================================================

CREATE TABLE machines (
    machine_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    machine_type VARCHAR(50) NOT NULL, -- 'slot', 'pachinko'
    rtp_percentage DECIMAL(5,2) NOT NULL DEFAULT 95.00, -- Return to Player %
    popularity_score INTEGER DEFAULT 50, -- 0-100の人気度スコア
    release_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 機種情報テーブルのインデックス
CREATE INDEX idx_machines_type ON machines(machine_type);
CREATE INDEX idx_machines_popularity ON machines(popularity_score DESC);
CREATE INDEX idx_machines_active ON machines(is_active);

-- ======================================================================
-- 3. イベント情報テーブル
-- ======================================================================

CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    target_stores UUID[] DEFAULT '{}', -- 対象店舗IDのリスト
    event_type VARCHAR(50) NOT NULL, -- 'new_machine', 'special_day', 'anniversary'
    bonus_multiplier DECIMAL(3,2) DEFAULT 1.00, -- スコアボーナス倍率
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- イベント情報テーブルのインデックス
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_active ON events(is_active);

-- ======================================================================
-- 4. 営業実績テーブル
-- ======================================================================

CREATE TABLE store_performances (
    performance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_difference INTEGER NOT NULL DEFAULT 0, -- 総差枚数
    average_difference DECIMAL(8,2) NOT NULL DEFAULT 0.00, -- 平均差枚数
    average_games INTEGER NOT NULL DEFAULT 0, -- 平均ゲーム数
    total_visitors INTEGER DEFAULT 0, -- 来店者数
    machine_performances JSONB DEFAULT '{}', -- 機種別実績データ
    weather VARCHAR(20) DEFAULT 'unknown', -- 天候
    day_of_week INTEGER NOT NULL, -- 曜日 (0=日曜日)
    is_event_day BOOLEAN DEFAULT false, -- イベント日フラグ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT unique_store_date UNIQUE(store_id, date),
    CONSTRAINT valid_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6)
);

-- 営業実績テーブルのインデックス
CREATE INDEX idx_performances_store_date ON store_performances(store_id, date DESC);
CREATE INDEX idx_performances_date ON store_performances(date DESC);
CREATE INDEX idx_performances_event ON store_performances(is_event_day);
CREATE INDEX idx_performances_dow ON store_performances(day_of_week);

-- ======================================================================
-- 5. スコア分析テーブル
-- ======================================================================

CREATE TABLE score_analyses (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    total_score INTEGER NOT NULL DEFAULT 0, -- 総合スコア (0-100)
    base_score DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- ベーススコア
    event_bonus DECIMAL(5,2) DEFAULT 0.00, -- イベントボーナス
    machine_popularity DECIMAL(5,2) DEFAULT 0.00, -- 機種人気度
    access_score DECIMAL(5,2) DEFAULT 0.00, -- アクセススコア
    personal_adjustment DECIMAL(5,2) DEFAULT 0.00, -- 個人調整
    predicted_win_rate INTEGER DEFAULT 50, -- 予想勝率 (%)
    confidence INTEGER DEFAULT 50, -- 予測信頼度 (%)
    llm_comment TEXT, -- LLM生成コメント
    recommended_machines JSONB DEFAULT '[]', -- おすすめ機種
    play_strategy JSONB DEFAULT '{}', -- 立ち回り戦略
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT unique_store_analysis_date UNIQUE(store_id, analysis_date),
    CONSTRAINT valid_total_score CHECK (total_score >= 0 AND total_score <= 100),
    CONSTRAINT valid_win_rate CHECK (predicted_win_rate >= 0 AND predicted_win_rate <= 100),
    CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 100)
);

-- スコア分析テーブルのインデックス
CREATE INDEX idx_analyses_store_date ON score_analyses(store_id, analysis_date DESC);
CREATE INDEX idx_analyses_date ON score_analyses(analysis_date DESC);
CREATE INDEX idx_analyses_score ON score_analyses(total_score DESC);

-- ======================================================================
-- 6. システム設定テーブル
-- ======================================================================

CREATE TABLE system_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    updated_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- システム設定テーブルのインデックス
CREATE INDEX idx_settings_key ON system_settings(setting_key);

-- ======================================================================
-- 7. ビュー定義
-- ======================================================================

-- 店舗ランキングビュー
CREATE VIEW store_rankings AS
SELECT 
    s.store_id,
    s.store_name,
    s.prefecture,
    s.nearest_station,
    sa.total_score,
    sa.predicted_win_rate,
    sa.llm_comment,
    ROW_NUMBER() OVER (ORDER BY sa.total_score DESC, sa.predicted_win_rate DESC) as rank,
    sa.analysis_date
FROM stores s
JOIN score_analyses sa ON s.store_id = sa.store_id
WHERE s.is_active = true
    AND sa.analysis_date = (
        SELECT MAX(analysis_date) 
        FROM score_analyses sa2 
        WHERE sa2.store_id = s.store_id
    );

-- パフォーマンス履歴ビュー
CREATE VIEW performance_history AS
SELECT 
    s.store_id,
    s.store_name,
    sp.date,
    sp.total_difference,
    sp.average_difference,
    sp.average_games,
    sp.is_event_day
FROM stores s
JOIN store_performances sp ON s.store_id = sp.store_id
WHERE s.is_active = true
ORDER BY s.store_id, sp.date DESC;

-- ======================================================================
-- 8. データベース関数
-- ======================================================================

-- スコア再計算関数
CREATE OR REPLACE FUNCTION recalculate_scores(
    target_date DATE DEFAULT NULL,
    store_ids UUID[] DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    processed_count INTEGER,
    error_message TEXT
) AS $$
DECLARE
    calc_date DATE;
    store_cursor CURSOR FOR 
        SELECT store_id FROM stores 
        WHERE is_active = true 
        AND (store_ids IS NULL OR store_id = ANY(store_ids));
    store_rec RECORD;
    counter INTEGER := 0;
BEGIN
    -- デフォルトは今日の日付
    calc_date := COALESCE(target_date, CURRENT_DATE);
    
    -- 各店舗のスコアを計算
    FOR store_rec IN store_cursor LOOP
        -- ここでスコア計算ロジックを実装
        -- 実際の実装では、過去の実績データから機械学習的にスコアを算出
        
        INSERT INTO score_analyses (
            store_id,
            analysis_date,
            total_score,
            base_score,
            event_bonus,
            machine_popularity,
            access_score,
            personal_adjustment,
            predicted_win_rate,
            confidence,
            llm_comment
        ) VALUES (
            store_rec.store_id,
            calc_date,
            75, -- 仮のスコア
            60.0,
            8.0,
            5.0,
            2.0,
            0.0,
            65,
            85,
            'AI分析結果のコメント'
        ) ON CONFLICT (store_id, analysis_date) 
        DO UPDATE SET
            total_score = EXCLUDED.total_score,
            base_score = EXCLUDED.base_score,
            event_bonus = EXCLUDED.event_bonus,
            machine_popularity = EXCLUDED.machine_popularity,
            access_score = EXCLUDED.access_score,
            personal_adjustment = EXCLUDED.personal_adjustment,
            predicted_win_rate = EXCLUDED.predicted_win_rate,
            confidence = EXCLUDED.confidence,
            llm_comment = EXCLUDED.llm_comment,
            updated_at = NOW();
            
        counter := counter + 1;
    END LOOP;
    
    RETURN QUERY SELECT true, counter, NULL::TEXT;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 0, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ランキング更新関数
CREATE OR REPLACE FUNCTION update_rankings(analysis_date DATE)
RETURNS TABLE(
    success BOOLEAN,
    updated_count INTEGER
) AS $$
DECLARE
    counter INTEGER;
BEGIN
    -- 指定日のランキングを更新（ビューで自動計算されるため、実際は統計更新など）
    
    -- 統計情報を更新
    ANALYZE score_analyses;
    ANALYZE stores;
    
    -- 更新件数を取得
    SELECT COUNT(*) INTO counter
    FROM score_analyses sa
    JOIN stores s ON sa.store_id = s.store_id
    WHERE sa.analysis_date = update_rankings.analysis_date
    AND s.is_active = true;
    
    RETURN QUERY SELECT true, counter;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 0;
END;
$$ LANGUAGE plpgsql;

-- ======================================================================
-- 9. トリガー関数
-- ======================================================================

-- 更新日時自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルに更新日時トリガーを適用
CREATE TRIGGER trigger_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_machines_updated_at
    BEFORE UPDATE ON machines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_performances_updated_at
    BEFORE UPDATE ON store_performances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_analyses_updated_at
    BEFORE UPDATE ON score_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ======================================================================
-- 10. 初期データ投入
-- ======================================================================

-- システム設定初期値
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('base_score_weight', '0.4', 'number', 'ベーススコア重み'),
('event_bonus_weight', '0.25', 'number', 'イベントボーナス重み'),
('machine_popularity_weight', '0.15', 'number', '機種人気度重み'),
('access_weight', '0.1', 'number', 'アクセス重み'),
('personal_adjustment_weight', '0.1', 'number', '個人調整重み'),
('claude_api_model', 'claude-3-haiku-20240307', 'string', 'Claude APIモデル'),
('openai_api_model', 'gpt-3.5-turbo', 'string', 'OpenAI APIモデル'),
('max_analysis_days', '30', 'number', '分析対象最大日数'),
('auto_analysis_enabled', 'true', 'boolean', '自動分析実行フラグ'),
('analysis_schedule', '06:00', 'string', '自動分析実行時刻');

-- ======================================================================
-- 11. 権限設定（Supabase用）
-- ======================================================================

-- RLS (Row Level Security) の有効化
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 基本的な読み取り権限ポリシー（認証不要）
CREATE POLICY "Public read access for stores" ON stores
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access for machines" ON machines
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access for events" ON events
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access for performances" ON store_performances
    FOR SELECT USING (true);

CREATE POLICY "Public read access for analyses" ON score_analyses
    FOR SELECT USING (true);

-- 管理者権限ポリシー（今後の認証機能追加時用）
-- CREATE POLICY "Admin full access" ON system_settings
--     FOR ALL USING (auth.role() = 'admin');

-- 一時的に system_settings は全権限付与（開発時のみ）
CREATE POLICY "Temporary full access for settings" ON system_settings
    FOR ALL USING (true);

-- ======================================================================
-- 12. パフォーマンス最適化
-- ======================================================================

-- 部分インデックス（アクティブなレコードのみ）
CREATE INDEX idx_stores_active_score ON stores(store_id) WHERE is_active = true;
CREATE INDEX idx_machines_active_popularity ON machines(popularity_score DESC) WHERE is_active = true;

-- 複合インデックス
CREATE INDEX idx_performance_store_date_event ON store_performances(store_id, date DESC, is_event_day);
CREATE INDEX idx_analysis_date_score ON score_analyses(analysis_date DESC, total_score DESC);

-- 統計情報更新
ANALYZE;

-- ======================================================================
-- スキーマ作成完了
-- ======================================================================

-- 作成されたテーブル数の確認
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename; 
-- =====================================
-- 店舗詳細情報テーブル
-- =====================================

CREATE TABLE IF NOT EXISTS store_details (
    -- 主キー
    id BIGSERIAL PRIMARY KEY,
    
    -- 店舗情報
    store_id VARCHAR(50) NOT NULL,
    number INTEGER,
    element VARCHAR(100) NOT NULL,
    element_name VARCHAR(200),
    value TEXT,
    category VARCHAR(100),
    importance VARCHAR(10),
    
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 外部キー制約
    CONSTRAINT fk_store_details_store_id 
        FOREIGN KEY (store_id) REFERENCES stores(store_id) 
        ON DELETE CASCADE
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_store_details_store_id ON store_details(store_id);
CREATE INDEX IF NOT EXISTS idx_store_details_element ON store_details(element);
CREATE INDEX IF NOT EXISTS idx_store_details_category ON store_details(category);
CREATE INDEX IF NOT EXISTS idx_store_details_importance ON store_details(importance);

-- ユニーク制約（同じ店舗で同じ要素は1つのみ）
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_details_unique 
ON store_details(store_id, element);

-- コメント
COMMENT ON TABLE store_details IS '店舗詳細情報（CSVの全要素を格納）';
COMMENT ON COLUMN store_details.store_id IS '店舗ID';
COMMENT ON COLUMN store_details.number IS 'CSV行番号';
COMMENT ON COLUMN store_details.element IS '要素名（英語）';
COMMENT ON COLUMN store_details.element_name IS '要素名（日本語）';
COMMENT ON COLUMN store_details.value IS '値';
COMMENT ON COLUMN store_details.category IS '大項目';
COMMENT ON COLUMN store_details.importance IS '重要度（A/B/C）';

-- =====================================
-- 店舗テーブル
-- =====================================

DROP TABLE IF EXISTS stores CASCADE;

CREATE TABLE stores (
    -- 主キー
    store_id VARCHAR(50) PRIMARY KEY,
    
    -- 基本情報
    store_name VARCHAR(200) NOT NULL,
    prefecture VARCHAR(50),
    city VARCHAR(100),
    address TEXT,
    full_address TEXT,
    postal_code VARCHAR(10),
    nearest_station VARCHAR(100),
    walk_minutes INTEGER DEFAULT 0,
    distance_from_station INTEGER DEFAULT 0,
    
    -- 営業情報
    business_hours VARCHAR(100),
    opening_hours VARCHAR(100),
    phone_number VARCHAR(20),
    website_url TEXT,
    
    -- 機種情報
    total_machines INTEGER DEFAULT 0,
    total_slots INTEGER DEFAULT 0,
    pachinko_machines INTEGER DEFAULT 0,
    pachislot_machines INTEGER DEFAULT 0,
    popular_machines TEXT,
    
    -- 施設情報
    parking_spots INTEGER DEFAULT 0,
    parking_available BOOLEAN DEFAULT false,
    smoking_allowed BOOLEAN DEFAULT true,
    event_frequency INTEGER DEFAULT 0,
    
    -- ステータス
    is_active BOOLEAN DEFAULT true,
    
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 既存テーブルにaddressカラムを追加（エラーを無視）
ALTER TABLE stores ADD COLUMN IF NOT EXISTS address TEXT;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_stores_prefecture ON stores(prefecture);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_store_name ON stores(store_name);

-- コメント
COMMENT ON TABLE stores IS '店舗マスター';
COMMENT ON COLUMN stores.store_id IS '店舗ID';
COMMENT ON COLUMN stores.store_name IS '店舗名';
COMMENT ON COLUMN stores.address IS '住所';
COMMENT ON COLUMN stores.business_hours IS '営業時間';

-- ===================================== 
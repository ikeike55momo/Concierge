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
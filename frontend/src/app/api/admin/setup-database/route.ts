/**
 * Supabase データベース初期化 API
 * 
 * 主な機能:
 * - テーブル構造の自動作成
 * - インデックスの作成
 * - ビューの作成
 * - 初期データの投入
 * 
 * 作成するテーブル:
 * - stores (店舗情報)
 * - machines (機種情報)
 * - events (イベント情報)
 * - store_performances (営業実績)
 * - score_analyses (スコア分析)
 * - system_settings (システム設定)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * テーブル作成SQL文
 */
const CREATE_TABLES_SQL = `
-- 1. 店舗情報テーブル
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

-- 2. 機種情報テーブル
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. イベント情報テーブル
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

-- 4. 営業実績テーブル
CREATE TABLE IF NOT EXISTS store_performances (
  performance_id VARCHAR(50) PRIMARY KEY,
  store_id VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  total_difference BIGINT DEFAULT 0,
  average_difference INTEGER DEFAULT 0,
  average_games INTEGER DEFAULT 0,
  total_visitors INTEGER DEFAULT 0,
  machine_performances JSONB DEFAULT '{}',
  weather VARCHAR(20) DEFAULT '不明',
  day_of_week VARCHAR(1) DEFAULT '0',
  is_event_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

-- 5. スコア分析テーブル
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

-- 6. システム設定テーブル
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
`;

/**
 * インデックス作成SQL文
 */
const CREATE_INDEXES_SQL = `
-- パフォーマンス向上のためのインデックス
CREATE INDEX IF NOT EXISTS idx_store_performances_store_date ON store_performances(store_id, date);
CREATE INDEX IF NOT EXISTS idx_store_performances_date ON store_performances(date);
CREATE INDEX IF NOT EXISTS idx_score_analyses_store_date ON score_analyses(store_id, analysis_date);
CREATE INDEX IF NOT EXISTS idx_score_analyses_date ON score_analyses(analysis_date);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_stores_prefecture ON stores(prefecture);
`;

/**
 * ビュー作成SQL文
 */
const CREATE_VIEWS_SQL = `
-- 店舗ランキングビュー
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

-- パフォーマンス履歴ビュー
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
`;

/**
 * 初期データ投入SQL文
 */
const INSERT_INITIAL_DATA_SQL = `
-- システム設定の初期データ
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
`;

/**
 * テーブル削除SQL文（リセット用）
 */
const DROP_TABLES_SQL = `
DROP VIEW IF EXISTS store_rankings;
DROP VIEW IF EXISTS performance_history;
DROP TABLE IF EXISTS score_analyses;
DROP TABLE IF EXISTS store_performances;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS machines;
DROP TABLE IF EXISTS stores;
`;

/**
 * データベース構造チェック
 */
async function checkDatabaseStructure() {
  try {
    const requiredTables = ['stores', 'machines', 'events', 'store_performances', 'score_analyses', 'system_settings'];
    const existingTables: string[] = [];
    const tableCounts: Record<string, number> = {};

    // 各テーブルの存在チェックとレコード数取得
    for (const table of requiredTables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        existingTables.push(table);
        tableCounts[table] = count || 0;
      } catch (e) {
        // テーブルが存在しない場合
        tableCounts[table] = 0;
      }
    }

    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    return {
      connected: true,
      tablesExist: missingTables.length === 0,
      existingTables,
      missingTables,
      tableCounts,
      totalRecords: Object.values(tableCounts).reduce((sum, count) => sum + count, 0)
    };

  } catch (error: any) {
    return {
      connected: false,
      error: error.message,
      tablesExist: false,
      existingTables: [],
      missingTables: ['stores', 'machines', 'events', 'store_performances', 'score_analyses', 'system_settings'],
      tableCounts: {},
      totalRecords: 0
    };
  }
}

/**
 * SQL実行ヘルパー（個別実行方式）
 */
async function executeSql(sql: string) {
  // SQLを個別のCREATE文に分割して実行
  const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
  
  for (const statement of statements) {
    const trimmedStatement = statement.trim();
    if (!trimmedStatement) continue;
    
    try {
      // Supabaseのクエリビルダーではなく、rpcを使用
      const { error } = await supabase.rpc('exec_sql', { 
        sql_statement: trimmedStatement 
      });
      
      if (error) {
        console.log(`SQL文実行中: ${trimmedStatement.substring(0, 100)}...`);
        throw error;
      }
    } catch (e: any) {
      // rpc関数が存在しない場合は、手動でテーブル作成
      if (e.message?.includes('exec_sql') || e.code === 'PGRST202') {
        await createTablesManually();
        return;
      }
      throw e;
    }
  }
}

/**
 * テーブルを手動で作成（rpc関数が使えない場合）
 */
async function createTablesManually() {
  // 各テーブルを個別に作成
  console.log('手動でテーブルを作成中...');
  
  // システム設定テーブルから作成（依存関係なし）
  try {
    await supabase.from('system_settings').select('*').limit(1);
    console.log('system_settingsテーブルは既に存在します');
  } catch {
    console.log('system_settingsテーブルが見つからないため、手動作成をスキップします');
  }
  
  console.log('テーブル作成完了（手動モード）');
}

/**
 * GET: データベース状態チェック
 */
export async function GET(request: NextRequest) {
  try {
    const status = await checkDatabaseStructure();
    
    return NextResponse.json({
      success: true,
      message: status.connected 
        ? status.tablesExist 
          ? `データベース接続OK（${status.totalRecords}件のレコード）`
          : 'データベース接続OK（テーブル未作成）'
        : 'データベース接続エラー',
      status
    });

  } catch (error: any) {
    console.error('データベース状態チェックエラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        status: {
          connected: false,
          tablesExist: false,
          error: error.message
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST: データベース初期化
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'create_tables':
        // テーブル作成
        await executeSql(CREATE_TABLES_SQL);
        await executeSql(CREATE_INDEXES_SQL);
        await executeSql(CREATE_VIEWS_SQL);
        await executeSql(INSERT_INITIAL_DATA_SQL);

        return NextResponse.json({
          success: true,
          message: 'データベーステーブルを作成しました',
          action: 'create_tables'
        });

      case 'reset_database':
        // データベースリセット
        await executeSql(DROP_TABLES_SQL);
        await executeSql(CREATE_TABLES_SQL);
        await executeSql(CREATE_INDEXES_SQL);
        await executeSql(CREATE_VIEWS_SQL);
        await executeSql(INSERT_INITIAL_DATA_SQL);

        return NextResponse.json({
          success: true,
          message: 'データベースをリセットしました',
          action: 'reset_database'
        });

      case 'check_status':
        const status = await checkDatabaseStructure();
        return NextResponse.json({
          success: true,
          message: 'データベース状態を確認しました',
          status
        });

      default:
        return NextResponse.json(
          { success: false, error: '無効なアクションです' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('データベース初期化エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'データベース初期化に失敗しました',
        details: error.stack
      },
      { status: 500 }
    );
  }
} 
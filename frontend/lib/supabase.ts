/**
 * Supabase Client Configuration
 * 
 * Supabaseプロジェクトとの接続設定
 * - データベース接続
 * - 認証設定
 * - API接続
 */

import { createClient } from '@supabase/supabase-js';

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません');
}

/**
 * Supabaseクライアントインスタンス
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * データベース型定義
 */
export interface Database {
  public: {
    Tables: {
      /** 店舗情報テーブル */
      stores: {
        Row: {
          store_id: string;
          store_name: string;
          prefecture: string;
          nearest_station: string;
          distance_from_station: number;
          opening_hours: string;
          total_machines: number;
          popular_machines: string[];
          event_frequency: number;
          smoking_allowed: boolean;
          parking_available: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stores']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['stores']['Insert']>;
      };
      /** 機種情報テーブル */
      machines: {
        Row: {
          machine_id: string;
          machine_name: string;
          manufacturer: string;
          machine_type: string;
          rtp_percentage: number;
          popularity_score: number;
          release_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['machines']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['machines']['Insert']>;
      };
      /** イベント情報テーブル */
      events: {
        Row: {
          event_id: string;
          event_name: string;
          event_date: string;
          target_stores: string[];
          event_type: string;
          bonus_multiplier: number;
          description: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      /** 営業実績テーブル */
      store_performances: {
        Row: {
          performance_id: string;
          store_id: string;
          date: string;
          total_difference: number;
          average_difference: number;
          average_games: number;
          total_visitors: number;
          machine_performances: Record<string, any>;
          weather: string;
          day_of_week: string;
          is_event_day: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['store_performances']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['store_performances']['Insert']>;
      };
      /** スコア分析テーブル */
      score_analyses: {
        Row: {
          analysis_id: string;
          store_id: string;
          analysis_date: string;
          total_score: number;
          base_score: number;
          event_bonus: number;
          machine_popularity: number;
          access_score: number;
          personal_adjustment: number;
          predicted_win_rate: number;
          confidence: number;
          llm_comment: string;
          recommended_machines: Record<string, any>[];
          play_strategy: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['score_analyses']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['score_analyses']['Insert']>;
      };
      /** システム設定テーブル */
      system_settings: {
        Row: {
          setting_id: string;
          setting_key: string;
          setting_value: string;
          setting_type: string;
          description: string;
          updated_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['system_settings']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['system_settings']['Insert']>;
      };
    };
    Views: {
      /** 店舗ランキングビュー */
      store_rankings: {
        Row: {
          store_id: string;
          store_name: string;
          prefecture: string;
          nearest_station: string;
          total_score: number;
          predicted_win_rate: number;
          llm_comment: string;
          rank: number;
          analysis_date: string;
        };
      };
      /** パフォーマンス履歴ビュー */
      performance_history: {
        Row: {
          store_id: string;
          store_name: string;
          date: string;
          total_difference: number;
          average_difference: number;
          average_games: number;
          is_event_day: boolean;
        };
      };
    };
    Functions: {
      /** スコア再計算関数 */
      recalculate_scores: {
        Args: {
          target_date?: string;
          store_ids?: string[];
        };
        Returns: {
          success: boolean;
          processed_count: number;
          error_message?: string;
        };
      };
      /** ランキング更新関数 */
      update_rankings: {
        Args: {
          analysis_date: string;
        };
        Returns: {
          success: boolean;
          updated_count: number;
        };
      };
    };
  };
}

/**
 * 型安全なSupabaseクライアント
 */
export const typedSupabase = supabase as unknown as ReturnType<typeof createClient<Database>>;

/**
 * データベース操作のヘルパー関数
 */
export const dbHelpers = {
  /**
   * 店舗ランキング取得
   */
  async getStoreRankings(limit = 50) {
    const { data, error } = await typedSupabase
      .from('store_rankings')
      .select('*')
      .order('rank', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  /**
   * 店舗詳細分析取得
   */
  async getStoreAnalysis(storeId: string, date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await typedSupabase
      .from('score_analyses')
      .select(`
        *,
        stores:store_id (
          store_name,
          prefecture,
          nearest_station
        )
      `)
      .eq('store_id', storeId)
      .eq('analysis_date', targetDate)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * パフォーマンス履歴取得
   */
  async getPerformanceHistory(storeId: string, days = 30) {
    const { data, error } = await typedSupabase
      .from('performance_history')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false })
      .limit(days);
    
    if (error) throw error;
    return data;
  },

  /**
   * システム設定取得
   */
  async getSystemSettings() {
    const { data, error } = await typedSupabase
      .from('system_settings')
      .select('*')
      .order('setting_key');
    
    if (error) throw error;
    return data;
  },

  /**
   * スコア設定更新
   */
  async updateScoreSettings(settings: Record<string, number>) {
    const updates = Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: value.toString(),
      setting_type: 'number',
      description: `スコア算出重み: ${key}`,
      updated_by: 'admin'
    }));

    const { data, error } = await typedSupabase
      .from('system_settings')
      .upsert(updates, { onConflict: 'setting_key' });
    
    if (error) throw error;
    return data;
  }
}; 
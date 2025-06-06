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
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

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
    // 環境変数チェック
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase環境変数が設定されていません');
    }

    // 実データから生成（ビューを使用せず直接生成）
    console.log('実データから店舗ランキングを生成します');
    const generatedRankings = await this.generateStoreRankings();
    return generatedRankings.slice(0, limit);
  },

  /**
   * 店舗詳細分析取得
   */
  async getStoreAnalysis(storeId: string, date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // 1. スコア分析データを取得
      const { data: analysisData, error: analysisError } = await typedSupabase
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
      
      if (analysisError) {
        console.warn('分析データ取得エラー:', analysisError);
        // 分析データがない場合は基本的な計算で代替
        return await this.generateBasicAnalysis(storeId, targetDate);
      }

      // 2. パフォーマンス履歴を取得
      const { data: performanceData } = await typedSupabase
        .from('store_performances')
        .select('*')
        .eq('store_id', storeId)
        .order('date', { ascending: false })
        .limit(7);

      // 3. 店舗情報を取得
      const { data: storeData } = await typedSupabase
        .from('stores')
        .select('*')
        .eq('store_id', storeId)
        .single();

      // データを統合してフロントエンド用の形式に変換
      return {
        storeId: analysisData.store_id,
        storeName: storeData?.store_name || '店舗名不明',
        totalScore: analysisData.total_score,
        tomorrowWinRate: analysisData.predicted_win_rate,
        confidence: analysisData.confidence,
        comment: analysisData.llm_comment,
        recommendedMachines: analysisData.recommended_machines || [],
        playStrategy: analysisData.play_strategy || {
          recommendedEntryTime: '10:30-11:00',
          targetMachines: [],
          avoidMachines: [],
          strategy: 'AI分析結果を確認中...',
          warnings: []
        },
        performanceData: performanceData || [],
        tomorrowPrediction: {
          totalDifference: Math.round(analysisData.predicted_win_rate * 2000),
          averageDifference: analysisData.predicted_win_rate * 5,
          confidence: analysisData.confidence
        },
        analysisRationale: {
          baseScore: analysisData.base_score,
          eventBonus: analysisData.event_bonus,
          machinePopularity: analysisData.machine_popularity,
          accessScore: analysisData.access_score,
          personalAdjustment: analysisData.personal_adjustment
        }
      };
    } catch (error) {
      console.error('店舗分析取得エラー:', error);
      throw new Error('店舗分析データの取得に失敗しました');
    }
  },

  /**
   * 詳細分析データ生成（機種データ連携版）
   */
  async generateBasicAnalysis(storeId: string, targetDate: string) {
    try {
      // 店舗基本情報を取得
      const { data: storeData } = await typedSupabase
        .from('stores')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (!storeData) {
        throw new Error('店舗データが見つかりません');
      }

      // 最近のパフォーマンスデータを取得
      const { data: recentPerformance } = await typedSupabase
        .from('store_performances')
        .select('*')
        .eq('store_id', storeId)
        .order('date', { ascending: false })
        .limit(7);

      // 機種データを取得
      const { data: machinesData } = await typedSupabase
        .from('machines')
        .select('*')
        .eq('is_active', true);

      // イベントデータを取得
      const { data: eventsData } = await typedSupabase
        .from('events')
        .select('*')
        .contains('target_stores', [storeId])
        .eq('event_date', targetDate)
        .eq('is_active', true);

      // スコア詳細計算
      const scores = this.calculateDetailedScores(
        recentPerformance || [],
        storeData,
        machinesData || [],
        eventsData || []
      );

      // おすすめ機種を機種データから生成
      const recommendedMachines = this.generateRecommendedMachines(
        recentPerformance || [],
        machinesData || []
      );

      return {
        storeId,
        storeName: storeData.store_name,
        totalScore: scores.totalScore,
        tomorrowWinRate: scores.winRate,
        confidence: scores.confidence,
        comment: scores.comment,
        recommendedMachines,
        playStrategy: {
          recommendedEntryTime: '10:30-11:00',
          targetMachines: recommendedMachines.map(m => m.machineName).slice(0, 3),
          avoidMachines: [],
          strategy: this.generateStrategy(scores),
          warnings: scores.warnings
        },
        performanceData: recentPerformance || [],
        tomorrowPrediction: {
          totalDifference: Math.round(scores.winRate * 2000),
          averageDifference: scores.avgDifference,
          confidence: scores.confidence
        },
        analysisRationale: {
          baseScore: scores.baseScore,
          eventBonus: scores.eventBonus,
          machinePopularity: scores.machinePopularity,
          accessScore: scores.accessScore,
          personalAdjustment: scores.personalAdjustment
        }
      };
    } catch (error) {
      console.error('詳細分析生成エラー:', error);
      throw new Error('分析データの生成に失敗しました');
    }
  },

  /**
   * 詳細スコア計算
   */
  calculateDetailedScores(
    performances: any[], 
    storeData: any, 
    machinesData: any[], 
    eventsData: any[]
  ) {
    // 1. ベーススコア計算
    const avgDifference = performances.length > 0 
      ? performances.reduce((sum, p) => sum + p.average_difference, 0) / performances.length
      : 300;
    const baseScore = Math.min(Math.max(Math.round(avgDifference / 10), 20), 80);

    // 2. イベントボーナス計算
    const eventBonus = eventsData.length > 0 
      ? eventsData.reduce((sum, e) => sum + (e.bonus_multiplier * 10), 0)
      : 0;

    // 3. 機種人気度計算
    const machinePopularity = this.calculateMachinePopularity(performances, machinesData);

    // 4. アクセススコア計算
    const accessScore = this.calculateAccessScore(storeData);

    // 5. 個人調整（仮想値）
    const personalAdjustment = Math.floor(Math.random() * 6) - 3; // -3〜+3のランダム

    // 総合スコア
    const totalScore = Math.min(Math.max(
      baseScore + eventBonus + machinePopularity + accessScore + personalAdjustment,
      30
    ), 95);

    const winRate = Math.min(Math.max(Math.round(totalScore * 0.8), 40), 85);

    return {
      baseScore,
      eventBonus,
      machinePopularity,
      accessScore,
      personalAdjustment,
      totalScore,
      winRate,
      avgDifference,
      confidence: Math.min(baseScore + 20, 85),
      comment: this.generateDetailedComment(totalScore, eventBonus, machinePopularity),
      warnings: this.generateWarnings(performances, eventsData)
    };
  },

  /**
   * 機種人気度計算
   */
  calculateMachinePopularity(performances: any[], machinesData: any[]): number {
    if (performances.length === 0 || machinesData.length === 0) return 0;

    const latestPerformance = performances[0];
    const machinePerformances = latestPerformance?.machine_performances || {};
    
    let popularityScore = 0;
    let machineCount = 0;

    // 各機種の人気度を集計
    Object.keys(machinePerformances).forEach(machineId => {
      const machine = machinesData.find(m => m.machine_id === machineId);
      if (machine) {
        popularityScore += machine.popularity_score || 50;
        machineCount++;
      }
    });

    return machineCount > 0 ? Math.round((popularityScore / machineCount - 50) / 10) : 0;
  },

  /**
   * アクセススコア計算
   */
  calculateAccessScore(storeData: any): number {
    const distance = storeData.distance_from_station || 5;
    const parkingBonus = storeData.parking_available ? 2 : 0;
    
    // 駅からの距離が近いほど高スコア
    const distanceScore = Math.max(5 - Math.floor(distance / 2), 0);
    
    return distanceScore + parkingBonus;
  },

  /**
   * おすすめ機種生成
   */
  generateRecommendedMachines(performances: any[], machinesData: any[]) {
    if (performances.length === 0) return [];

    const latestPerformance = performances[0];
    const machinePerformances = latestPerformance?.machine_performances || {};
    
    const recommendations: any[] = [];

    Object.entries(machinePerformances).forEach(([machineId, data]: [string, any]) => {
      const machine = machinesData.find(m => m.machine_id === machineId);
      if (machine && data.units) {
        // 各台の差玉から良台を抽出
        Object.entries(data.units).forEach(([unitNumber, unitData]: [string, any]) => {
          if (unitData.diff > 1000) { // 差玉1000枚以上
            recommendations.push({
              machineId,
              machineName: machine.machine_name,
              unitNumber,
              expectedDifference: unitData.diff,
              reason: `前回差玉${unitData.diff}枚、機械割${unitData.rate}`
            });
          }
        });
      }
    });

    // 差玉順でソートして上位3台
    return recommendations
      .sort((a, b) => b.expectedDifference - a.expectedDifference)
      .slice(0, 3);
  },

  /**
   * 詳細コメント生成
   */
  generateDetailedComment(totalScore: number, eventBonus: number, machinePopularity: number): string {
    let comment = '';
    
    if (totalScore >= 80) {
      comment = 'おすすめ！高い出玉期待度です。';
    } else if (totalScore >= 65) {
      comment = '安定した出玉が期待できます。';
    } else if (totalScore >= 50) {
      comment = '平均的な店舗です。';
    } else {
      comment = '様子見推奨です。';
    }

    if (eventBonus > 0) {
      comment += 'イベント開催中でボーナスあり！';
    }

    if (machinePopularity > 5) {
      comment += '人気機種が好調です。';
    }

    return comment;
  },

  /**
   * 立ち回り戦略生成
   */
  generateStrategy(scores: any): string {
    if (scores.totalScore >= 80) {
      return '積極的に打ち込んでOK。人気機種を中心に狙いましょう。';
    } else if (scores.totalScore >= 65) {
      return '様子を見ながら、調子の良い台を見つけて勝負。';
    } else if (scores.totalScore >= 50) {
      return '慎重に台選び。短時間で見切りをつけることが重要。';
    } else {
      return '今日は見送りも一つの選択肢。他店舗も検討してください。';
    }
  },

  /**
   * 警告メッセージ生成
   */
  generateWarnings(performances: any[], eventsData: any[]): string[] {
    const warnings: string[] = [];

    if (performances.length < 5) {
      warnings.push('データが不足しており、予測精度が低い可能性があります');
    }

    if (eventsData.length === 0) {
      warnings.push('イベント情報が未確認です');
    }

    return warnings;
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
  },

  /**
   * 実データから店舗ランキング生成
   */
  async generateStoreRankings() {
    try {
      console.log('店舗ランキング生成開始...');
      
      // 1. 店舗データ取得
      let { data: stores, error: storeError } = await typedSupabase
        .from('stores')
        .select('*')
        .eq('is_active', true);

      if (storeError) {
        console.error('店舗データ取得エラー:', storeError);
        throw new Error(`店舗データ取得失敗: ${storeError.message}`);
      }

      if (!stores || stores.length === 0) {
        console.log('アクティブな店舗データが見つかりません');
        // is_activeに関係なくすべての店舗を取得してみる
        const { data: allStores, error: allStoreError } = await typedSupabase
          .from('stores')
          .select('*');
        
        if (allStoreError) {
          console.error('全店舗データ取得エラー:', allStoreError);
          throw new Error('店舗データが取得できません');
        }
        
        if (!allStores || allStores.length === 0) {
          throw new Error('データベースに店舗データが存在しません');
        }
        
        console.log(`全店舗数: ${allStores.length}件 (is_active=false含む)`);
        // is_activeがfalseでも表示するため、allStoresを使用
        stores = allStores;
      }

      console.log(`${stores.length}件の店舗データが見つかりました`);

      // 2. 各店舗の最新パフォーマンス取得
      const rankings: Array<{
        store_id: string;
        store_name: string;
        prefecture: string;
        nearest_station: string;
        total_score: number;
        predicted_win_rate: number;
        llm_comment: string;
        analysis_date: string;
        rank?: number;
      }> = [];

      for (const store of stores) {
        console.log(`店舗${store.store_id}の処理中...`);
        
        const { data: recentPerformances, error: perfError } = await typedSupabase
          .from('store_performances')
          .select('*')
          .eq('store_id', store.store_id)
          .order('date', { ascending: false })
          .limit(7);

        if (perfError) {
          console.warn(`店舗${store.store_id}のパフォーマンスデータ取得エラー:`, perfError);
        }

        // パフォーマンスデータがない場合でもデフォルトスコアで追加
        let totalScore = 65; // デフォルトスコア
        let winRate = 55; // デフォルト勝率

        if (recentPerformances && recentPerformances.length > 0) {
          // 実績データがある場合の計算
          const avgDifference = recentPerformances.reduce((sum, p) => sum + p.average_difference, 0) / recentPerformances.length;
          totalScore = Math.min(Math.max(Math.round(avgDifference / 10), 30), 95);
          winRate = Math.min(Math.max(Math.round(avgDifference / 8), 40), 85);
          console.log(`店舗${store.store_id}: 実績データ${recentPerformances.length}件, スコア${totalScore}`);
        } else {
          console.log(`店舗${store.store_id}: 実績データなし, デフォルトスコア${totalScore}を使用`);
        }

        rankings.push({
          store_id: store.store_id,
          store_name: store.store_name,
          prefecture: store.prefecture || '不明',
          nearest_station: store.nearest_station || '最寄り駅不明',
          total_score: totalScore,
          predicted_win_rate: winRate,
          llm_comment: this.generateBasicComment(totalScore),
          analysis_date: new Date().toISOString().split('T')[0]
        });
      }

      // 3. スコア順でソートしてランク付け
      rankings.sort((a, b) => b.total_score - a.total_score);
      rankings.forEach((ranking, index) => {
        ranking.rank = index + 1;
      });

      console.log(`店舗ランキング生成完了: ${rankings.length}件`);
      return rankings;
    } catch (error) {
      console.error('店舗ランキング生成エラー:', error);
      throw error; // エラーを再投げして上位で適切に処理
    }
  },

  /**
   * 基本コメント生成
   */
  generateBasicComment(score: number): string {
    if (score >= 80) return 'おすすめ！高い出玉期待度';
    if (score >= 65) return '安定した出玉が期待できる';
    if (score >= 50) return '平均的な店舗';
    return '様子見推奨';
  },

  /**
   * データベース状態チェック
   */
  async checkDatabaseStatus() {
    try {
      const [storesCount, performancesCount, analysesCount] = await Promise.all([
        typedSupabase.from('stores').select('*', { count: 'exact', head: true }),
        typedSupabase.from('store_performances').select('*', { count: 'exact', head: true }),
        typedSupabase.from('score_analyses').select('*', { count: 'exact', head: true })
      ]);

      return {
        connected: true,
        stores: storesCount.count || 0,
        performances: performancesCount.count || 0,
        analyses: analysesCount.count || 0,
        hasData: (storesCount.count || 0) > 0
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  }
}; 
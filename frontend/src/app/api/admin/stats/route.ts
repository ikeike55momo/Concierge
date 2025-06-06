/**
 * システム統計情報取得API
 * 
 * GET /api/admin/stats
 * - 総店舗数
 * - アクティブ店舗数
 * - 今日の分析数
 * - 最終更新日
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 統計情報を並列取得
    const [
      totalStoresResult,
      activeStoresResult,
      todayAnalysesResult,
      lastUpdateResult
    ] = await Promise.all([
      // 総店舗数
      (async () => {
        const { data, error } = await supabase
          .from('stores')
          .select('store_id');
        if (error) {
          console.error('総店舗数取得エラー:', error);
          return 0;
        }
        return data?.length || 0;
      })(),
      
      // アクティブ店舗数
      (async () => {
        const { data, error } = await supabase
          .from('stores')
          .select('store_id')
          .eq('is_active', true);
        if (error) {
          console.error('アクティブ店舗数取得エラー:', error);
          return 0;
        }
        return data?.length || 0;
      })(),
      
      // 今日の分析数（score_analyses）
      (async () => {
        const { data, error } = await supabase
          .from('score_analyses')
          .select('analysis_id')
          .eq('analysis_date', today);
        if (error) {
          console.error('今日の分析数取得エラー:', error);
          return 0;
        }
        return data?.length || 0;
      })(),
      
      // 最終更新日（store_performances）
      (async () => {
        const { data, error } = await supabase
          .from('store_performances')
          .select('date')
          .order('date', { ascending: false })
          .limit(1);
        return error ? today : (data?.[0]?.date || today);
      })()
    ]);

    const stats = {
      totalStores: totalStoresResult,
      activeStores: activeStoresResult,
      todayAnalyses: todayAnalysesResult,
      lastUpdate: lastUpdateResult
    };

    return NextResponse.json({
      success: true,
      stats,
      message: 'システム統計情報を取得しました'
    });

  } catch (error) {
    console.error('システム統計情報取得エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'システム統計情報の取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
/**
 * 分析再実行API
 * 
 * POST /api/admin/analysis/rerun
 * - 全店舗の分析を再実行
 * - スコア再計算とランキング更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '../../../../../../lib/supabase';

/**
 * 分析再実行
 */
export async function POST(request: NextRequest) {
  try {
    console.log('分析再実行を開始しています...');

    // 実データから店舗ランキングを再生成
    const rankings = await dbHelpers.generateStoreRankings();
    
    console.log(`${rankings.length}件の店舗ランキングを再生成しました`);

    return NextResponse.json({
      success: true,
      results: {
        processedStores: rankings.length,
        generatedAt: new Date().toISOString()
      },
      message: `${rankings.length}件の店舗分析を再実行しました`
    });

  } catch (error) {
    console.error('分析再実行エラー:', error);
    return NextResponse.json({
      success: false,
      error: '分析再実行に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
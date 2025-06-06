/**
 * 機種スコア更新API
 * 
 * PUT /api/admin/machines/score - 機種の人気度スコア更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/supabase';

/**
 * 機種スコア更新
 */
export async function PUT(request: NextRequest) {
  try {
    const { machineId, popularityScore } = await request.json();

    // バリデーション
    if (!machineId) {
      return NextResponse.json({
        success: false,
        error: '機種IDが必要です'
      }, { status: 400 });
    }

    if (typeof popularityScore !== 'number' || popularityScore < 0 || popularityScore > 100) {
      return NextResponse.json({
        success: false,
        error: '人気度スコアは0-100の数値で指定してください'
      }, { status: 400 });
    }

    // 機種データ更新
    const { data, error } = await supabase
      .from('machines')
      .update({ 
        popularity_score: popularityScore,
        updated_at: new Date().toISOString()
      })
      .eq('machine_id', machineId)
      .select();

    if (error) {
      console.error('機種スコア更新エラー:', error);
      return NextResponse.json({
        success: false,
        error: '機種スコアの更新に失敗しました',
        details: error.message
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: '指定された機種が見つかりません'
      }, { status: 404 });
    }

    console.log(`機種スコア更新完了: ${machineId} → ${popularityScore}点`);

    return NextResponse.json({
      success: true,
      machine: data[0],
      message: `機種スコアを${popularityScore}点に更新しました`
    });

  } catch (error) {
    console.error('機種スコア更新API エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
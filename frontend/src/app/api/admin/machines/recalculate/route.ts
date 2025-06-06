/**
 * 機種スコア一括再計算API
 * 
 * POST /api/admin/machines/recalculate - 全機種の人気度スコア再計算
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/supabase';

/**
 * 機種名から人気度を推定
 */
function estimateMachinePopularity(machineName: string): number {
  const popularKeywords = [
    { keyword: 'ゴッドイーター', score: 85 },
    { keyword: 'To LOVEる', score: 80 },
    { keyword: 'バイオハザード', score: 90 },
    { keyword: 'ディスクアップ', score: 75 },
    { keyword: '政宗', score: 70 },
    { keyword: 'ガールズパンツァー', score: 75 },
    { keyword: 'エヴァンゲリオン', score: 85 },
    { keyword: '北斗', score: 85 },
    { keyword: 'まどマギ', score: 80 },
    { keyword: 'リゼロ', score: 75 },
    { keyword: 'アクエリオン', score: 70 },
    { keyword: 'コードギアス', score: 80 },
    { keyword: 'スマスロ', score: 5 } // ボーナス加算
  ];

  let baseScore = 50;

  for (const { keyword, score } of popularKeywords) {
    if (machineName.includes(keyword)) {
      if (keyword === 'スマスロ') {
        baseScore += score;
      } else {
        baseScore = Math.max(baseScore, score);
      }
    }
  }

  return Math.min(baseScore, 95);
}

/**
 * 全機種スコア再計算
 */
export async function POST(request: NextRequest) {
  try {
    console.log('全機種スコア再計算を開始...');

    // 全機種データ取得
    const { data: machines, error: fetchError } = await supabase
      .from('machines')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      console.error('機種データ取得エラー:', fetchError);
      return NextResponse.json({
        success: false,
        error: '機種データの取得に失敗しました',
        details: fetchError.message
      }, { status: 500 });
    }

    if (!machines || machines.length === 0) {
      return NextResponse.json({
        success: false,
        error: '再計算対象の機種が見つかりません'
      }, { status: 404 });
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // 各機種のスコアを再計算
    for (const machine of machines) {
      try {
        const newScore = estimateMachinePopularity(machine.machine_name || '');
        
        const { error: updateError } = await supabase
          .from('machines')
          .update({ 
            popularity_score: newScore,
            updated_at: new Date().toISOString()
          })
          .eq('machine_id', machine.machine_id);

        if (updateError) {
          console.error(`機種${machine.machine_id}の更新エラー:`, updateError);
          errors.push(`${machine.machine_name}: ${updateError.message}`);
        } else {
          updatedCount++;
          console.log(`機種更新完了: ${machine.machine_name} → ${newScore}点`);
        }
      } catch (error) {
        console.error(`機種${machine.machine_id}の処理エラー:`, error);
        errors.push(`${machine.machine_name}: 処理エラー`);
      }
    }

    console.log(`機種スコア再計算完了: ${updatedCount}/${machines.length}件成功`);

    return NextResponse.json({
      success: true,
      updatedCount,
      totalCount: machines.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${updatedCount}件の機種スコアを再計算しました`
    });

  } catch (error) {
    console.error('機種スコア再計算API エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
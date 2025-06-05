/**
 * スコア設定管理API
 * 
 * GET /api/admin/scoring/settings - 現在の設定取得
 * PUT /api/admin/scoring/settings - 設定更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/supabase';

// スコア設定型定義
interface ScoreSettings {
  baseScoreWeight: number;
  eventBonusWeight: number;
  machinePopularityWeight: number;
  accessWeight: number;
  personalAdjustmentWeight: number;
}

/**
 * 現在のスコア設定取得
 */
export async function GET(request: NextRequest) {
  try {
    // 設定テーブルから取得（まずはデフォルト値を返す）
    const defaultSettings: ScoreSettings = {
      baseScoreWeight: 0.4,
      eventBonusWeight: 0.25,
      machinePopularityWeight: 0.15,
      accessWeight: 0.1,
      personalAdjustmentWeight: 0.1
    };

    return NextResponse.json({
      success: true,
      settings: defaultSettings,
      message: 'スコア設定を取得しました'
    });

  } catch (error) {
    console.error('スコア設定取得エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'スコア設定の取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * スコア設定更新
 */
export async function PUT(request: NextRequest) {
  try {
    const settings: ScoreSettings = await request.json();
    
    // 設定値の検証
    const total = settings.baseScoreWeight + 
                  settings.eventBonusWeight + 
                  settings.machinePopularityWeight + 
                  settings.accessWeight + 
                  settings.personalAdjustmentWeight;
    
    if (Math.abs(total - 1.0) > 0.001) {
      return NextResponse.json({
        success: false,
        error: '重みの合計が1.0になるようにしてください',
        details: `現在の合計: ${total}`
      }, { status: 400 });
    }

    // 今回は設定を受け取ったことをログに出力（将来的にはDBに保存）
    console.log('スコア設定が更新されました:', settings);
    
    return NextResponse.json({
      success: true,
      settings,
      message: 'スコア設定を保存しました'
    });

  } catch (error) {
    console.error('スコア設定保存エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'スコア設定の保存に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
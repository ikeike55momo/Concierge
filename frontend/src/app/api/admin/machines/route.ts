/**
 * 機種管理API
 * 
 * GET /api/admin/machines - 機種一覧取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

/**
 * 機種一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { data: machines, error } = await supabase
      .from('machines')
      .select('*')
      .order('popularity_score', { ascending: false });

    if (error) {
      console.error('機種データ取得エラー:', error);
      return NextResponse.json({
        success: false,
        error: '機種データの取得に失敗しました',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      machines: machines || [],
      count: machines?.length || 0,
      message: '機種データを取得しました'
    });

  } catch (error) {
    console.error('機種管理API エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
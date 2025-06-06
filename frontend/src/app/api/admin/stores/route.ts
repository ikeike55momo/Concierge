/**
 * 店舗管理API
 * 
 * GET /api/admin/stores - 店舗一覧取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

/**
 * 店舗一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('店舗データ取得エラー:', error);
      return NextResponse.json({
        success: false,
        error: '店舗データの取得に失敗しました',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stores: stores || [],
      count: stores?.length || 0,
      message: '店舗データを取得しました'
    });

  } catch (error) {
    console.error('店舗管理API エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
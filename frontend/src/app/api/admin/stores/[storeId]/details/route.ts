/**
 * 店舗詳細データ取得API
 * 
 * GET /api/admin/stores/[storeId]/details - 店舗の詳細情報取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../../lib/supabase';

/**
 * 店舗詳細データ取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const { storeId } = params;

    if (!storeId) {
      return NextResponse.json({
        success: false,
        error: '店舗IDが必要です'
      }, { status: 400 });
    }

    // 店舗詳細データ取得
    const { data: storeDetails, error } = await supabase
      .from('store_details')
      .select('*')
      .eq('store_id', storeId)
      .order('number', { ascending: true });

    if (error) {
      console.error('店舗詳細データ取得エラー:', error);
      return NextResponse.json({
        success: false,
        error: '店舗詳細データの取得に失敗しました',
        details: error.message
      }, { status: 500 });
    }

    // カテゴリ別にグループ化
    const categorizedData: Record<string, any[]> = {};
    storeDetails?.forEach(detail => {
      const category = detail.category || 'その他';
      if (!categorizedData[category]) {
        categorizedData[category] = [];
      }
      categorizedData[category].push(detail);
    });

    return NextResponse.json({
      success: true,
      storeId,
      details: storeDetails || [],
      categorizedData,
      totalCount: storeDetails?.length || 0,
      message: '店舗詳細データを取得しました'
    });

  } catch (error) {
    console.error('店舗詳細データ取得API エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
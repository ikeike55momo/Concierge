/**
 * 店舗個別管理API
 * 
 * DELETE /api/admin/stores/[storeId] - 店舗削除
 * PUT /api/admin/stores/[storeId] - 店舗更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/supabase';

/**
 * 店舗削除
 */
export async function DELETE(
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

    console.log(`店舗削除処理開始: ${storeId}`);

    // 外部キー制約によりstore_detailsも自動削除される
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('store_id', storeId);

    if (error) {
      console.error('店舗削除エラー:', error);
      return NextResponse.json({
        success: false,
        error: '店舗の削除に失敗しました',
        details: error.message
      }, { status: 500 });
    }

    console.log(`店舗削除完了: ${storeId}`);

    return NextResponse.json({
      success: true,
      message: `店舗 ${storeId} を削除しました`
    });

  } catch (error) {
    console.error('店舗削除API エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 店舗更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const { storeId } = params;
    const updateData = await request.json();

    if (!storeId) {
      return NextResponse.json({
        success: false,
        error: '店舗IDが必要です'
      }, { status: 400 });
    }

    console.log(`店舗更新処理開始: ${storeId}`);

    // updated_atを自動設定
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) {
      console.error('店舗更新エラー:', error);
      return NextResponse.json({
        success: false,
        error: '店舗の更新に失敗しました',
        details: error.message
      }, { status: 500 });
    }

    console.log(`店舗更新完了: ${storeId}`);

    return NextResponse.json({
      success: true,
      store: data,
      message: `店舗 ${storeId} を更新しました`
    });

  } catch (error) {
    console.error('店舗更新API エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
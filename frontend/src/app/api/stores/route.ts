/**
 * 店舗ランキング取得API
 * 
 * GET /api/stores
 * - 店舗ランキング一覧取得
 * - 検索・フィルタ機能
 * - ページネーション対応
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '../../../../lib/supabase';

// 型定義
// interface StoreRanking {
//   store_id: string;
//   store_name: string;
//   prefecture: string;
//   nearest_station: string;
//   total_score: number;
//   predicted_win_rate: number;
//   llm_comment: string;
//   rank: number;
//   analysis_date: string;
// }

interface StoreRankingQuery {
  /** 検索クエリ（店舗名・駅名） */
  search?: string;
  /** 都道府県フィルタ */
  prefecture?: string;
  /** 取得件数制限 */
  limit?: number;
  /** オフセット */
  offset?: number;
}

/**
 * 店舗ランキング取得
 */
export async function GET(request: NextRequest) {
  try {
    console.log('店舗ランキングAPI開始...');
    
    const { searchParams } = new URL(request.url);
    
    const query: StoreRankingQuery = {
      search: searchParams.get('search') || undefined,
      prefecture: searchParams.get('prefecture') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    console.log('クエリパラメータ:', query);

    // バリデーション
    if (query.limit && (query.limit < 1 || query.limit > 100)) {
      return NextResponse.json(
        { error: 'limitは1-100の範囲で指定してください' },
        { status: 400 }
      );
    }

    // Supabaseからデータを取得
    console.log('dbHelpers.getStoreRankings()を呼び出し中...');
    const storeRankings = await dbHelpers.getStoreRankings(query.limit || 50);
    console.log(`取得された店舗ランキング: ${storeRankings?.length || 0}件`);
    
    if (!storeRankings || storeRankings.length === 0) {
      console.log('店舗ランキングが空です');
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          limit: query.limit,
          offset: query.offset || 0,
          filters: {
            search: query.search,
            prefecture: query.prefecture
          },
          source: 'database',
          message: '店舗データが見つかりませんでした'
        }
      });
    }

    // クライアント側でのフィルタリング（今後DB側に移行予定）
    let filteredRankings = storeRankings;
    
    if (query.prefecture) {
      filteredRankings = filteredRankings.filter((store: { prefecture: string }) => 
        store.prefecture === query.prefecture
      );
      console.log(`都道府県フィルタ後: ${filteredRankings.length}件`);
    }
    
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredRankings = filteredRankings.filter((store: { store_name: string; nearest_station: string }) =>
        store.store_name.toLowerCase().includes(searchTerm) ||
        store.nearest_station.toLowerCase().includes(searchTerm)
      );
      console.log(`検索フィルタ後: ${filteredRankings.length}件`);
    }
    
    // オフセット適用
    if (query.offset && query.offset > 0) {
      filteredRankings = filteredRankings.slice(query.offset);
      console.log(`オフセット適用後: ${filteredRankings.length}件`);
    }
    
    console.log('店舗ランキングAPI正常終了');
    return NextResponse.json({
      success: true,
      data: filteredRankings,
      meta: {
        total: filteredRankings.length,
        limit: query.limit,
        offset: query.offset || 0,
        filters: {
          search: query.search,
          prefecture: query.prefecture
        },
        source: 'database'
      }
    });

  } catch (error) {
    console.error('店舗ランキングAPI エラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'データベース接続エラーが発生しました',
        details: error instanceof Error ? error.message : '不明なエラー',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 
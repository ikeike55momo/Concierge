/**
 * 店舗ランキング取得API
 * 
 * GET /api/stores
 * - 店舗ランキング一覧取得
 * - 検索・フィルタ機能
 * - ページネーション対応
 */

import { NextRequest, NextResponse } from 'next/server';
// import { dbHelpers } from '../../../lib/supabase';

// 型定義
interface StoreRanking {
  store_id: string;
  store_name: string;
  prefecture: string;
  nearest_station: string;
  total_score: number;
  predicted_win_rate: number;
  llm_comment: string;
  rank: number;
  analysis_date: string;
}

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
    const { searchParams } = new URL(request.url);
    
    const query: StoreRankingQuery = {
      search: searchParams.get('search') || undefined,
      prefecture: searchParams.get('prefecture') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    // バリデーション
    if (query.limit && (query.limit < 1 || query.limit > 100)) {
      return NextResponse.json(
        { error: 'limitは1-100の範囲で指定してください' },
        { status: 400 }
      );
    }

    // サンプルデータを取得（将来的にSupabase統合予定）
    let storeRankings: StoreRanking[] = getSampleStoreData();
    
    // フィルタリング処理
    if (query.prefecture) {
      storeRankings = storeRankings.filter((store: StoreRanking) => 
        store.prefecture === query.prefecture
      );
    }
    
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      storeRankings = storeRankings.filter((store: StoreRanking) =>
        store.store_name.toLowerCase().includes(searchTerm) ||
        store.nearest_station.toLowerCase().includes(searchTerm)
      );
    }
    
    // オフセット適用
    if (query.offset && query.offset > 0) {
      storeRankings = storeRankings.slice(query.offset);
    }
    
    // 件数制限適用
    if (query.limit) {
      storeRankings = storeRankings.slice(0, query.limit);
    }

    // レスポンス形成
    const response = {
      success: true,
      data: storeRankings,
      meta: {
        total: storeRankings.length,
        limit: query.limit,
        offset: query.offset || 0,
        filters: {
          search: query.search,
          prefecture: query.prefecture
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('API エラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'サーバーエラーが発生しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

/**
 * サンプル店舗データ（データベース接続エラー時のフォールバック）
 */
function getSampleStoreData(): StoreRanking[] {
  return [
    {
      store_id: '1',
      store_name: 'アイランド秋葉原店',
      prefecture: '東京都',
      nearest_station: 'JR秋葉原駅',
      total_score: 85,
      predicted_win_rate: 78,
      llm_comment: '今日は北斗シリーズが熱い！新台入替で期待度UP',
      rank: 1,
      analysis_date: new Date().toISOString().split('T')[0]
    },
    {
      store_id: '2',
      store_name: 'JOYPIT神田店',
      prefecture: '東京都',
      nearest_station: 'JR神田駅',
      total_score: 72,
      predicted_win_rate: 68,
      llm_comment: 'ジャグラー系が安定。イベント日でおすすめ',
      rank: 2,
      analysis_date: new Date().toISOString().split('T')[0]
    },
    {
      store_id: '3',
      store_name: 'ガイア渋谷店',
      prefecture: '東京都',
      nearest_station: 'JR渋谷駅',
      total_score: 58,
      predicted_win_rate: 52,
      llm_comment: '安定した出玉が期待できる優良店',
      rank: 3,
      analysis_date: new Date().toISOString().split('T')[0]
    },
    {
      store_id: '4',
      store_name: 'エスパス新宿南口店',
      prefecture: '東京都',
      nearest_station: 'JR新宿駅',
      total_score: 54,
      predicted_win_rate: 49,
      llm_comment: '平日狙いがおすすめ。アクセス良好',
      rank: 4,
      analysis_date: new Date().toISOString().split('T')[0]
    },
    {
      store_id: '5',
      store_name: 'パーラー太陽池袋店',
      prefecture: '東京都',
      nearest_station: 'JR池袋駅',
      total_score: 48,
      predicted_win_rate: 45,
      llm_comment: '様子見推奨。週末は混雑予想',
      rank: 5,
      analysis_date: new Date().toISOString().split('T')[0]
    }
  ];
} 
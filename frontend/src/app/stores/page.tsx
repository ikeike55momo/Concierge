/**
 * 店舗一覧画面
 * 
 * 「明日のおすすめホール」または「地元から探す」で選択された
 * 3店舗のスコアと一言コメントを表示
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// import StoreCard from '../../../components/StoreCard';

interface StoreRanking {
  storeId: string;
  storeName: string;
  score: number;
  predictedWinRate: number;
  comment: string;
  rank: number;
  prefecture: string;
  nearestStation: string;
}

export default function StoresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type'); // 'recommended' or 'local'
  
  const [storeRankings, setStoreRankings] = useState<StoreRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 店舗データを取得
  useEffect(() => {
    const fetchStoreRankings = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/stores');
        const result = await response.json();
        
        if (result.success && result.data) {
          const apiData: StoreRanking[] = result.data.map((store: { store_id: string; store_name: string; total_score: number; predicted_win_rate: number; llm_comment: string; rank: number; prefecture: string; nearest_station: string }) => ({
            storeId: store.store_id,
            storeName: store.store_name,
            score: store.total_score,
            predictedWinRate: store.predicted_win_rate,
            comment: store.llm_comment,
            rank: store.rank,
            prefecture: store.prefecture,
            nearestStation: store.nearest_station
          }));
          
          // typeに応じてフィルタ（最大3件）
          let filteredData = apiData;
          if (type === 'recommended') {
            // おすすめの場合はスコア順上位3件
            filteredData = apiData.sort((a, b) => b.score - a.score).slice(0, 3);
          } else if (type === 'local') {
            // 地元の場合は東京都の店舗のみ3件
            filteredData = apiData.filter(store => store.prefecture === '東京都').slice(0, 3);
          }
          
          setStoreRankings(filteredData);
        }
      } catch (error) {
        console.error('Fetch Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreRankings();
  }, [type]);

  /**
   * 店舗カードクリック時の処理
   */
  const handleStoreClick = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  /**
   * ホームに戻る処理
   */
  const handleBackHome = () => {
    router.push('/');
  };

  const pageTitle = type === 'recommended' ? '明日のおすすめホール' : '地元のおすすめホール';
  const pageDescription = type === 'recommended' 
    ? 'AIが分析した明日勝率の高い店舗トップ3'
    : 'アクセス良好な地元の優良店トップ3';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={handleBackHome}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">ホームに戻る</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎰</div>
              <h1 className="text-lg font-semibold text-gray-900">
                パチスロコンシェルジュ
              </h1>
            </div>

            <div className="w-20"></div> {/* スペース調整 */}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 mb-4">
            <span className="text-lg">
              {type === 'recommended' ? '⭐' : '📍'}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {type === 'recommended' ? 'おすすめ' : '地元'}
            </span>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {pageTitle}
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            {pageDescription}
          </p>
        </div>

        {/* 店舗カード一覧 */}
        <div className="mb-8">
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-pulse">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : storeRankings.length > 0 ? (
            <div className="space-y-6">
              {storeRankings.map((store, index) => (
                <div 
                  key={store.storeId}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100"
                  onClick={() => handleStoreClick(store.storeId)}
                >
                  <div className="p-8">
                    <div className="flex items-center gap-6">
                      {/* ランク表示 */}
                      <div className="flex-shrink-0">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                          'bg-gradient-to-br from-orange-400 to-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                      </div>

                      {/* 店舗情報 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {store.storeName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {store.nearestStation}
                          </span>
                        </div>
                        <p className="text-gray-700 font-medium text-base leading-relaxed">
                          {store.comment}
                        </p>
                      </div>

                      {/* スコアと勝率 */}
                      <div className="text-right flex-shrink-0">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-white font-bold text-lg mb-2 ${
                          store.score >= 80 ? 'bg-green-500' :
                          store.score >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}>
                          {store.score}
                        </div>
                        <div className="text-sm text-gray-600">
                          勝率 {store.predictedWinRate}%
                        </div>
                      </div>
                    </div>

                    {/* アクションヒント */}
                    <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        タップして詳細分析を見る
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>詳細を見る</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                データを読み込み中...
              </h3>
              <p className="text-gray-500">
                店舗情報を取得しています
              </p>
            </div>
          )}
        </div>

        {/* 下部ナビゲーション */}
        <div className="text-center">
          <button
            onClick={handleBackHome}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            他の選択肢も見る
          </button>
        </div>
      </main>
    </div>
  );
} 
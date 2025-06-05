/**
 * ホームページ
 * 
 * パチスロ店舗ランキングのメインページ
 * - 店舗検索・フィルタ機能
 * - 店舗ランキング一覧表示
 * - 明日のおすすめ店舗表示
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StoreCard from '../../components/StoreCard';

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

export default function Home() {
  const router = useRouter();
  const [storeRankings, setStoreRankings] = useState<StoreRanking[]>([]);
  const [filteredStores, setFilteredStores] = useState<StoreRanking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrefecture, setSelectedPrefecture] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // サンプルデータ（後でAPI呼び出しに置き換え）
  useEffect(() => {
    const fetchStoreRankings = async () => {
      setIsLoading(true);
      
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/api/ranking/tomorrow');
      // const data = await response.json();
      
      // サンプルデータ
      const sampleData: StoreRanking[] = [
        {
          storeId: '1',
          storeName: 'アイランド秋葉原店',
          score: 85,
          predictedWinRate: 78,
          comment: '今日は北斗シリーズが熱い！',
          rank: 1,
          prefecture: '東京都',
          nearestStation: 'JR秋葉原駅'
        },
        {
          storeId: '2', 
          storeName: 'マルハン新宿東宝ビル店',
          score: 72,
          predictedWinRate: 65,
          comment: 'イベント日で期待大',
          rank: 2,
          prefecture: '東京都',
          nearestStation: 'JR新宿駅'
        },
        {
          storeId: '3',
          storeName: 'ガイア渋谷店',
          score: 58,
          predictedWinRate: 52,
          comment: '安定した出玉が期待',
          rank: 3,
          prefecture: '東京都',
          nearestStation: 'JR渋谷駅'
        }
      ];
      
      setStoreRankings(sampleData);
      setFilteredStores(sampleData);
      setIsLoading(false);
    };

    fetchStoreRankings();
  }, []);

  // 検索・フィルタ処理
  useEffect(() => {
    let filtered = storeRankings;

    // 都道府県フィルタ
    if (selectedPrefecture) {
      filtered = filtered.filter(store => store.prefecture === selectedPrefecture);
    }

    // 検索クエリフィルタ
    if (searchQuery) {
      filtered = filtered.filter(store => 
        store.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.nearestStation.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredStores(filtered);
  }, [searchQuery, selectedPrefecture, storeRankings]);

  /**
   * 店舗カードクリック時の処理
   * @param storeId - 店舗ID
   */
  const handleStoreClick = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-pachislot-red-600">🎰</div>
              <h1 className="text-xl font-bold text-gray-900">
                パチスロ店舗ランキング
              </h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="/" className="text-pachislot-red-600 font-medium">
                ホーム
              </a>
              <a href="/admin" className="text-gray-600 hover:text-gray-900">
                管理画面
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヒーローセクション */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            明日のおすすめ店舗
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI分析による明日の勝率予測とおすすめ店舗をランキング形式でお届け
          </p>
        </div>

        {/* 検索・フィルタセクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 検索ボックス */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                店舗名・駅名で検索
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="例: アイランド、秋葉原駅"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pachislot-orange-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 都道府県フィルタ */}
            <div className="md:w-48">
              <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-2">
                都道府県
              </label>
              <select
                id="prefecture"
                value={selectedPrefecture}
                onChange={(e) => setSelectedPrefecture(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pachislot-orange-500 focus:border-transparent"
              >
                <option value="">すべて</option>
                <option value="東京都">東京都</option>
                <option value="神奈川県">神奈川県</option>
                <option value="埼玉県">埼玉県</option>
                <option value="千葉県">千葉県</option>
              </select>
            </div>
          </div>
        </div>

        {/* ランキング一覧 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              店舗ランキング
            </h3>
            <div className="text-sm text-gray-500">
              {filteredStores.length}件の店舗
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredStores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map((store) => (
                <StoreCard
                  key={store.storeId}
                  storeId={store.storeId}
                  storeName={store.storeName}
                  score={store.score}
                  predictedWinRate={store.predictedWinRate}
                  comment={store.comment}
                  rank={store.rank}
                  onClick={() => handleStoreClick(store.storeId)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                該当する店舗が見つかりません
              </h3>
              <p className="text-gray-500">
                検索条件を変更してお試しください
              </p>
            </div>
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2025 パチスロ店舗ランキング. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

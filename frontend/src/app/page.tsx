/**
 * ホーム画面
 * 
 * 「明日のおすすめホール」「地元から探す」の2つの選択肢を提供
 * ユーザーの選択に基づいて店舗一覧画面に遷移
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  /**
   * おすすめホール選択時の処理
   */
  const handleRecommendedStores = () => {
    router.push('/stores?type=recommended');
  };

  /**
   * 地元から探す選択時の処理
   */
  const handleLocalStores = () => {
    router.push('/stores?type=local');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pachislot-red-50 to-pachislot-orange-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎰</div>
              <h1 className="text-xl font-bold text-gray-900">
                パチスロコンシェルジュ
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="/admin" className="text-gray-600 hover:text-gray-900 text-sm">
                管理画面
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            今日のパチスロはどこで遊ぶ？
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AIが分析した最新データで、あなたにぴったりのホールを見つけましょう。
            店舗の実績・イベント情報・機種の傾向を総合的に判断してランキングを作成しています。
          </p>
        </div>

        {/* 選択ボタン */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* 明日のおすすめホール */}
          <div className="group cursor-pointer" onClick={handleRecommendedStores}>
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pachislot-red-500 to-pachislot-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl text-white">⭐</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  明日のおすすめホール
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  AIが過去のデータとイベント情報を分析し、
                  明日勝率の高い店舗をランキング形式でご紹介
                </p>
                <div className="bg-pachislot-red-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-pachislot-red-700">
                    <span className="text-sm">🔥</span>
                    <span className="text-sm font-medium">
                      予測勝率・推奨機種・入店時間まで完全サポート
                    </span>
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-pachislot-red-500 to-pachislot-red-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-pachislot-red-600 hover:to-pachislot-red-700 transition-all duration-300 transform group-hover:scale-105">
                  おすすめを見る
                </button>
              </div>
            </div>
          </div>

          {/* 地元から探す */}
          <div className="group cursor-pointer" onClick={handleLocalStores}>
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pachislot-orange-500 to-pachislot-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl text-white">📍</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  地元から探す
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  エリア・駅名から通いやすい店舗を検索。
                  地元の隠れた優良店も見つけられます
                </p>
                <div className="bg-pachislot-orange-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-pachislot-orange-700">
                    <span className="text-sm">🚃</span>
                    <span className="text-sm font-medium">
                      アクセス良好・近場の優良店をピックアップ
                    </span>
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-pachislot-orange-500 to-pachislot-orange-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-pachislot-orange-600 hover:to-pachislot-orange-700 transition-all duration-300 transform group-hover:scale-105">
                  地元で探す
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* フッター情報 */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
            <h4 className="font-semibold text-gray-900 mb-3">📊 データについて</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              当サービスは過去3ヶ月の実績データを基に、Claude AIが店舗分析を行っています。
              各店舗のスコアは「過去実績」「イベント効果」「機種人気度」「アクセス」等を総合的に判断しています。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

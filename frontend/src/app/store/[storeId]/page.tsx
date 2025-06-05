/**
 * 店舗詳細ページ
 * 
 * 特定店舗の詳細分析結果を表示
 * - 明日の勝率予測
 * - おすすめ機種TOP3
 * - 立ち回り提案
 * - パフォーマンスチャート
 * - 分析根拠
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PerformanceChart from '../../../../components/PerformanceChart';

interface RecommendedMachine {
  /** 機種ID */
  machineId: string;
  /** 機種名 */
  machineName: string;
  /** 台番号 */
  unitNumber: string;
  /** 期待差枚数 */
  expectedDifference: number;
  /** 推奨理由 */
  reason: string;
}

interface PlayStrategy {
  /** 推奨入店時間 */
  recommendedEntryTime: string;
  /** 狙い目機種・台番 */
  targetMachines: string[];
  /** 避けるべき機種・台番 */
  avoidMachines: string[];
  /** 立ち回り戦略 */
  strategy: string;
  /** 注意事項 */
  warnings: string[];
}

interface StoreAnalysis {
  /** 店舗ID */
  storeId: string;
  /** 店舗名 */
  storeName: string;
  /** 総合スコア */
  totalScore: number;
  /** 明日の勝率予測 */
  tomorrowWinRate: number;
  /** 予測信頼度 */
  confidence: number;
  /** LLMコメント */
  comment: string;
  /** おすすめ機種TOP3 */
  recommendedMachines: RecommendedMachine[];
  /** 立ち回り提案 */
  playStrategy: PlayStrategy;
  /** パフォーマンスデータ */
  performanceData: any[];
  /** 明日の予測値 */
  tomorrowPrediction: {
    totalDifference: number;
    averageDifference: number;
    confidence: number;
  };
  /** 分析根拠 */
  analysisRationale: {
    baseScore: number;
    eventBonus: number;
    machinePopularity: number;
    accessScore: number;
    personalAdjustment: number;
  };
}

export default function StoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  
  const [storeAnalysis, setStoreAnalysis] = useState<StoreAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  useEffect(() => {
    const fetchStoreAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/analysis/${storeId}`);
        const result = await response.json();
        
                if (result.success && result.data) {
          setStoreAnalysis(result.data);
        } else {
          console.error('API Error:', result.error);
          throw new Error('API Error: ' + (result.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Fetch Error:', err);
        const errorMessage = err instanceof Error ? err.message : '分析データの取得に失敗しました';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (storeId) {
      fetchStoreAnalysis();
    }
  }, [storeId]);

  /**
   * スコアに基づく色分けクラスを取得
   */
  const getScoreColorClass = (score: number): string => {
    if (score >= 70) return 'text-pachislot-score-excellent';
    if (score >= 50) return 'text-pachislot-score-good';
    return 'text-pachislot-score-poor';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pachislot-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">分析データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !storeAnalysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-gray-600 mb-4">{error || '店舗データが見つかりません'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-pachislot-orange-500 text-white px-4 py-2 rounded-lg hover:bg-pachislot-orange-600"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7" />
                </svg>
              </button>
              <div className="text-2xl font-bold text-pachislot-red-600">🎰</div>
              <h1 className="text-xl font-bold text-gray-900">
                {storeAnalysis.storeName} - 詳細分析
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 概要セクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 総合スコア */}
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                <span className={getScoreColorClass(storeAnalysis.totalScore)}>
                  {storeAnalysis.totalScore}
                </span>
                <span className="text-gray-400 text-lg ml-1">点</span>
              </div>
              <p className="text-sm text-gray-600">総合スコア</p>
            </div>

            {/* 明日の勝率 */}
            <div className="text-center">
              <div className="text-3xl font-bold text-pachislot-orange-500 mb-2">
                {storeAnalysis.tomorrowWinRate}%
              </div>
              <p className="text-sm text-gray-600">明日の勝率予測</p>
            </div>

            {/* 信頼度 */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {storeAnalysis.confidence}%
              </div>
              <p className="text-sm text-gray-600">予測信頼度</p>
            </div>
          </div>

          {/* LLMコメント */}
          <div className="mt-6 bg-gradient-to-r from-pachislot-orange-50 to-pachislot-red-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-pachislot-orange-500 mt-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-800">
                {storeAnalysis.comment}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左カラム */}
          <div className="space-y-8">
            {/* おすすめ機種TOP3 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-pachislot-orange-500">🏆</span>
                おすすめ機種 TOP3
              </h3>
              
              <div className="space-y-4">
                {storeAnalysis.recommendedMachines.map((machine, index) => (
                  <div key={machine.machineId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="bg-pachislot-orange-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{machine.machineName}</h4>
                          <p className="text-sm text-gray-600">台番: {machine.unitNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-pachislot-score-excellent">
                          +{machine.expectedDifference}
                        </p>
                        <p className="text-xs text-gray-500">期待差枚</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{machine.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 立ち回り提案 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-pachislot-red-500">📋</span>
                明日の立ち回り提案
              </h3>
              
              <div className="space-y-4">
                {/* 推奨入店時間 */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">推奨入店時間</h4>
                  <p className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg font-medium">
                    {storeAnalysis.playStrategy.recommendedEntryTime}
                  </p>
                </div>

                {/* 狙い目機種 */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">狙い目機種・台番</h4>
                  <div className="space-y-1">
                    {storeAnalysis.playStrategy.targetMachines.map((machine, index) => (
                      <span key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                        {machine}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 避けるべき機種 */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">避けるべき機種・台番</h4>
                  <div className="space-y-1">
                    {storeAnalysis.playStrategy.avoidMachines.map((machine, index) => (
                      <span key={index} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                        {machine}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 戦略 */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">立ち回り戦略</h4>
                  <p className="text-gray-700 leading-relaxed">
                    {storeAnalysis.playStrategy.strategy}
                  </p>
                </div>

                {/* 注意事項 */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">注意事項</h4>
                  <ul className="space-y-1">
                    {storeAnalysis.playStrategy.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">⚠️</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 右カラム */}
          <div className="space-y-8">
            {/* パフォーマンスチャート */}
            <div>
              <PerformanceChart
                data={storeAnalysis.performanceData}
                tomorrowPrediction={storeAnalysis.tomorrowPrediction}
                storeName={storeAnalysis.storeName}
                height={350}
              />
            </div>

            {/* 分析根拠 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">📊</span>
                スコア分析根拠
              </h3>
              
              <div className="space-y-3">
                {[
                  { label: 'ベーススコア', value: storeAnalysis.analysisRationale.baseScore, color: 'bg-blue-500' },
                  { label: 'イベントボーナス', value: storeAnalysis.analysisRationale.eventBonus, color: 'bg-green-500' },
                  { label: '機種人気度', value: storeAnalysis.analysisRationale.machinePopularity, color: 'bg-purple-500' },
                  { label: 'アクセス快適度', value: storeAnalysis.analysisRationale.accessScore, color: 'bg-orange-500' },
                  { label: '個人調整', value: storeAnalysis.analysisRationale.personalAdjustment, color: 'bg-gray-500' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${Math.max(0, Math.min(100, (item.value / 20) * 100))}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {item.value > 0 ? '+' : ''}{item.value}
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-3 mt-4">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-gray-900">総合スコア</span>
                    <span className={`text-lg ${getScoreColorClass(storeAnalysis.totalScore)}`}>
                      {storeAnalysis.totalScore}点
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
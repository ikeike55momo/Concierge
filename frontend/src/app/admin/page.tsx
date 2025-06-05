/**
 * 管理画面
 * 
 * システム管理者向けの管理機能を提供
 * - CSVデータアップロード
 * - スコア算出設定
 * - 店舗管理
 * - ユーザー管理
 * - システム設定
 */

'use client';

import React, { useState, useEffect } from 'react';
import CSVUploader from '../../../components/CSVUploader';

interface SystemStats {
  /** 総店舗数 */
  totalStores: number;
  /** アクティブ店舗数 */
  activeStores: number;
  /** 今日の分析数 */
  todayAnalyses: number;
  /** 最終更新日 */
  lastUpdate: string;
}

interface ScoreSettings {
  /** ベーススコア重み */
  baseScoreWeight: number;
  /** イベントボーナス重み */
  eventBonusWeight: number;
  /** 機種人気度重み */
  machinePopularityWeight: number;
  /** アクセス重み */
  accessWeight: number;
  /** 個人調整重み */
  personalAdjustmentWeight: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'scoring' | 'stores' | 'settings'>('upload');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [scoreSettings, setScoreSettings] = useState<ScoreSettings>({
    baseScoreWeight: 0.4,
    eventBonusWeight: 0.25,
    machinePopularityWeight: 0.15,
    accessWeight: 0.1,
    personalAdjustmentWeight: 0.1
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // システム統計情報取得
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        // TODO: 実際のAPI呼び出しに置き換え
        // const response = await fetch('/api/admin/stats');
        // const data = await response.json();
        
        // サンプルデータ
        const sampleStats: SystemStats = {
          totalStores: 385,
          activeStores: 352,
          todayAnalyses: 1247,
          lastUpdate: '2025-05-25 06:00:00'
        };
        
        setSystemStats(sampleStats);
      } catch (err) {
        console.error('システム統計情報の取得に失敗:', err);
      }
    };

    fetchSystemStats();
  }, []);

  /**
   * スコア設定保存
   */
  const handleSaveScoreSettings = async () => {
    setIsLoading(true);
    try {
      // TODO: 実際のAPI呼び出しに置き換え
      // await fetch('/api/admin/scoring/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(scoreSettings)
      // });
      
      setMessage({ type: 'success', text: 'スコア設定が保存されました' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'スコア設定の保存に失敗しました' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 分析再実行
   */
  const handleRerunAnalysis = async () => {
    setIsLoading(true);
    try {
      // TODO: 実際のAPI呼び出しに置き換え
      // await fetch('/api/admin/analysis/rerun', { method: 'POST' });
      
      setMessage({ type: 'info', text: '分析再実行を開始しました' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: '分析再実行に失敗しました' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * タブコンテンツのレンダリング
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                CSVデータアップロード
              </h3>
              <p className="text-gray-600 mb-6">
                店舗情報、機種情報、イベント情報、営業実績データのCSVファイルをアップロードします。
              </p>
            </div>
            
            <CSVUploader />
            
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📋 アップロード手順</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>store_info.csv: 店舗基本情報</li>
                <li>machines_info.csv: 機種情報</li>
                <li>event_info.csv: イベント情報</li>
                <li>store_production_info.csv: 営業実績データ</li>
              </ol>
            </div>
          </div>
        );

      case 'scoring':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                スコア算出設定
              </h3>
              <p className="text-gray-600 mb-6">
                各評価項目の重み付けを調整して、スコア算出ロジックをカスタマイズします。
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-6">
                {[
                  { key: 'baseScoreWeight', label: 'ベーススコア重み', description: '基本的な店舗実績に基づくスコア' },
                  { key: 'eventBonusWeight', label: 'イベントボーナス重み', description: 'イベント日のボーナススコア' },
                  { key: 'machinePopularityWeight', label: '機種人気度重み', description: '人気機種の設置状況' },
                  { key: 'accessWeight', label: 'アクセス重み', description: '駅からの距離など' },
                  { key: 'personalAdjustmentWeight', label: '個人調整重み', description: '個人の好みに基づく調整' }
                ].map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-sm font-medium text-gray-900">
                          {setting.label}
                        </label>
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={scoreSettings[setting.key as keyof ScoreSettings]}
                          onChange={(e) => setScoreSettings(prev => ({
                            ...prev,
                            [setting.key]: parseFloat(e.target.value)
                          }))}
                          className="w-32"
                        />
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {(scoreSettings[setting.key as keyof ScoreSettings] * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    合計重み: {Object.values(scoreSettings).reduce((sum, val) => sum + val, 0).toFixed(2)}
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRerunAnalysis}
                      disabled={isLoading}
                      className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                    >
                      分析再実行
                    </button>
                    <button
                      onClick={handleSaveScoreSettings}
                      disabled={isLoading}
                      className="px-4 py-2 bg-pachislot-orange-500 text-white rounded-lg hover:bg-pachislot-orange-600 disabled:opacity-50"
                    >
                      {isLoading ? '保存中...' : '設定保存'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'stores':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                店舗管理
              </h3>
              <p className="text-gray-600 mb-6">
                店舗の有効/無効状態を管理し、分析対象をコントロールします。
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="店舗名で検索..."
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="">すべて</option>
                      <option value="active">有効</option>
                      <option value="inactive">無効</option>
                    </select>
                  </div>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
                    + 新規店舗追加
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {/* サンプル店舗リスト */}
                {[
                  { id: '1', name: 'アイランド秋葉原店', status: 'active', prefecture: '東京都', lastUpdate: '2025-05-25' },
                  { id: '2', name: 'JOYPIT神田店', status: 'active', prefecture: '東京都', lastUpdate: '2025-05-25' },
                  { id: '3', name: 'エスパス渋谷本店', status: 'inactive', prefecture: '東京都', lastUpdate: '2025-05-24' },
                ].map((store) => (
                  <div key={store.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${store.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{store.name}</h4>
                          <p className="text-sm text-gray-500">{store.prefecture} • 最終更新: {store.lastUpdate}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-blue-700 bg-blue-50 rounded text-sm hover:bg-blue-100">
                          編集
                        </button>
                        <button className={`px-3 py-1 rounded text-sm ${
                          store.status === 'active' 
                            ? 'text-red-700 bg-red-50 hover:bg-red-100' 
                            : 'text-green-700 bg-green-50 hover:bg-green-100'
                        }`}>
                          {store.status === 'active' ? '無効化' : '有効化'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                システム設定
              </h3>
              <p className="text-gray-600 mb-6">
                システム全体の動作設定を管理します。
              </p>
            </div>

            <div className="space-y-6">
              {/* API設定 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">API設定</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Claude API キー
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="sk-ant-api03-..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OpenAI API キー (フォールバック)
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="sk-..."
                    />
                  </div>
                </div>
              </div>

              {/* 分析設定 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">分析設定</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        自動分析実行
                      </label>
                      <p className="text-xs text-gray-500">毎日6:00に自動で分析を実行</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      分析対象期間 (日)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      defaultValue="30"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-pachislot-red-600">🎰</div>
              <h1 className="text-xl font-bold text-gray-900">
                管理画面
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                ホームに戻る
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* システム統計 */}
      {systemStats && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-pachislot-orange-500">
                  {systemStats.totalStores}
                </div>
                <p className="text-sm text-gray-600">総店舗数</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {systemStats.activeStores}
                </div>
                <p className="text-sm text-gray-600">アクティブ店舗</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {systemStats.todayAnalyses}
                </div>
                <p className="text-sm text-gray-600">今日の分析数</p>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  {systemStats.lastUpdate}
                </div>
                <p className="text-sm text-gray-600">最終更新</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* メッセージ表示 */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タブナビゲーション */}
        <nav className="mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {[
                { key: 'upload', label: 'データアップロード', icon: '📁' },
                { key: 'scoring', label: 'スコア設定', icon: '⚙️' },
                { key: 'stores', label: '店舗管理', icon: '🏪' },
                { key: 'settings', label: 'システム設定', icon: '🔧' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'border-pachislot-orange-500 text-pachislot-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* タブコンテンツ */}
        <div>
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
} 
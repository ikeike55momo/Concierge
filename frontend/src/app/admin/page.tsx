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
  const [activeTab, setActiveTab] = useState<'upload' | 'scoring' | 'stores' | 'machines' | 'settings' | 'database'>('upload');
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
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<{ uploading: boolean; message: string; details?: any }>({ 
    uploading: false, 
    message: '' 
  });
  const [forceUpdate, setForceUpdate] = useState(false);
  const [machines, setMachines] = useState<any[]>([]);
  const [editingMachine, setEditingMachine] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreDetails, setSelectedStoreDetails] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // システム統計情報取得
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        
        if (data.success) {
          setSystemStats(data.stats);
        } else {
          console.error('システム統計情報の取得に失敗:', data.error);
        }
      } catch (err) {
        console.error('システム統計情報の取得に失敗:', err);
      }
    };

    fetchSystemStats();
  }, [forceUpdate]);

  // 機種データ取得
  useEffect(() => {
    const fetchMachines = async () => {
      if (activeTab === 'machines') {
        try {
          const response = await fetch('/api/admin/machines');
          const data = await response.json();
          if (data.success) {
            setMachines(data.machines);
          }
        } catch (error) {
          console.error('機種データ取得エラー:', error);
        }
      }
    };

    fetchMachines();
  }, [activeTab, forceUpdate]);

  // 店舗データ取得
  useEffect(() => {
    const fetchStores = async () => {
      if (activeTab === 'stores') {
        try {
          const response = await fetch('/api/admin/stores');
          const data = await response.json();
          if (data.success) {
            setStores(data.stores);
          }
        } catch (error) {
          console.error('店舗データ取得エラー:', error);
        }
      }
    };

    fetchStores();
  }, [activeTab, forceUpdate]);

  /**
   * スコア設定保存
   */
  const handleSaveScoreSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/scoring/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreSettings)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'スコア設定が保存されました' });
      } else {
        setMessage({ type: 'error', text: 'スコア設定の保存に失敗しました' });
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('スコア設定保存エラー:', err);
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
      const response = await fetch('/api/admin/analysis/rerun', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'info', text: '分析再実行を開始しました' });
        // 統計情報を更新
        setForceUpdate(!forceUpdate);
      } else {
        setMessage({ type: 'error', text: data.error || '分析再実行に失敗しました' });
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('分析再実行エラー:', err);
      setMessage({ type: 'error', text: '分析再実行に失敗しました' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * データベース状態チェック
   */
  const handleCheckDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/init-db');
      const data = await response.json();
      setDbStatus(data.status);
      
      if (data.success) {
        setMessage({ 
          type: data.status.connected ? 'success' : 'error', 
          text: data.message 
        });
      } else {
        setMessage({ type: 'error', text: 'データベース状態の取得に失敗しました' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'データベース接続エラー' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  /**
   * データベース構造チェック
   */
  const handleCheckDatabaseStructure = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/setup-database');
      const data = await response.json();
      setDbStatus(data.status);
      
      if (data.success) {
        setMessage({ 
          type: data.status.connected ? 'success' : 'error', 
          text: data.message 
        });
      } else {
        setMessage({ type: 'error', text: 'データベース状態の取得に失敗しました' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'データベース接続エラー' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  /**
   * テーブル作成
   */
  const handleCreateTables = async () => {
    if (!confirm('データベーステーブルを作成しますか？')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/setup-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_tables' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'テーブルが正常に作成されました' });
        // 状態を再チェック
        await handleCheckDatabaseStructure();
      } else {
        setMessage({ type: 'error', text: data.error || 'テーブル作成に失敗しました' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'テーブル作成エラー' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  /**
   * データベースリセット
   */
  const handleResetDatabase = async () => {
    if (!confirm('データベースを完全にリセットしますか？\n全てのデータが削除されます。')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/setup-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_database' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'データベースがリセットされました' });
        // 状態を再チェック
        await handleCheckDatabaseStructure();
      } else {
        setMessage({ type: 'error', text: data.error || 'データベースリセットに失敗しました' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'データベースリセットエラー' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  /**
   * サンプルデータ挿入（無効化済み）
   */
  const handleInitDatabase = async () => {
    setMessage({ 
      type: 'info', 
      text: 'サンプルデータ挿入機能は無効化されています。実データのCSVアップロードをご利用ください。' 
    });
    setTimeout(() => setMessage(null), 5000);
  };

  /**
   * CSVファイルアップロード処理
   */
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setUploadProgress({ uploading: true, message: 'CSVファイルを処理中...' });
    
    try {
      const csvText = await file.text();
      
      const response = await fetch('/api/admin/csv-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          csvData: csvText,
          // dataTypeは自動判定させる
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadProgress({ 
          uploading: false, 
          message: `✅ ${result.message}`,
          details: result.details
        });
        setMessage({ type: 'success', text: result.message });
        setForceUpdate(!forceUpdate); // データを再取得
      } else {
        setUploadProgress({ 
          uploading: false, 
          message: `❌ ${result.error}`,
          details: result.details
        });
        setMessage({ type: 'error', text: result.error });
      }
      
      setTimeout(() => {
        setUploadProgress({ uploading: false, message: '' });
        setMessage(null);
      }, 5000);
      
    } catch (error) {
      console.error('ファイルアップロードエラー:', error);
      setUploadProgress({ 
        uploading: false, 
        message: `❌ アップロードエラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      setMessage({ type: 'error', text: 'ファイルのアップロードに失敗しました' });
      
      setTimeout(() => {
        setUploadProgress({ uploading: false, message: '' });
        setMessage(null);
      }, 5000);
    }
  };

  /**
   * 機種スコア更新
   */
  const handleUpdateMachineScore = async (machineId: string, newScore: number) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/machines/score', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineId, popularityScore: newScore })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '機種スコアを更新しました' });
        setForceUpdate(!forceUpdate);
        setEditingMachine(null);
      } else {
        setMessage({ type: 'error', text: data.error || '更新に失敗しました' });
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('機種スコア更新エラー:', error);
      setMessage({ type: 'error', text: '機種スコアの更新に失敗しました' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 機種一括スコア更新
   */
  const handleBulkUpdateScores = async () => {
    if (!confirm('全機種のスコアを再計算しますか？')) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/machines/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `${data.updatedCount}件の機種スコアを再計算しました` });
        setForceUpdate(!forceUpdate);
      } else {
        setMessage({ type: 'error', text: data.error || '再計算に失敗しました' });
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('機種スコア再計算エラー:', error);
      setMessage({ type: 'error', text: '機種スコアの再計算に失敗しました' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 店舗詳細データ取得
   */
  const handleViewStoreDetails = async (storeId: string) => {
    try {
      const response = await fetch(`/api/admin/stores/${storeId}/details`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedStoreDetails(data);
        setShowDetailsModal(true);
      } else {
        setMessage({ type: 'error', text: data.error });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('店舗詳細取得エラー:', error);
      setMessage({ type: 'error', text: '店舗詳細の取得に失敗しました' });
      setTimeout(() => setMessage(null), 3000);
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
            
            {/* CSV アップロード機能 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                📁 CSV ファイルアップロード & データベース同期
              </h4>
              
                             <div className="space-y-4">
                 {/* ファイル選択 */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     CSVファイルを選択
                   </label>
                   <input
                     type="file"
                     accept=".csv"
                     onChange={(e) => {
                       if (e.target.files) {
                         handleFileUpload(e.target.files[0]);
                       }
                     }}
                     disabled={uploadProgress.uploading}
                     className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100
                       disabled:opacity-50 disabled:cursor-not-allowed"
                   />
                 </div>

                 {/* 強制更新オプション */}
                 <div className="flex items-center space-x-2">
                   <input
                     type="checkbox"
                     id="forceUpdate"
                     checked={forceUpdate}
                     onChange={(e) => setForceUpdate(e.target.checked)}
                     disabled={uploadProgress.uploading}
                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                   />
                   <label htmlFor="forceUpdate" className="text-sm text-gray-700">
                     <span className="font-medium">強制更新</span>
                     <span className="text-gray-500 ml-1">（既存データを上書き）</span>
                   </label>
                 </div>
                 
                 <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                   <strong>💡 ヒント:</strong> 
                   通常は既存データをスキップして高速処理します。
                   データを修正して再処理したい場合は「強制更新」をチェックしてください。
                 </div>

                 {/* アップロード状況 */}
                 {uploadProgress.uploading && (
                   <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                     <div className="flex items-center gap-2 mb-2">
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                       <span className="text-blue-800 text-sm font-medium">処理中...</span>
                     </div>
                     <p className="text-blue-700 text-sm">{uploadProgress.message}</p>
                   </div>
                 )}

                 {!uploadProgress.uploading && uploadProgress.message && (
                   <div className={`mt-4 p-3 border rounded-lg ${
                     uploadProgress.message.startsWith('✅') 
                       ? 'bg-green-50 border-green-200 text-green-800' 
                       : 'bg-red-50 border-red-200 text-red-800'
                   }`}>
                     <p className="text-sm font-medium">{uploadProgress.message}</p>
                     {uploadProgress.details && (
                       <div className="mt-2 text-xs space-y-1">
                         <div>データ種別: <span className="font-medium">{uploadProgress.details.dataType}</span></div>
                         <div>処理件数: <span className="font-medium">{uploadProgress.details.processedCount}</span></div>
                         <div>保存件数: <span className="font-medium">{uploadProgress.details.savedCount}</span></div>
                         {uploadProgress.details.errorCount > 0 && (
                           <div>エラー件数: <span className="font-medium text-red-600">{uploadProgress.details.errorCount}</span></div>
                         )}
                         {uploadProgress.details.errors && uploadProgress.details.errors.length > 0 && (
                           <details className="mt-2">
                             <summary className="cursor-pointer text-xs">エラー詳細を表示</summary>
                             <div className="mt-1 pl-2 border-l-2 border-gray-300">
                               {uploadProgress.details.errors.map((error: string, index: number) => (
                                 <div key={index} className="text-xs text-red-600">{error}</div>
                               ))}
                             </div>
                           </details>
                         )}
                       </div>
                     )}
                   </div>
                 )}

                 {/* 対応ファイル形式の説明 */}
                 <div className="text-sm text-gray-600">
                   <h5 className="font-medium mb-2">対応ファイル形式:</h5>
                   <ul className="list-disc list-inside space-y-1">
                     <li><code>store_*.csv</code> - 店舗マスタ</li>
                     <li><code>store_production_info_*.csv</code> - 店舗出玉情報</li>
                     <li><code>machines_info.csv</code> - 機種マスタ</li>
                     <li><code>event_*.csv</code> - イベントマスタ</li>
                   </ul>
                 </div>
               </div>
            </div>
            
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
                {stores.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    店舗データがありません。データベースを確認してください。
                  </div>
                ) : (
                  stores.map((store) => (
                    <div key={store.store_id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${store.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <div>
                            <h4 className="font-medium text-gray-900">{store.store_name}</h4>
                            <p className="text-sm text-gray-500">
                              {store.prefecture} | 最寄駅: {store.nearest_station} | 
                              最終更新: {new Date(store.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewStoreDetails(store.store_id)}
                            className="px-3 py-1 text-purple-700 bg-purple-50 rounded text-sm hover:bg-purple-100"
                          >
                            詳細
                          </button>
                          <button className="px-3 py-1 text-blue-700 bg-blue-50 rounded text-sm hover:bg-blue-100">
                            編集
                          </button>
                          <button className={`px-3 py-1 rounded text-sm ${
                            store.is_active 
                              ? 'text-red-700 bg-red-50 hover:bg-red-100' 
                              : 'text-green-700 bg-green-50 hover:bg-green-100'
                          }`}>
                            {store.is_active ? '無効化' : '有効化'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 店舗詳細モーダル */}
            {showDetailsModal && selectedStoreDetails && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">店舗詳細情報</h3>
                      <button
                        onClick={() => setShowDetailsModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      店舗ID: {selectedStoreDetails.storeId} | 
                      総項目数: {selectedStoreDetails.totalCount}件
                    </p>
                  </div>
                  
                  <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {Object.entries(selectedStoreDetails.categorizedData).map(([category, items]: [string, any]) => (
                      <div key={category} className="mb-6">
                        <h4 className="text-md font-semibold text-gray-900 mb-3 bg-gray-50 px-3 py-2 rounded">
                          📋 {category}
                        </h4>
                        <div className="space-y-2">
                          {items.map((item: any) => (
                            <div key={item.id} className="border border-gray-100 rounded p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {item.number}
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      {item.element_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({item.element})
                                    </span>
                                  </div>
                                  <p className="text-gray-700">{item.value}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-medium ${
                                  item.importance === 'A' ? 'bg-red-100 text-red-800' :
                                  item.importance === 'B' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.importance}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'machines':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                機種管理
              </h3>
              <p className="text-gray-600 mb-6">
                機種のスコア設定を管理します。
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="機種名で検索..."
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="">すべて</option>
                      <option value="active">有効</option>
                      <option value="inactive">無効</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleBulkUpdateScores}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm disabled:opacity-50"
                    >
                      スコア再計算
                    </button>
                    <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
                      + 新規機種追加
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {machines.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    機種データがありません。CSVファイルをアップロードしてください。
                  </div>
                ) : (
                  machines.map((machine) => (
                    <div key={machine.machine_id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${machine.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{machine.machine_name}</h4>
                            <div className="text-sm text-gray-500 space-y-1">
                              <p>機種ID: {machine.machine_id} | メーカー: {machine.manufacturer || '未設定'}</p>
                              <div className="flex items-center gap-4">
                                <span>人気度スコア: <span className="font-bold text-blue-600">{machine.popularity_score}点</span></span>
                                <span>RTP: {machine.rtp_percentage}%</span>
                                <span>最終更新: {new Date(machine.updated_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingMachine(machine)}
                            className="px-3 py-1 text-blue-700 bg-blue-50 rounded text-sm hover:bg-blue-100"
                          >
                            スコア編集
                          </button>
                          <button
                            className={`px-3 py-1 rounded text-sm ${
                              machine.is_active 
                                ? 'text-red-700 bg-red-50 hover:bg-red-100' 
                                : 'text-green-700 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            {machine.is_active ? '無効化' : '有効化'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* スコア編集ダイアログ */}
            {editingMachine && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">機種スコア編集</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        機種名
                      </label>
                      <input
                        type="text"
                        value={editingMachine.machine_name}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        人気度スコア (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editingMachine.popularity_score}
                        onChange={(e) => setEditingMachine({
                          ...editingMachine,
                          popularity_score: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        高いスコアほど分析での重要度が上がります
                      </p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">参考スコア目安</h4>
                      <div className="text-xs text-blue-700 space-y-1">
                        <p>• 90-100: 超人気機種（ゴッドイーター、バイオハザードなど）</p>
                        <p>• 80-89: 人気機種（To LOVEる、エヴァなど）</p>
                        <p>• 70-79: 定番機種（政宗、ガルパンなど）</p>
                        <p>• 50-69: 標準機種</p>
                        <p>• 30-49: 不人気機種</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setEditingMachine(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => handleUpdateMachineScore(editingMachine.machine_id, editingMachine.popularity_score)}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isLoading ? '更新中...' : '更新'}
                    </button>
                  </div>
                </div>
              </div>
            )}
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

      case 'database':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                データベース管理
              </h3>
              <p className="text-gray-600 mb-6">
                データベースの初期化、状態確認、サンプルデータの管理を行います。
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* テーブル作成 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  🏗️ テーブル作成
                </h4>
                
                <div className="space-y-4">
                  <button
                    onClick={handleCreateTables}
                    disabled={isLoading}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? '作成中...' : 'テーブル作成'}
                  </button>
                  
                  <button
                    onClick={handleResetDatabase}
                    disabled={isLoading}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'リセット中...' : 'データベースリセット'}
                  </button>
                  
                  <p className="text-sm text-gray-600">
                    必要なテーブル構造を作成します。
                    <br />
                    リセットは全データを削除します。
                  </p>
                </div>
              </div>

            {/* データベース状態 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">📊 データベース状態</h4>
                <button
                  onClick={handleCheckDatabaseStructure}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  {isLoading ? '確認中...' : '状態チェック'}
                </button>
              </div>

              {dbStatus && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      dbStatus.connected ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium">
                      接続状態: {dbStatus.connected ? '正常' : 'エラー'}
                    </span>
                  </div>

                  {dbStatus.connected && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {dbStatus.stores || 0}
                        </div>
                        <p className="text-sm text-gray-600">店舗数</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {dbStatus.performances || 0}
                        </div>
                        <p className="text-sm text-gray-600">実績データ</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">
                          {dbStatus.analyses || 0}
                        </div>
                        <p className="text-sm text-gray-600">分析データ</p>
                      </div>
                    </div>
                  )}

                  {!dbStatus.connected && dbStatus.error && (
                    <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                      エラー詳細: {dbStatus.error}
                    </div>
                  )}
                </div>
              )}
            </div>

              {/* サンプルデータ管理（無効化済み） */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 opacity-75">
                <h4 className="text-md font-medium text-gray-700 mb-4">
                  🗃️ サンプルデータ管理（無効化済み）
                </h4>
                
                <div className="space-y-4">
                  <button
                    onClick={handleInitDatabase}
                    className="w-full bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed transition-colors"
                    disabled
                  >
                    サンプルデータ投入（無効）
                  </button>
                  
                  <p className="text-sm text-gray-600">
                    サンプルデータ機能は無効化されています。
                    <br />
                    実データのCSVアップロード機能をご利用ください。
                  </p>
                </div>
              </div>
            </div>

            {/* 機種データ投入状況 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">🎰 機種データ投入状況</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p>• 現在の機種データ: <span className="font-mono">{systemStats?.totalStores || 0}</span>件</p>
                <p>• 人気度スコア: 自動算出済み</p>
                <p>• 大量CSV対応: バッチ処理（50件/バッチ）</p>
                <div className="mt-3 p-3 bg-blue-100 rounded">
                  <p className="font-medium">✨ 機種データ追加時の自動処理</p>
                  <ul className="mt-1 text-xs space-y-1">
                    <li>・人気度スコア自動算出</li>
                    <li>・分析エンジンへの即時反映</li>
                    <li>・おすすめ機種リスト更新</li>
                  </ul>
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
                { key: 'machines', label: '機種管理', icon: '🎰' },
                { key: 'database', label: 'データベース管理', icon: '💾' },
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
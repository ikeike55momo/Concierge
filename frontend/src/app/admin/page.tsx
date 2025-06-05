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
  const [activeTab, setActiveTab] = useState<'upload' | 'scoring' | 'stores' | 'settings' | 'database'>('upload');
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
   * サンプルデータ挿入
   */
  const handleInitDatabase = async () => {
    if (!confirm('サンプルデータを挿入しますか？既存のデータが上書きされる可能性があります。')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/init-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'サンプルデータの挿入が完了しました' });
        // 状態を再チェック
        await handleCheckDatabase();
      } else {
        setMessage({ type: 'error', text: data.error || 'サンプルデータ挿入に失敗しました' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'サンプルデータ挿入エラー' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  /**
   * CSV ファイルアップロード処理
   */
  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイル形式チェック
    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'CSVファイルを選択してください' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setUploadProgress({ uploading: true, message: 'アップロード中...' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // 強制更新フラグを追加
      if (forceUpdate) {
        formData.append('force', 'true');
      }

      const response = await fetch('/api/admin/csv-upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setUploadProgress({ 
          uploading: false, 
          message: `✅ ${result.message}`,
          details: result
        });
        setMessage({ 
          type: 'success', 
          text: `${file.name} を正常に処理しました（${result.processedCount}件）` 
        });
      } else {
        throw new Error(result.error || 'アップロードに失敗しました');
      }
    } catch (error: any) {
      setUploadProgress({ 
        uploading: false, 
        message: `❌ エラー: ${error.message}` 
      });
      setMessage({ type: 'error', text: error.message });
    } finally {
      // 結果を5秒後にクリア
      setTimeout(() => {
        setUploadProgress({ uploading: false, message: '' });
        setMessage(null);
      }, 5000);
      
      // ファイル入力をリセット
      event.target.value = '';
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
                     onChange={handleCsvUpload}
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
                 {uploadProgress.message && (
                   <div className={`p-3 rounded-md ${
                     uploadProgress.uploading 
                       ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                       : uploadProgress.message.includes('✅')
                         ? 'bg-green-50 text-green-700 border border-green-200'
                         : 'bg-red-50 text-red-700 border border-red-200'
                   }`}>
                     <div className="flex items-center">
                       {uploadProgress.uploading && (
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                       )}
                       <span className="font-medium">{uploadProgress.message}</span>
                     </div>
                     
                     {uploadProgress.details && (
                       <div className="mt-2 text-sm">
                         <p>タイプ: {uploadProgress.details.csvType}</p>
                         <p>処理件数: {uploadProgress.details.processedCount}</p>
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

              {/* サンプルデータ管理 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  🗃️ サンプルデータ管理
                </h4>
                
                <div className="space-y-4">
                  <button
                    onClick={handleInitDatabase}
                    disabled={isLoading}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? '投入中...' : 'サンプルデータ投入'}
                  </button>
                  
                  <p className="text-sm text-gray-600">
                    テスト用のサンプルデータをデータベースに投入します。
                    <br />
                    既存のデータがある場合は上書きされます。
                  </p>
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
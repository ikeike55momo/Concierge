/**
 * StoreCard Component
 * 
 * 店舗情報を表示するカードコンポーネント
 * - 店舗名、スコア、予想勝率、LLMコメントを表示
 * - スコアに応じた色分け表示（70+:緑、50-69:黄、49-:赤）
 */

import React from 'react';

interface StoreCardProps {
  /** 店舗ID */
  storeId: string;
  /** 店舗名 */
  storeName: string;
  /** 総合スコア（0-100点） */
  score: number;
  /** 予想勝率（%） */
  predictedWinRate: number;
  /** LLM生成コメント（15文字以内） */
  comment: string;
  /** ランキング順位 */
  rank: number;
  /** カードクリック時のハンドラー */
  onClick?: () => void;
}

/**
 * スコアに基づいて色分けクラスを取得
 * @param score - 総合スコア
 * @returns Tailwindクラス名
 */
const getScoreColorClass = (score: number): string => {
  if (score >= 70) return 'bg-pachislot-score-excellent text-white';
  if (score >= 50) return 'bg-pachislot-score-good text-gray-900';
  return 'bg-pachislot-score-poor text-white';
};

/**
 * スコアに基づいてステータステキストを取得
 * @param score - 総合スコア
 * @returns ステータス文字列
 */
const getStatusText = (score: number): string => {
  if (score >= 70) return '今日狙い目';
  if (score >= 50) return '普通';
  return '様子見';
};

const StoreCard: React.FC<StoreCardProps> = ({
  storeName,
  score,
  predictedWinRate,
  comment,
  rank,
  onClick
}) => {
  const colorClass = getScoreColorClass(score);
  const statusText = getStatusText(score);

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
      aria-label={`${storeName}の詳細を表示`}
    >
      {/* ヘッダー部分 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-pachislot-red-600">#{rank}</span>
            <h3 className="text-lg font-semibold text-gray-900 truncate">{storeName}</h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${colorClass}`}>
            {score}点
          </div>
        </div>
        
        {/* ステータスバッジ */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
            {statusText}
          </span>
          <span className="text-sm text-gray-600">
            勝率予想: {predictedWinRate}%
          </span>
        </div>
      </div>

      {/* コメント部分 */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-pachislot-orange-50 to-pachislot-red-50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="text-pachislot-orange-500 mt-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-800 leading-relaxed">
              {comment}
            </p>
          </div>
        </div>
      </div>

      {/* フッター部分 */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>詳細分析を見る</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StoreCard; 
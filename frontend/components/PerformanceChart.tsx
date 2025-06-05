/**
 * PerformanceChart Component
 * 
 * 店舗のパフォーマンス推移を表示するチャートコンポーネント
 * - 過去30日間の実績データ
 * - 明日の予測値
 * - イベント日のマーカー表示
 */

'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Chart.jsの必要なコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceDataPoint {
  /** 日付（YYYY-MM-DD形式） */
  date: string;
  /** 総差枚数 */
  totalDifference: number | null;
  /** 平均差枚数 */
  averageDifference: number | null;
  /** 平均ゲーム数 */
  averageGames: number;
  /** イベント情報（あれば） */
  eventInfo?: {
    eventName: string;
    eventType: string;
  };
}

interface PerformanceChartProps {
  /** パフォーマンスデータ配列 */
  data: PerformanceDataPoint[];
  /** 明日の予測値 */
  tomorrowPrediction?: {
    totalDifference: number;
    averageDifference: number;
    confidence: number; // 信頼度（0-100%）
  };
  /** チャートの高さ */
  height?: number;
  /** 店舗名（タイトル用） */
  storeName?: string;
}

/**
 * 日付文字列を表示用にフォーマット
 * @param dateString - YYYY-MM-DD形式の日付文字列
 * @returns MM/DD形式の文字列
 */
const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

/**
 * 数値を千の位区切りでフォーマット
 * @param value - 数値
 * @returns フォーマット済み文字列
 */
const formatNumber = (value: number): string => {
  return value.toLocaleString('ja-JP');
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  tomorrowPrediction,
  height = 300,
  storeName = '店舗'
}) => {
  // チャート用データの準備
  const labels = data.map(point => formatDateForDisplay(point.date));
  const totalDiffData = data.map(point => point.totalDifference);
  const avgDiffData = data.map(point => point.averageDifference);

  // 明日の予測データを追加
  if (tomorrowPrediction) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    labels.push(formatDateForDisplay(tomorrow.toISOString().split('T')[0]));
    totalDiffData.push(tomorrowPrediction.totalDifference);
    avgDiffData.push(tomorrowPrediction.averageDifference);
  }

  // イベント日のインデックスを取得
  const eventIndices = data
    .map((point, index) => point.eventInfo ? index : -1)
    .filter(index => index !== -1);

  const chartData = {
    labels,
    datasets: [
      {
        label: '総差枚数',
        data: totalDiffData,
        borderColor: '#f97316', // pachislot-orange-500
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: totalDiffData.map((_, index) => 
          eventIndices.includes(index) ? '#ef4444' : '#f97316'
        ),
        pointBorderColor: totalDiffData.map((_, index) => 
          eventIndices.includes(index) ? '#dc2626' : '#ea580c'
        ),
        pointRadius: totalDiffData.map((_, index) => 
          eventIndices.includes(index) ? 6 : 4
        ),
        tension: 0.1,
      },
      {
        label: '平均差枚数',
        data: avgDiffData,
        borderColor: '#ef4444', // pachislot-red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#dc2626',
        pointRadius: 3,
        tension: 0.1,
      }
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
          },
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: `${storeName} - パフォーマンス推移`,
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#374151', // gray-700
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const isEvent = eventIndices.includes(index);
            const eventInfo = isEvent ? data[index]?.eventInfo : null;
            
            let title = `${context[0].label}`;
            if (index === data.length && tomorrowPrediction) {
              title += ' (予測)';
            }
            if (eventInfo) {
              title += ` 🎯 ${eventInfo.eventName}`;
            }
            return title;
          },
          label: (context) => {
            const value = context.parsed.y;
            if (value === null) return '';
            
            const label = context.dataset.label || '';
            const formattedValue = formatNumber(value);
            
            if (context.dataIndex === data.length && tomorrowPrediction) {
              return `${label}: ${formattedValue} (信頼度: ${tomorrowPrediction.confidence}%)`;
            }
            
            return `${label}: ${formattedValue}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '日付',
          font: {
            size: 12,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '差枚数',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)', // gray-400 with opacity
        },
        ticks: {
          callback: function(value) {
            return formatNumber(Number(value));
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div style={{ height: `${height}px` }}>
        <Line data={chartData} options={options} />
      </div>
      
      {/* 凡例説明 */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-pachislot-red-500"></div>
          <span>イベント日</span>
        </div>
        {tomorrowPrediction && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>予測値 (信頼度: {tomorrowPrediction.confidence}%)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceChart; 
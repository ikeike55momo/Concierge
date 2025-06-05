/**
 * 店舗詳細分析取得API
 * 
 * GET /api/analysis/[storeId]
 * - 店舗の詳細分析結果取得
 * - 明日の勝率予測
 * - おすすめ機種・立ち回り提案
 */

import { NextRequest, NextResponse } from 'next/server';

// 型定義
interface RecommendedMachine {
  machineId: string;
  machineName: string;
  unitNumber: string;
  expectedDifference: number;
  reason: string;
}

interface PlayStrategy {
  recommendedEntryTime: string;
  targetMachines: string[];
  avoidMachines: string[];
  strategy: string;
  warnings: string[];
}

interface StoreAnalysis {
  storeId: string;
  storeName: string;
  totalScore: number;
  tomorrowWinRate: number;
  confidence: number;
  comment: string;
  recommendedMachines: RecommendedMachine[];
  playStrategy: PlayStrategy;
  performanceData: any[];
  tomorrowPrediction: {
    totalDifference: number;
    averageDifference: number;
    confidence: number;
  };
  analysisRationale: {
    baseScore: number;
    eventBonus: number;
    machinePopularity: number;
    accessScore: number;
    personalAdjustment: number;
  };
}

interface RequestContext {
  params: {
    storeId: string;
  };
}

/**
 * 店舗詳細分析取得
 */
export async function GET(
  request: NextRequest,
  context: RequestContext
) {
  try {
    const { storeId } = context.params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // パラメータバリデーション
    if (!storeId) {
      return NextResponse.json(
        { error: 'storeIdが指定されていません' },
        { status: 400 }
      );
    }

    // 日付バリデーション
    let targetDate = new Date().toISOString().split('T')[0];
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: '無効な日付形式です' },
          { status: 400 }
        );
      }
      targetDate = date;
    }

    // サンプルデータ取得（将来的にSupabase統合予定）
    const storeAnalysis = getSampleAnalysisData(storeId, targetDate);

    if (!storeAnalysis) {
      return NextResponse.json(
        { error: '指定された店舗の分析データが見つかりません' },
        { status: 404 }
      );
    }

    const response = {
      success: true,
      data: storeAnalysis,
      meta: {
        storeId,
        analysisDate: targetDate,
        generatedAt: new Date().toISOString()
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
 * サンプル分析データ取得
 */
function getSampleAnalysisData(storeId: string, date: string): StoreAnalysis | null {
  // 店舗IDに基づく基本データ
  const storeDataMap: Record<string, Partial<StoreAnalysis>> = {
    '1': {
      storeName: 'アイランド秋葉原店',
      totalScore: 85,
      tomorrowWinRate: 78,
      confidence: 87,
      comment: '今日は北斗シリーズが熱い！新台入替で期待度UP'
    },
    '2': {
      storeName: 'JOYPIT神田店',
      totalScore: 72,
      tomorrowWinRate: 68,
      confidence: 82,
      comment: 'ジャグラー系が安定。イベント日でおすすめ'
    },
    '3': {
      storeName: 'ガイア渋谷店',
      totalScore: 58,
      tomorrowWinRate: 52,
      confidence: 75,
      comment: '安定した出玉が期待できる優良店'
    }
  };

  const baseData = storeDataMap[storeId];
  if (!baseData) {
    return null;
  }

  // 共通データ構造
  const commonAnalysis: StoreAnalysis = {
    storeId,
    storeName: baseData.storeName || '店舗名不明',
    totalScore: baseData.totalScore || 50,
    tomorrowWinRate: baseData.tomorrowWinRate || 50,
    confidence: baseData.confidence || 70,
    comment: baseData.comment || 'AI分析コメント',
    recommendedMachines: [
      {
        machineId: 'M001',
        machineName: '北斗の拳 宿命',
        unitNumber: '101-103',
        expectedDifference: 1500,
        reason: '過去3日間で安定した出玉実績。設定示唆が良好'
      },
      {
        machineId: 'M002', 
        machineName: 'ゴッドイーター3',
        unitNumber: '205-207',
        expectedDifference: 1200,
        reason: 'イベント日の期待値が高い。朝一狙い推奨'
      },
      {
        machineId: 'M003',
        machineName: 'バイオハザード RE:2',
        unitNumber: '315-318',
        expectedDifference: 980,
        reason: '朝一リセット狙いに最適。中間設定濃厚'
      }
    ],
    playStrategy: {
      recommendedEntryTime: '10:30-11:00',
      targetMachines: ['北斗の拳 101-103番台', 'ゴッドイーター 205-207番台'],
      avoidMachines: ['マイジャグラー系', '低設定が疑われる角台'],
      strategy: '朝一は北斗の拳シリーズを狙い、空いていればゴッドイーターも検討。昼過ぎからは様子を見て台移動を検討してください。',
      warnings: [
        '混雑時は無理な追いかけは禁物',
        '予算管理を徹底し、損切りラインを明確に',
        'イベント日のため通常より混雑が予想されます'
      ]
    },
    performanceData: [
      { date: '2025-05-20', totalDifference: 125000, averageDifference: 325, averageGames: 6516 },
      { date: '2025-05-21', totalDifference: 153000, averageDifference: 398, averageGames: 5623 },
      { date: '2025-05-22', totalDifference: 125000, averageDifference: 325, averageGames: 6097 },
      { date: '2025-05-23', totalDifference: 132000, averageDifference: 345, averageGames: 6810 },
      { date: '2025-05-24', totalDifference: 121000, averageDifference: 314, averageGames: 6564 }
    ],
    tomorrowPrediction: {
      totalDifference: 140000,
      averageDifference: 364,
      confidence: baseData.confidence || 70
    },
    analysisRationale: {
      baseScore: 70,
      eventBonus: 8,
      machinePopularity: 5,
      accessScore: 2,
      personalAdjustment: 0
    }
  };

  return commonAnalysis;
} 
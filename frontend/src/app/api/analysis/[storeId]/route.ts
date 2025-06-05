/**
 * 店舗詳細分析取得API
 * 
 * GET /api/analysis/[storeId]
 * - 店舗の詳細分析結果取得
 * - 明日の勝率予測
 * - おすすめ機種・立ち回り提案
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '../../../../../lib/supabase';

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

    // データベースから店舗分析データを取得
    const storeAnalysis = await dbHelpers.getStoreAnalysis(storeId, targetDate);

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
        generatedAt: new Date().toISOString(),
        source: 'database'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('API エラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'データベース接続エラーが発生しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
} 
/**
 * AI分析生成API
 * 
 * POST /api/analysis/generate
 * - Claude APIを使用した店舗分析生成
 * - リアルタイム分析結果返却
 * - フォールバック機能付き
 */

import { NextRequest, NextResponse } from 'next/server';

interface GenerateAnalysisRequest {
  /** 店舗ID */
  storeId: string;
  /** 分析日 */
  analysisDate?: string;
  /** 分析タイプ */
  analysisType?: 'daily' | 'weekly' | 'event';
  /** 店舗データを強制的に使用（テスト用） */
  useTestData?: boolean;
}

/**
 * 分析生成
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateAnalysisRequest = await request.json();
    
    // バリデーション
    if (!body.storeId) {
      return NextResponse.json(
        { error: 'storeIdが指定されていません' },
        { status: 400 }
      );
    }

    const analysisDate = body.analysisDate || new Date().toISOString().split('T')[0];
    const analysisType = body.analysisType || 'daily';

      // Claude APIキーをチェック
  const claudeApiKey = process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey && !body.useTestData) {
    console.warn('Claude API キーが設定されていません。テストデータを使用します。');
    }

    try {
      // 店舗データを取得（現在はサンプルデータ）
      const storeData = await getStoreData(body.storeId, body.useTestData);
      
      if (!storeData) {
        return NextResponse.json(
          { error: '店舗データが見つかりません' },
          { status: 404 }
        );
      }

      // 現在はフォールバック分析のみ実装
      // TODO: Claude API統合は次の段階で実装
      const analysisResult = generateFallbackAnalysis(body.storeId, analysisDate);

      // レスポンス形成
      const response = {
        success: true,
        data: analysisResult,
        meta: {
          generatedAt: new Date().toISOString(),
          method: 'fallback',
          version: '1.0.0'
        }
      };

      return NextResponse.json(response);

    } catch (analysisError) {
      console.error('分析生成エラー:', analysisError);
      
      // フォールバック分析を生成
      const fallbackAnalysis = generateFallbackAnalysis(body.storeId, analysisDate);
      
      const response = {
        success: true,
        data: fallbackAnalysis,
        meta: {
          generatedAt: new Date().toISOString(),
          method: 'fallback',
          warning: '分析APIエラーのためフォールバック分析を使用'
        }
      };

      return NextResponse.json(response);
    }

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
 * 店舗データ取得
 * 
 * TODO: 将来的にSupabaseから実データを取得
 */
async function getStoreData(storeId: string, useTestData = false) {
  // 現在はサンプルデータを返却
  // 将来的にはSupabaseからデータを取得する予定
  
  const storeNameMap: Record<string, string> = {
    '1': 'アイランド秋葉原店',
    '2': 'JOYPIT神田店',
    '3': 'ガイア渋谷店',
    '4': 'エスパス新宿南口店',
    '5': 'パーラー太陽池袋店'
  };

  const storeName = storeNameMap[storeId];
  if (!storeName) {
    return null;
  }

  // サンプルデータを生成（簡易版）
  return {
    storeId,
    storeName,
    recentPerformances: [],
    availableMachines: [],
    upcomingEvents: [],
    storeInfo: {}
  };
}

/**
 * フォールバック分析生成
 */
function generateFallbackAnalysis(storeId: string, analysisDate: string) {
  const storeNameMap: Record<string, { name: string; score: number; winRate: number; comment: string }> = {
    '1': {
      name: 'アイランド秋葉原店',
      score: 85,
      winRate: 78,
      comment: '今日は北斗シリーズが熱い！新台入替で期待度UP'
    },
    '2': {
      name: 'JOYPIT神田店',
      score: 72,
      winRate: 68,
      comment: 'ジャグラー系が安定。イベント日でおすすめ'
    },
    '3': {
      name: 'ガイア渋谷店',
      score: 58,
      winRate: 52,
      comment: '安定した出玉が期待できる優良店'
    },
    '4': {
      name: 'エスパス新宿南口店',
      score: 54,
      winRate: 49,
      comment: '平日狙いがおすすめ。アクセス良好'
    },
    '5': {
      name: 'パーラー太陽池袋店',
      score: 48,
      winRate: 45,
      comment: '様子見推奨。週末は混雑予想'
    }
  };

  const storeInfo = storeNameMap[storeId] || {
    name: '不明な店舗',
    score: 50,
    winRate: 50,
    comment: 'データが不足しています'
  };

  return {
    storeId,
    storeName: storeInfo.name,
    analysisDate,
    analysisType: 'daily' as const,
    totalScore: storeInfo.score,
    predictedWinRate: storeInfo.winRate,
    confidence: 75,
    comment: storeInfo.comment,
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
    analysisRationale: {
      baseScore: 70,
      eventBonus: 8,
      machinePopularity: 5,
      accessScore: 2,
      personalAdjustment: 0
    }
  };
} 
/**
 * 管理画面用システム統計API
 * 
 * GET /api/admin/stats
 * - システム統計情報取得
 * - 店舗数、分析数等のサマリー
 */

import { NextRequest, NextResponse } from 'next/server';

// 型定義
interface SystemStats {
  totalStores: number;
  activeStores: number;
  todayAnalyses: number;
  lastUpdate: string;
  performanceMetrics: {
    avgResponseTime: number;
    successRate: number;
    totalRequests: number;
  };
  storageMetrics: {
    totalDataSize: string;
    csvUploads: number;
    lastBackup: string;
  };
}

/**
 * システム統計情報取得
 */
export async function GET(request: NextRequest) {
  try {
    // サンプル統計データ（将来的にSupabase統合予定）
    const systemStats: SystemStats = {
      totalStores: 385,
      activeStores: 352,
      todayAnalyses: 1247,
      lastUpdate: new Date().toISOString(),
      performanceMetrics: {
        avgResponseTime: 234, // ms
        successRate: 99.8, // %
        totalRequests: 15687
      },
      storageMetrics: {
        totalDataSize: '2.3 GB',
        csvUploads: 142,
        lastBackup: new Date(Date.now() - 86400000).toISOString() // 1日前
      }
    };

    const response = {
      success: true,
      data: systemStats,
      meta: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
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
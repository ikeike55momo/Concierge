/**
 * データベース初期化API
 * 
 * POST /api/admin/init-db
 * - データベース状態チェック
 * - サンプルデータ挿入
 * - 開発・テスト環境用
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '../../../../../lib/supabase';

/**
 * データベース初期化処理
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディ取得
    const body = await request.json();
    const { action } = body;

    if (action === 'check') {
      // データベース状態チェック
      const status = await dbHelpers.checkDatabaseStatus();
      
      return NextResponse.json({
        success: true,
        status,
        message: status.connected ? 'データベース接続正常' : 'データベース接続エラー'
      });

    } else if (action === 'init') {
      // サンプルデータ挿入
      try {
        const result = await dbHelpers.insertSampleData();
        
        return NextResponse.json({
          success: true,
          result,
          message: 'サンプルデータの挿入が完了しました'
        });

      } catch (dbError) {
        console.error('サンプルデータ挿入エラー:', dbError);
        
        return NextResponse.json({
          success: false,
          error: 'サンプルデータ挿入に失敗しました',
          details: dbError instanceof Error ? dbError.message : '不明なエラー'
        }, { status: 500 });
      }

    } else {
      return NextResponse.json(
        { 
          success: false,
          error: '無効なアクション',
          availableActions: ['check', 'init']
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('データベース初期化API エラー:', error);
    
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
 * データベース状態取得
 */
export async function GET() {
  try {
    const status = await dbHelpers.checkDatabaseStatus();
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('データベース状態取得エラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'データベース状態取得に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
} 
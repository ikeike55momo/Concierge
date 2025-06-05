/**
 * 環境変数とSupabase接続のテスト用API
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // 環境変数の確認
    const envVars = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };

    // URL形式の確認
    const urlValid = envVars.SUPABASE_URL?.includes('supabase.co');
    
    // Supabase接続テスト
    let connectionTest = null;
    try {
      if (envVars.SUPABASE_URL && envVars.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(
          envVars.SUPABASE_URL,
          envVars.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // 簡単な接続テスト
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .limit(1);
        
        if (error) {
          connectionTest = { success: false, error: error.message };
        } else {
          connectionTest = { success: true, tablesFound: data?.length || 0 };
        }
      }
    } catch (e: any) {
      connectionTest = { success: false, error: e.message };
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        SUPABASE_URL: envVars.SUPABASE_URL ? `${envVars.SUPABASE_URL.substring(0, 30)}...` : 'NOT_SET',
        SUPABASE_SERVICE_ROLE_KEY: envVars.SUPABASE_SERVICE_ROLE_KEY ? `${envVars.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NOT_SET',
        NEXT_PUBLIC_SUPABASE_URL: envVars.NEXT_PUBLIC_SUPABASE_URL ? `${envVars.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'NOT_SET',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT_SET'
      },
      validation: {
        urlValid,
        hasServiceRoleKey: !!envVars.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      connectionTest
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 
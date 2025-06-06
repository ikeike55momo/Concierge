/**
 * デバッグ用API
 * store_performancesテーブルの最新データ状況を確認
 */
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    // 最新3件のデータを取得
    const { data: latestData, error: latestError } = await supabase
      .from('store_performances')
      .select('*')
      .eq('store_id', '001')
      .order('date', { ascending: false })
      .limit(3)

    if (latestError) {
      throw latestError
    }

    // machine_performancesがnullでないデータを確認
    const { data: machineData, error: machineError } = await supabase
      .from('store_performances')
      .select('date, machine_performances, top10_rankings')
      .eq('store_id', '001')
      .not('machine_performances', 'is', null)
      .order('date', { ascending: false })
      .limit(5)

    if (machineError) {
      throw machineError
    }

    // top10_rankingsがnullでないデータを確認
    const { data: top10Data, error: top10Error } = await supabase
      .from('store_performances')
      .select('date, top10_rankings')
      .eq('store_id', '001')
      .not('top10_rankings', 'is', null)
      .order('date', { ascending: false })
      .limit(5)

    if (top10Error) {
      throw top10Error
    }

    return NextResponse.json({
      success: true,
      data: {
        latestData: latestData,
        machineDataCount: machineData?.length || 0,
        machineDataSample: machineData?.slice(0, 2) || [],
        top10DataCount: top10Data?.length || 0,
        top10DataSample: top10Data?.slice(0, 2) || []
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
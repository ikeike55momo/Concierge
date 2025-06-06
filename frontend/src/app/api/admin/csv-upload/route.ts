/**
 * CSV アップロード & Supabase 同期 API
 * 
 * 主な機能:
 * - CSV ファイルのアップロード処理
 * - CSV データの解析・バリデーション
 * - Supabase への自動同期
 * - エラーハンドリング
 * 
 * 対応する CSV タイプ:
 * - store_{store_id}.csv (店舗マスタ)
 * - store_production_info_{store_id}.csv (店舗出玉情報)
 * - machines_info.csv (機種マスタ)
 * - event_{event_id}.csv (イベントマスタ)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../../../../lib/supabase';
import { detectDataType, processStoreCSV, processMachineCSV, ProcessedData } from '../../../../../lib/csv-processor';

// 環境変数の確認
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables:', {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });
}

const supabaseClient = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * CSV データ型定義
 */
interface CsvRow {
  [key: string]: string;
}

interface StoreData {
  store_id: string;
  store_name?: string;
  prefecture?: string;
  city?: string;
  full_address?: string;
  total_machines?: number;
  pachinko_machines?: number;
  pachislot_machines?: number;
  walk_minutes?: string;
  distance_from_station?: string;
  weekday_opening_time?: string;
  weekday_closing_time?: string;
  latitude?: number;
  longitude?: number;
  establishment_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MachineData {
  machine_id: string;
  machine_name: string;
  manufacturer?: string;
  machine_type?: string;
  popularity_score?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * CSV パース処理
 */
function parseCsvContent(content: string): CsvRow[] {
  console.log('CSV解析開始: コンテンツサイズ', content.length);
  
  // シンプルで堅牢なCSVパーサーを使用
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.log('空のCSVファイル');
    return [];
  }
  
  // ヘッダー行を解析
  const headers = parseCSVLine(lines[0]);
  console.log('CSVヘッダー:', headers);
  
  const rows: CsvRow[] = [];
  
  // データ行を解析
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.some(v => v.length > 0)) { // 空行をスキップ
      const row: CsvRow = {
        number: '',
        element: '',
        要素名: '',
        情報: ''
      };
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        row[header.trim()] = value;
      });
      
      rows.push(row);
    }
  }
  
  console.log(`CSV解析完了: ${rows.length}行解析`);
  console.log('最初の3行:', rows.slice(0, 3));
  
  return rows;
}

/**
 * CSV行を正しく解析する関数
 * 引用符で囲まれたフィールドとエスケープクォートを適切に処理
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (!inQuotes) {
        // クォートの開始
        inQuotes = true;
      } else if (nextChar === '"') {
        // エスケープされたクォート
        current += '"';
        i++; // 次の文字をスキップ
      } else {
        // クォートの終了
        inQuotes = false;
      }
    } else if (!inQuotes && char === ',') {
      // フィールドの区切り
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  // 最後のフィールドを追加
  result.push(current.trim());
  
  return result;
}

/**
 * 店舗マスタ CSV → Supabase 変換（新フォーマット対応）
 */
async function syncStoreData(storeId: string, csvData: CsvRow[]) {
  const storeData: any = {
    store_id: storeId,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // CSV データから店舗情報を抽出（更新されたCSV形式に対応）
      csvData.forEach(row => {
      if (!row['情報']) return; // 空の情報はスキップ
      
      switch (row['element']) {
        case 'official_store_name_image':
        case 'official_store_name':
        case 'official_store_name2':
          storeData.store_name = row['情報'];
          break;
        case 'prefecture_image':
        case 'prefecture':
          storeData.prefecture = row['情報'];
          break;
        case 'city_image':
        case 'city':
          storeData.city = row['情報'];
          break;
        case 'address_details_image':
        case 'full_address':
          storeData.address = row['情報'].split(',')[0]; // 最初のアドレスを使用
          storeData.full_address = row['情報'];
          break;
        case 'nearest_station_image':
        case 'nearest_station_name':
        case 'nearest_station':
          storeData.nearest_station = row['情報'];
          break;
        case 'postal_code':
          storeData.postal_code = row['情報'];
          break;
        case 'walk_minutes_from_station':
        case 'distance_from_station_image':
        case 'station_access':
          // 徒歩時間の抽出
          const walkMatch = row['情報'].match(/(\d+)分/);
          if (walkMatch) {
            storeData.walk_minutes = parseInt(walkMatch[1]);
            storeData.distance_from_station = parseInt(walkMatch[1]) * 80; // 徒歩1分≈80m
          }
          break;
        case 'weekday_opening_time':
          storeData.opening_hours = row['情報'];
          break;
        case 'weekday_closing_time':
          if (storeData.opening_hours) {
            storeData.business_hours = `${storeData.opening_hours}-${row['情報']}`;
          }
          break;
        case 'business_hours':
          storeData.opening_hours = row['情報'];
          break;
        case 'total_machines_count_image':
        case 'total_machines':
          storeData.total_machines = parseInt(row['情報'].replace(/[^\d]/g, '')) || 0;
          break;
        case 'pachinko_machines_count_image':
        case 'pachinko_machines':
          storeData.pachinko_machines = parseInt(row['情報'].replace(/[^\d]/g, '')) || 0;
          break;
        case 'slot_machines_count_image':
        case 'pachislot_machines':
          storeData.pachislot_machines = parseInt(row['情報'].replace(/[^\d]/g, '')) || 0;
          break;
        case 'phone_number':
          storeData.phone_number = row['情報'];
          break;
        case 'official_website_url':
        case 'website_url':
          storeData.website_url = row['情報'];
          break;
        case 'parking_availability_image':
        case 'parking_capacity':
        case 'parking_info':
          storeData.parking_available = row['情報'].includes('あり') || row['情報'].includes('有') || parseInt(row['情報']) > 0;
          if (parseInt(row['情報'])) {
            storeData.parking_spots = parseInt(row['情報']) || 0;
          }
          break;
        case 'smoking_area_available':
        case 'smoking_policy':
          storeData.smoking_allowed = row['情報'].includes('有') || row['情報'].includes('あり') || !row['情報'].includes('禁煙');
          break;
        case 'special_days_info_image':
        case 'event_frequency':
          // 特定日の情報から頻度を推定
          if (row['情報'].includes('毎月') || row['情報'].includes('ゾロ目')) {
            const dayCount = (row['情報'].match(/\d+日/g) || []).length;
            storeData.event_frequency = dayCount + 2; // ゾロ目日等も含む
          } else if (row['情報'].includes('週')) {
            storeData.event_frequency = parseInt(row['情報'].replace(/[^\d]/g, '')) * 4;
          } else {
            storeData.event_frequency = parseInt(row['情報'].replace(/[^\d]/g, '')) || 0;
          }
          break;
        case 'latitude':
          storeData.latitude = parseFloat(row['情報']) || null;
          break;
        case 'longitude':
          storeData.longitude = parseFloat(row['情報']) || null;
          break;
        case 'establishment_date_image':
        case 'opening_date':
          storeData.establishment_date = row['情報'];
          break;
        case 'special_features':
          storeData.popular_machines = row['情報'].split(',').map(s => s.trim());
          break;
    }
  });

  // 必須フィールドのデフォルト値設定
  if (!storeData.store_name) {
    storeData.store_name = `店舗${storeId}`;
  }
  if (!storeData.prefecture) {
    storeData.prefecture = '不明';
  }

  // Supabase に upsert
  const { error } = await supabaseClient
    .from('stores')
    .upsert(storeData, { onConflict: 'store_id' });

  if (error) throw error;
  return storeData;
}

/**
 * 営業実績 CSV → Supabase 変換（包括的対応）
 * day_X: 店舗日別サマリー
 * machine_day_X: 機種毎の日別サマリー  
 * top10_day_X: 日別TOP10機種ランキング
 */
async function syncStoreProductionData(storeId: string, csvData: CsvRow[], forceUpdate: boolean = false) {
  const performances: any[] = [];
  const machinePerformancesByDate = new Map(); // 日付別機種パフォーマンス
  const top10DataByDate = new Map(); // 日付別TOP10データ
  
  console.log(`営業実績処理開始: 店舗ID=${storeId}, CSVデータ行数=${csvData.length}, 強制更新=${forceUpdate}`);
  
  // 既存データ日付を取得（パフォーマンス最適化）
  let existingDates: string[] = [];
  if (!forceUpdate) {
    console.log('既存データ日付を確認中...');
    const { data: existingData, error: existingError } = await supabaseClient
      .from('store_performances')
      .select('date')
      .eq('store_id', storeId);
    
    if (existingError) {
      console.warn('既存データ確認エラー:', existingError);
    } else {
      existingDates = existingData?.map(d => d.date) || [];
      console.log(`既存データ: ${existingDates.length}日分`);
    }
  }
  
  /**
   * JSONデータをクリーンアップして解析
   */
  function parseJsonInfo(info: string, elementName: string): any[] | null {
    try {
      let cleanedInfo = info;
      
      // ダブルクォートのエスケープを解除
      if (cleanedInfo.startsWith('"') && cleanedInfo.endsWith('"')) {
        cleanedInfo = cleanedInfo.slice(1, -1);
      }
      cleanedInfo = cleanedInfo.replace(/""/g, '"');
      
      // JSONの完全性チェック
      if (!cleanedInfo.trim().startsWith('[') || !cleanedInfo.trim().endsWith(']')) {
        console.warn(`${elementName}: 不完全なJSONデータをスキップ`);
        return null;
      }
      
      const parsedData = JSON.parse(cleanedInfo);
      console.log(`${elementName}のJSONデータ解析成功:`, parsedData.length, '件');
      return Array.isArray(parsedData) ? parsedData : null;
      
    } catch (e) {
      console.warn(`${elementName}: JSON parse error:`, e);
      return null;
    }
  }
  
  // Phase 1: 全データを種類別に分類・収集
  csvData.forEach((row, index) => {
    const element = row['element'];
    const info = row['情報'];
    
    if (!element || !info) return;
    
    console.log(`行${index}: ${element}`);
    
    // 1. day_X: 店舗日別サマリー
    if (element.startsWith('day_') && !element.includes('machine_') && !element.includes('top10_')) {
      const dayData = parseJsonInfo(info, element);
      if (dayData) {
        const dayNumber = parseInt(element.replace('day_', ''));
        
        dayData.forEach(data => {
          if (!data.year || !data.month) return;
          
          const date = new Date(data.year, data.month - 1, dayNumber);
          const dateString = date.toISOString().split('T')[0];
          
          // 既存データチェック（強制更新でない場合）
          if (!forceUpdate && existingDates.includes(dateString)) {
            console.log(`既存データスキップ: ${dateString}`);
            return;
          }
          
          const performanceData = {
            performance_id: `perf_${storeId}_${dateString}`,
            store_id: storeId,
            date: dateString,
            total_difference: data.total_diff || 0,
            average_difference: data.avg_diff || 0,
            average_games: data.avg_games || 5000,
            total_visitors: data.total_visitors || 200,
            machine_performances: {}, // 後で machine_day_X で更新
            top10_rankings: [], // 後で top10_day_X で更新
            day_of_week: date.getDay().toString(),
            is_event_day: data.is_event || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          performances.push(performanceData);
          console.log(`店舗サマリー追加: ${dateString}`);
        });
      }
    }
    
    // 2. machine_day_X: 機種毎の日別サマリー
    else if (element.startsWith('machine_day_')) {
      const machineData = parseJsonInfo(info, element);
      if (machineData) {
        const dayNumber = parseInt(element.replace('machine_day_', ''));
        
        machineData.forEach(data => {
          if (!data.year || !data.month || !data.machines) return;
          
          const date = new Date(data.year, data.month - 1, dayNumber);
          const dateString = date.toISOString().split('T')[0];
          
          // 機種データを日付別にグループ化
          if (!machinePerformancesByDate.has(dateString)) {
            machinePerformancesByDate.set(dateString, {});
          }
          
          const dayMachineData = machinePerformancesByDate.get(dateString);
          
          // 各機種のデータを統合
          Object.keys(data.machines).forEach(machineId => {
            const machineInfo = data.machines[machineId];
            
            // unitsデータから合計値を計算
            const units = machineInfo.units || {};
            let totalDiff = 0;
            let totalGames = 0;
            let unitCount = 0;
            
            Object.keys(units).forEach(unitId => {
              const unit = units[unitId];
              totalDiff += unit.diff || 0;
              totalGames += unit.games || 0;
              unitCount++;
            });
            
            const avgDiff = unitCount > 0 ? Math.round(totalDiff / unitCount) : 0;
            
            dayMachineData[machineId] = {
              machine_name: machineInfo.machine_name,
              total_diff: machineInfo.total_diff || totalDiff,
              avg_diff: machineInfo.avg_diff || avgDiff, 
              total_games: machineInfo.total_games || totalGames,
              unit_count: unitCount,
              units: units
            };
          });
          
          console.log(`機種データ追加: ${dateString}, 機種数: ${Object.keys(data.machines).length}`);
        });
      }
    }
    
    // 3. top10_day_X: 日別TOP10機種ランキング  
    else if (element.startsWith('top10_day_')) {
      const top10Data = parseJsonInfo(info, element);
      if (top10Data) {
        const dayNumber = parseInt(element.replace('top10_day_', ''));
        
        top10Data.forEach(data => {
          if (!data.year || !data.month || !data.top10) return;
          
          const date = new Date(data.year, data.month - 1, dayNumber);
          const dateString = date.toISOString().split('T')[0];
          
          if (!top10DataByDate.has(dateString)) {
            top10DataByDate.set(dateString, []);
          }
          
          top10DataByDate.get(dateString).push({
            month: data.month,
            year: data.year,
            top10: data.top10
          });
          
          console.log(`TOP10データ追加: ${dateString}, ランキング数: ${data.top10.length}`);
        });
      }
    }
  });
  
  // Phase 2: 機種パフォーマンスデータとTOP10データをstore_performancesに統合
  performances.forEach(performance => {
    const dateString = performance.date;
    
    // 機種パフォーマンスデータを統合
    if (machinePerformancesByDate.has(dateString)) {
      performance.machine_performances = machinePerformancesByDate.get(dateString);
    }
    
    // TOP10データを統合
    if (top10DataByDate.has(dateString)) {
      performance.top10_rankings = top10DataByDate.get(dateString);
    }
    
    console.log(`最終統合データ: ${dateString}`, {
      機種数: Object.keys(performance.machine_performances).length,
      TOP10データ数: performance.top10_rankings?.length || 0
    });
  });

  console.log(`処理結果: ${performances.length}件のパフォーマンスデータを作成`);
  console.log(`機種データ統合: ${machinePerformancesByDate.size}日分`);
  console.log(`TOP10データ統合: ${top10DataByDate.size}日分`);

  // 機種データやTOP10データがある場合、既存レコードを更新
  const allDatesArray = [...Array.from(machinePerformancesByDate.keys()), ...Array.from(top10DataByDate.keys())];
  const uniqueDatesSet = new Set(allDatesArray);
  const uniqueDates = Array.from(uniqueDatesSet);
  const updatePromises: Promise<{ error: any; dateString: string }>[] = [];

  for (const dateString of uniqueDates) {
    const updates: any = {};
    
    if (machinePerformancesByDate.has(dateString)) {
      updates.machine_performances = machinePerformancesByDate.get(dateString);
    }
    
    if (top10DataByDate.has(dateString)) {
      updates.top10_rankings = top10DataByDate.get(dateString);
    }
    
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      
      const updatePromise = async () => {
        const { error } = await supabaseClient
          .from('store_performances')
          .update(updates)
          .eq('store_id', storeId)
          .eq('date', dateString);
        return { error, dateString };
      };
      
      updatePromises.push(updatePromise());
      
      console.log(`既存データ更新: ${dateString}`, {
        機種数: updates.machine_performances ? Object.keys(updates.machine_performances).length : 0,
        TOP10データ数: updates.top10_rankings ? updates.top10_rankings.length : 0
      });
    }
  }

  // 機種データ・TOP10データの更新を実行
  if (updatePromises.length > 0) {
    console.log(`既存データ更新開始: ${updatePromises.length}件`);
    const results = await Promise.all(updatePromises);
    
    let updatedCount = 0;
    results.forEach((result) => {
      if (result.error) {
        console.error(`更新エラー (${result.dateString}):`, result.error);
      } else {
        updatedCount++;
      }
    });
    
    console.log(`✅ 既存データ更新完了: ${updatedCount}件`);
  }

  // バッチ処理でパフォーマンス最適化（新規データ）
  if (performances.length > 0) {
    const BATCH_SIZE = 100; // バッチサイズ
    let insertedCount = 0;
    
    console.log(`バッチ処理開始: ${performances.length}件を${BATCH_SIZE}件ずつ処理`);
    
    for (let i = 0; i < performances.length; i += BATCH_SIZE) {
      const batch = performances.slice(i, i + BATCH_SIZE);
      
      console.log(`バッチ ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(performances.length / BATCH_SIZE)}: ${batch.length}件処理中...`);
      
      const { error } = await supabaseClient
        .from('store_performances')
        .upsert(batch, { onConflict: 'performance_id' });

      if (error) {
        console.error(`バッチ処理エラー (${i}-${i + batch.length - 1}):`, error);
        throw error;
      }
      
      insertedCount += batch.length;
      console.log(`バッチ完了: ${insertedCount}/${performances.length}件`);
      
      // 大量データ処理時のCPU負荷軽減
      if (performances.length > 1000) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    console.log(`✅ Supabaseに${insertedCount}件のデータを挿入完了`);
  } else {
    console.log('🔄 新しく処理するデータがありません（既存データスキップ）');
  }

  return performances;
}

/**
 * 機種マスタ CSV → Supabase 変換
 */
async function syncMachineData(csvData: CsvRow[]) {
  console.log('機種マスタ処理開始: 基本情報1件、詳細情報' + csvData.length + '件');
  
  // CSVデータから機種基本情報を抽出
  const machineId = csvData[0]?.machine_id || '001';
  let machineName = '';
  
  // 機種名を特定（machine_name_imageまたは最初の有効な情報から）
  const machineNameRow = csvData.find(row => 
    ['machine_name_image', 'machine_name', 'model_name'].includes(row.element)
  );
  machineName = machineNameRow?.情報 || `機種${machineId}`;
  
  // 機種基本情報
  const machineData: MachineData = {
    machine_id: machineId,
    machine_name: machineName,
    manufacturer: '',
    machine_type: 'pachislot',
    popularity_score: estimateMachinePopularity(machineName),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // 詳細情報から追加のフィールドを抽出
  csvData.forEach(row => {
    switch (row.element) {
      case 'manufacturer':
        machineData.manufacturer = row.情報;
        break;
      case 'machine_type':
        machineData.machine_type = row.情報.includes('パチンコ') ? 'pachinko' : 'pachislot';
        break;
    }
  });
  
  // Supabase に機種基本情報を保存
  const { error: machineError } = await supabaseClient
    .from('machines')
    .upsert(machineData, { onConflict: 'machine_id' });
  
  if (machineError) {
    throw new Error(`機種基本情報保存エラー: ${machineError.message}`);
  }
  
  console.log('機種基本情報保存完了: 1件');
  
  // 機種詳細情報の準備
  const machineDetails = csvData.map(row => ({
    machine_id: machineId,
    element: row.element,
    element_name: row.要素名,
    information: row.情報,
    importance: parseInt(row.重要度 || '0') || 0,
    category: row.大項目 || null,
    number: parseInt(row.number) || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  // バッチでupsert実行
  const BATCH_SIZE = 100;
  let totalProcessed = 0;
  
  for (let i = 0; i < machineDetails.length; i += BATCH_SIZE) {
    const batch = machineDetails.slice(i, i + BATCH_SIZE);
    const batchEnd = Math.min(i + BATCH_SIZE - 1, machineDetails.length - 1);
    
    const { error: detailError } = await supabaseClient
      .from('machine_details')
      .upsert(batch, { onConflict: 'machine_id,element' });
    
    if (detailError) {
      throw new Error(`機種詳細バッチupsertエラー (${i}-${batchEnd}): ${detailError.message}`);
    }
    
    console.log(`機種詳細バッチupsert完了: ${i}-${batchEnd} (${batch.length}件)`);
    totalProcessed += batch.length;
  }
  
  console.log(`機種詳細データupsert完了: ${totalProcessed}件処理`);
  return machineData;
}

function estimateMachinePopularity(machineName: string): number {
  // 人気機種のキーワードベース推定
  const popularKeywords = [
    'ジャグラー', 'バジリスク', 'ゴジラ', 'エヴァンゲリオン', 'パチスロ',
    'ハナハナ', 'アイムジャグラー', 'ファンキージャグラー', 'マイジャグラー',
    'ゴッド', 'リゼロ', 'このすば', '押忍番長', 'コードギアス'
  ];
  
  const lowerName = machineName.toLowerCase();
  let score = 30; // ベーススコア
  
  for (const keyword of popularKeywords) {
    if (lowerName.includes(keyword.toLowerCase())) {
      score += 15;
      break;
    }
  }
  
  // 新機種は人気度アップ
  if (lowerName.includes('新') || lowerName.includes('最新')) {
    score += 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * イベントマスタ CSV → Supabase 変換（新フォーマット対応）
 */
async function syncEventData(eventId: string, csvData: CsvRow[]) {
  const eventData: any = {
    event_id: eventId,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    target_stores: []
  };

  let firstEventDate: string | null = null;

  // イベント基本情報の抽出
  csvData.forEach(row => {
    if (!row['情報']) return;
    
    switch (row['element']) {
      case 'event_name':
        eventData.event_name = row['情報'];
        break;
      case 'event_type':
        eventData.event_type = row['情報'];
        break;
      case 'expected_bonus':
        eventData.bonus_multiplier = parseFloat(row['情報']) || 1.0;
        break;
      case 'description':
        eventData.description = row['情報'];
        break;
    }
    
    // day_X の処理（イベント開催日）
    if (row['element'].startsWith('day_') && row['情報']) {
      try {
        const dayData = JSON.parse(row['情報']);
        if (Array.isArray(dayData)) {
          dayData.forEach(data => {
            const date = new Date(data.year, data.month - 1, parseInt(row['element'].replace('day_', '')));
            const dateString = date.toISOString().split('T')[0];
            
            // 最初に見つかった日付をevent_dateに設定
            if (!firstEventDate) {
              firstEventDate = dateString;
            }
            
            if (data.store_id && !eventData.target_stores.includes(data.store_id)) {
              eventData.target_stores.push(data.store_id);
            }
          });
        }
      } catch (e) {
        console.warn(`JSON parse error for ${row['element']}:`, e);
      }
    }
  });

  // event_dateを設定（必須フィールド）
  eventData.event_date = firstEventDate || new Date().toISOString().split('T')[0];

  const { error } = await supabaseClient
    .from('events')
    .upsert(eventData, { onConflict: 'event_id' });

  if (error) throw error;
  return eventData;
}

/**
 * CSV一括アップロードAPI
 * 
 * POST /api/admin/csv-upload
 * - 機種データ、イベントデータ、店舗データの自動判別アップロード
 * - バッチ処理による大量データ対応
 */

/**
 * CSV一括アップロード処理
 */
export async function POST(request: NextRequest) {
  try {
    console.log('CSV一括アップロード開始...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 });
    }
    
    const content = await file.text();
    const csvData = parseCsvContent(content);
    
    if (csvData.length === 0) {
      return NextResponse.json({ error: 'CSVデータが空です' }, { status: 400 });
    }
    
    // データタイプを自動検出（ヘッダーから）
    const headers = Object.keys(csvData[0] || {});
    const dataType = detectDataType(headers);
    console.log('検出されたデータタイプ:', dataType);
    
    let savedCount = 0;
    const errors: string[] = [];
    
    try {
      switch (dataType) {
        case 'stores':
          const storeData = processStoreCSV(content);
          savedCount = await saveStoreData(storeData, errors);
          break;
        case 'machines':
          const processedData = processMachineCSV(content);
          if (processedData.dataType === 'machines') {
            const result = await syncMachineData(csvData);
            console.log('機種データ保存完了: 1件');
            savedCount = 1;
          }
          break;
        default:
          throw new Error(`対応していないデータタイプ: ${dataType}`);
      }
    } catch (error) {
      console.error('データ保存エラー:', error);
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }
    
    const result = {
      success: savedCount > 0,
      message: savedCount > 0 ? 
        `CSV一括アップロード完了: ${savedCount}/${csvData.length}件保存` :
        'データ保存に失敗しました',
      savedCount,
      totalCount: csvData.length,
      errors: errors.length > 0 ? errors : undefined
    };
    
    console.log(result.message);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('CSV処理エラー:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'CSVアップロードに失敗しました',
        success: false 
      }, 
      { status: 500 }
    );
  }
}

/**
 * 店舗データの保存
 */
async function saveStoreData(storeData: ProcessedData, errors: string[]): Promise<number> {
  // 店舗データの型ガード
  if (storeData.dataType !== 'stores' || !storeData.data || typeof storeData.data !== 'object') {
    errors.push('無効な店舗データ形式');
    return 0;
  }

  const data = storeData.data as { stores: any[]; store_details: any[] };
  
  if (!data.stores || !Array.isArray(data.stores) || data.stores.length === 0) {
    errors.push('店舗基本情報が見つかりません');
    return 0;
  }

  try {
    console.log('店舗データ保存開始: 基本情報' + data.stores.length + '件、詳細情報' + (data.store_details?.length || 0) + '件');
    
    // 最初の店舗の基本情報を保存
    const storeInfo = data.stores[0];
    const { error: storeError } = await supabaseClient
      .from('stores')
      .upsert(storeInfo, { onConflict: 'store_id' });
    
    if (storeError) {
      throw new Error(`店舗基本情報保存エラー: ${storeError.message}`);
    }
    
    console.log('店舗作成完了: ' + storeInfo.store_name + ' (' + storeInfo.store_id + ')');
    
    // 店舗詳細情報を処理
    if (data.store_details && Array.isArray(data.store_details) && data.store_details.length > 0) {
      console.log('店舗詳細データ処理開始: ' + data.store_details.length + '件');
      
      // 有効なデータのみフィルタリング
      const validDetails = data.store_details.filter(detail => 
        detail.element && detail.information && detail.information.trim() !== ''
      );
      
      console.log('有効な店舗詳細データ: ' + validDetails.length + '件');
      
      if (validDetails.length > 0) {
        // バッチでupsert
        const BATCH_SIZE = 100;
        for (let i = 0; i < validDetails.length; i += BATCH_SIZE) {
          const batch = validDetails.slice(i, i + BATCH_SIZE);
          const batchEnd = Math.min(i + BATCH_SIZE - 1, validDetails.length - 1);
          
          const { error: detailError } = await supabaseClient
            .from('store_details')
            .upsert(batch, { onConflict: 'store_id,element' });
          
          if (detailError) {
            throw new Error(`店舗詳細バッチupsertエラー (${i}-${batchEnd}): ${detailError.message}`);
          }
          
          console.log(`店舗詳細バッチupsert完了: ${i}-${batchEnd} (${batch.length}件)`);
        }
        
        console.log('店舗詳細データupsert完了: ' + validDetails.length + '件処理');
      }
    }
    
    return 1;
  } catch (error) {
    console.error('店舗データ保存エラー:', error);
    if (error instanceof Error) {
      errors.push(error.message);
    }
    return 0;
  }
}

/**
 * GET: API状態確認
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ 
    message: 'CSV アップロード API',
    methods: ['POST'],
    version: '1.0.0'
  });
}

/**
 * データ統計を取得
 */
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
} 
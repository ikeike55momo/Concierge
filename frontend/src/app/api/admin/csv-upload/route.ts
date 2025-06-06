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

interface StoreRow {
  store_id: string;
  number: string;
  element: string;
  要素名: string;
  情報: string;
  大項目?: string;
  重要度?: string;
}

interface EventRow {
  event_id: string;
  number: string;
  element: string;
  要素名: string;
  情報: string;
  重要度?: string;
}

interface MachineRow {
  machine_id: string;
  number: string;
  element: string;
  要素名: string;
  情報: string;
  大項目?: string;
}

/**
 * CSV タイプ判定
 */
function determineCsvType(filename: string): string {
  if (filename.startsWith('store_production_info_')) return 'store_production_info';
  if (filename.startsWith('store_')) return 'store';
  if (filename.startsWith('machines_info')) return 'machines';
  if (filename.startsWith('event_')) return 'event';
  return 'unknown';
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

  // CSV データから店舗情報を抽出（新フォーマット対応）
      csvData.forEach(row => {
      if (!row['情報']) return; // 空の情報はスキップ
      
      switch (row['element']) {
              case 'official_store_name_image':
        case 'official_store_name2':
          storeData.store_name = row['情報'];
          break;
        case 'prefecture':
          storeData.prefecture = row['情報'];
          break;
        case 'nearest_station':
          storeData.nearest_station = row['情報'];
          break;
        case 'station_access':
          // "JR秋葉原駅電気街口から徒歩3分" から数値を抽出
          const walkMatch = row['情報'].match(/徒歩(\d+)分/);
          if (walkMatch) {
            storeData.distance_from_station = parseInt(walkMatch[1]);
          }
          break;
        case 'business_hours':
          storeData.opening_hours = row['情報'];
          break;
        case 'total_machines':
          storeData.total_machines = parseInt(row['情報'].replace(/[^\d]/g, '')) || 0;
          break;
        case 'parking_info':
          storeData.parking_available = row['情報'].includes('あり') || row['情報'].includes('提携');
          break;
        case 'smoking_policy':
          storeData.smoking_allowed = !row['情報'].includes('禁煙');
          break;
        case 'event_frequency':
          const eventMatch = row['情報'].match(/週(\d+)/);
          if (eventMatch) {
            storeData.event_frequency = parseInt(eventMatch[1]);
          }
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
 * 機種マスタ CSV → Supabase 変換（新フォーマット対応）
 */
async function syncMachineData(csvData: CsvRow[]) {
  const machines: any[] = [];
  const machineDetails: any[] = [];
  const machineMap = new Map();

  // machine_id でグループ化
  csvData.forEach(row => {
    const machineId = row['machine_id'];
    const element = row['element'];
    const elementName = row['要素名'];
    const info = row['情報'];
    const category = row['大項目'];
    const number = parseInt(row['number']) || 0;

    if (machineId) {
      // 基本機種情報の準備
      if (!machineMap.has(machineId)) {
        machineMap.set(machineId, {
          machine_id: machineId,
          machine_name: '',
          manufacturer: '',
          machine_type: 'スロット',
          rtp_percentage: 97.0,
          popularity_score: 0,
          release_date: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      const machine = machineMap.get(machineId);
      
      // 重要な要素は基本テーブルにも保存
      switch (element) {
        case 'machine_name_jp':
          machine.machine_name = info || `機種${machineId}`;
          break;
        case 'maker_name':
          machine.manufacturer = info || '不明';
          break;
        case 'play_type':
          machine.machine_type = info || 'スロット';
          break;
        case 'payout_set_1':
          machine.rtp_percentage = parseFloat(info) || 97.0;
          break;
        case 'install_rate_nationwide':
          machine.popularity_score = parseInt(info) || 0;
          break;
        case 'market_in_date':
          machine.release_date = info && info !== '' ? info : null;
          break;
      }

      // 全ての要素を詳細テーブル用データとして保存
      machineDetails.push({
        machine_id: machineId,
        number: number,
        element: element,
        element_name: elementName,
        value: info || '',
        category: category || '機種マスタ',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  });

  const machineArray = Array.from(machineMap.values());
  
  console.log(`機種マスタ処理開始: 基本情報${machineArray.length}件、詳細情報${machineDetails.length}件`);
  
  // 基本機種情報の保存
  if (machineArray.length > 0) {
    try {
      const { error } = await supabaseClient
        .from('machines')
        .upsert(machineArray, { onConflict: 'machine_id' });

      if (error) {
        console.error('機種基本情報保存エラー:', error);
        throw error;
      }
      
      console.log(`機種基本情報保存完了: ${machineArray.length}件`);
    } catch (error) {
      console.error('機種基本情報保存失敗:', error);
      throw error;
    }
  }

  // 機種詳細情報の保存
  if (machineDetails.length > 0) {
    try {
      const BATCH_SIZE = 100;
      let detailsSavedCount = 0;
      
      for (let i = 0; i < machineDetails.length; i += BATCH_SIZE) {
        const batch = machineDetails.slice(i, i + BATCH_SIZE);
        
        const { data: upsertData, error: upsertError } = await supabaseClient
          .from('machine_details')
          .upsert(batch, { 
            onConflict: 'machine_id,element',
            ignoreDuplicates: false 
          })
          .select();
          
        if (upsertError) {
          console.error(`機種詳細バッチupsertエラー (${i}-${i + batch.length}):`, upsertError);
          throw upsertError;
        } else {
          detailsSavedCount += upsertData?.length || batch.length;
          console.log(`機種詳細バッチupsert完了: ${i}-${i + batch.length} (${batch.length}件)`);
        }
      }
      
      console.log(`機種詳細データupsert完了: ${detailsSavedCount}件処理`);
      
    } catch (error) {
      console.error('機種詳細データupsertエラー:', error);
      throw error;
    }
  }

  // 機種データの場合、人気度スコアが未設定なら自動設定
  if (machineArray.length > 0) {
    for (const machine of machineArray) {
      if (machine.popularity_score === 0 || machine.popularity_score === null) {
        // 機種名に基づいて人気度を推定
        const popularityScore = estimateMachinePopularity(machine.machine_name);
        
        await supabaseClient
          .from('machines')
          .update({ popularity_score: popularityScore })
          .eq('machine_id', machine.machine_id);
          
        machine.popularity_score = popularityScore;
      }
    }
  }

  return machineArray;
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
 * 機種名から人気度を推定
 */
function estimateMachinePopularity(machineName: string): number {
  // 人気のキーワードに基づいてスコアを算出
  const popularKeywords = [
    { keyword: 'ゴッドイーター', score: 85 },
    { keyword: 'To LOVEる', score: 80 },
    { keyword: 'バイオハザード', score: 90 },
    { keyword: 'ディスクアップ', score: 75 },
    { keyword: 'スマスロ', score: 5 }, // スマスロボーナス
    { keyword: '政宗', score: 70 },
    { keyword: 'ガールズパンツァー', score: 75 },
    { keyword: 'エヴァンゲリオン', score: 85 }
  ];

  let baseScore = 50; // デフォルトスコア

  for (const { keyword, score } of popularKeywords) {
    if (machineName.includes(keyword)) {
      if (keyword === 'スマスロ') {
        baseScore += score; // スマスロはボーナス加算
      } else {
        baseScore = Math.max(baseScore, score); // より高いスコアを採用
      }
    }
  }

  return Math.min(baseScore, 95); // 最大95点
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
    const { csvData, dataType } = await request.json();

    if (!csvData) {
      return NextResponse.json({
        success: false,
        error: 'CSVデータが提供されていません'
      }, { status: 400 });
    }

    console.log('CSV一括アップロード開始...');

    // CSVデータを処理
    let processedResult: ProcessedData;
    
    if (dataType) {
      // 手動でデータタイプが指定された場合
      switch (dataType) {
        case 'stores':
          processedResult = processStoreCSV(csvData);
          break;
        case 'machines':
          processedResult = processMachineCSV(csvData);
          break;
        default:
          return NextResponse.json({
            success: false,
            error: `サポートされていないデータタイプ: ${dataType}`
          }, { status: 400 });
      }
    } else {
      // 自動判定
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map((h: string) => h.trim());
      const detectedType = detectDataType(headers);
      
      switch (detectedType) {
        case 'stores':
          processedResult = processStoreCSV(csvData);
          break;
        case 'machines':
          processedResult = processMachineCSV(csvData);
          break;
        default:
          return NextResponse.json({
            success: false,
            error: 'CSVデータの形式を自動判定できませんでした',
            details: `検出されたヘッダー: ${headers.join(', ')}`
          }, { status: 400 });
      }
    }

    if (processedResult.processedCount === 0) {
      return NextResponse.json({
        success: false,
        error: '有効なデータが処理されませんでした',
        details: processedResult.errors
      }, { status: 400 });
    }

    // データベースに保存
    let savedCount = 0;
    const saveErrors: string[] = [];
    
    if (processedResult.dataType === 'stores') {
      // 店舗データの保存
      savedCount = await saveStoreData(processedResult.data, saveErrors);
    } else if (processedResult.dataType === 'machines') {
      // 機種データの保存（縦型構造対応）
      try {
        // 機種CSVも縦型構造なので、syncMachineData関数を使用
        const lines = csvData.trim().split('\n');
        const csvRows = lines.slice(1).map((line: string) => {
          const values = line.split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''));
          const headers = lines[0].split(',').map((h: string) => h.trim());
          const row: any = {};
          headers.forEach((header: string, index: number) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        
        const machineArray = await syncMachineData(csvRows);
        savedCount = machineArray.length;
        console.log(`機種データ保存完了: ${savedCount}件`);
      } catch (error) {
        console.error('機種データ保存エラー:', error);
        saveErrors.push(`機種データ保存エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`CSV一括アップロード完了: ${savedCount}/${processedResult.processedCount}件保存`);

    return NextResponse.json({
      success: true,
      message: `${savedCount}件のデータを正常にアップロードしました`,
      details: {
        dataType: processedResult.dataType,
        processedCount: processedResult.processedCount,
        savedCount,
        errorCount: processedResult.errorCount + saveErrors.length,
        errors: [...processedResult.errors, ...saveErrors].slice(0, 10)
      }
    });

  } catch (error) {
    console.error('CSV一括アップロードエラー:', error);
    return NextResponse.json({
      success: false,
      error: 'CSV一括アップロードに失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 店舗データの保存
 */
async function saveStoreData(storeData: any, errors: string[]): Promise<number> {
  let savedCount = 0;
  
  // データ構造の確認
  const stores = Array.isArray(storeData) ? storeData : storeData.stores || [];
  const storeDetails = storeData.store_details || [];
  
  console.log(`店舗データ保存開始: 基本情報${stores.length}件、詳細情報${storeDetails.length}件`);
  
  // 基本店舗情報の保存
  for (const store of stores) {
    try {
      // 必須フィールドの確認
      if (!store.store_id || !store.store_name) {
        errors.push(`店舗${store.store_id || 'unknown'}: 必須フィールドが不足しています`);
        continue;
      }

      // 既存店舗の確認
      const { data: existingStore, error: selectError } = await supabaseClient
        .from('stores')
        .select('store_id')
        .eq('store_id', store.store_id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error(`店舗確認エラー (${store.store_id}):`, selectError);
        errors.push(`店舗${store.store_id}の確認に失敗: ${selectError.message}`);
        continue;
      }

      // データのクリーニング（undefinedを削除）
      const cleanStore = Object.fromEntries(
        Object.entries(store).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      if (existingStore) {
        // 更新
        const { error } = await supabaseClient
          .from('stores')
          .update({
            ...cleanStore,
            updated_at: new Date().toISOString()
          })
          .eq('store_id', store.store_id);

        if (error) {
          console.error(`店舗更新エラー (${store.store_id}):`, error);
          errors.push(`店舗${store.store_id}の更新に失敗: ${error.message}`);
        } else {
          savedCount++;
          console.log(`店舗更新完了: ${store.store_name} (${store.store_id})`);
        }
      } else {
        // 新規作成
        const { error } = await supabaseClient
          .from('stores')
          .insert([cleanStore]);

        if (error) {
          console.error(`店舗作成エラー (${store.store_id}):`, error);
          errors.push(`店舗${store.store_id}の作成に失敗: ${error.message}`);
        } else {
          savedCount++;
          console.log(`店舗作成完了: ${store.store_name} (${store.store_id})`);
        }
      }
    } catch (error) {
      console.error(`店舗処理エラー (${store.store_id}):`, error);
      errors.push(`店舗${store.store_id}の処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // 店舗詳細情報の保存（基本情報の保存が成功した場合のみ）
  if (storeDetails.length > 0 && savedCount > 0) {
    try {
      console.log(`店舗詳細データ処理開始: ${storeDetails.length}件`);
      
      // 保存された店舗IDのみを対象にフィルタ
      const savedStoreIds = stores
        .filter((_: any, index: number) => index < savedCount)
        .map((store: any) => store.store_id);
      
      const validStoreDetails = storeDetails.filter((detail: any) => 
        savedStoreIds.includes(detail.store_id)
      );
      
      console.log(`有効な店舗詳細データ: ${validStoreDetails.length}件`);
      
      // upsert処理で既存データは更新、新データは追加
      const BATCH_SIZE = 100;
      let detailsSavedCount = 0;
      
      for (let i = 0; i < validStoreDetails.length; i += BATCH_SIZE) {
        const batch = validStoreDetails.slice(i, i + BATCH_SIZE);
        
        // データのクリーニング
        const cleanBatch = batch.map((detail: any) => 
          Object.fromEntries(
            Object.entries(detail).filter(([_, value]) => value !== undefined && value !== null)
          )
        );
        
        const { data: upsertData, error: upsertError } = await supabaseClient
          .from('store_details')
          .upsert(cleanBatch, { 
            onConflict: 'store_id,element', // ユニーク制約に基づく
            ignoreDuplicates: false 
          })
          .select();
          
        if (upsertError) {
          console.error(`店舗詳細バッチupsertエラー (${i}-${i + batch.length}):`, upsertError);
          errors.push(`店舗詳細バッチ${i}-${i + batch.length}のupsertに失敗: ${upsertError.message}`);
        } else {
          detailsSavedCount += upsertData?.length || batch.length;
          console.log(`店舗詳細バッチupsert完了: ${i}-${i + batch.length} (${batch.length}件)`);
        }
      }
      
      console.log(`店舗詳細データupsert完了: ${detailsSavedCount}件処理`);
      
    } catch (error) {
      console.error('店舗詳細データupsertエラー:', error);
      errors.push(`店舗詳細データのupsertに失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else if (storeDetails.length > 0 && savedCount === 0) {
    errors.push('基本店舗情報の保存に失敗したため、店舗詳細データは保存されませんでした');
  }
  
  return savedCount;
}

/**
 * 機種データの保存（既存処理）
 */
async function saveMachineData(machines: any[], errors: string[]): Promise<number> {
  const BATCH_SIZE = 50;
  let savedCount = 0;
  
  for (let i = 0; i < machines.length; i += BATCH_SIZE) {
    const batch = machines.slice(i, i + BATCH_SIZE);
    
    try {
      const { data, error } = await supabaseClient
        .from('machines')
        .upsert(batch, { 
          onConflict: 'machine_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error(`機種バッチ保存エラー (${i}-${i + batch.length}):`, error);
        errors.push(`機種バッチ${i}-${i + batch.length}の保存に失敗: ${error.message}`);
      } else {
        savedCount += data?.length || 0;
        console.log(`機種バッチ保存完了: ${i}-${i + batch.length} (${data?.length || 0}件)`);
      }
    } catch (error) {
      console.error(`機種バッチ処理エラー (${i}-${i + batch.length}):`, error);
      errors.push(`機種バッチ${i}-${i + batch.length}の処理エラー`);
    }
  }
  
  return savedCount;
}

/**
 * GET: API状態確認
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'CSV Upload API is running',
    timestamp: new Date().toISOString(),
    environment: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV
    },
    supportedTypes: ['store', 'store_production_info', 'machines', 'event']
  });
}

/**
 * データ統計を取得
 */
export async function HEAD(request: NextRequest) {
  try {
    // 現在のデータベース統計を取得
    const [storesCount, machinesCount, eventsCount, performancesCount] = await Promise.all([
      supabaseClient.from('stores').select('*', { count: 'exact', head: true }),
      supabaseClient.from('machines').select('*', { count: 'exact', head: true }),
      supabaseClient.from('events').select('*', { count: 'exact', head: true }),
      supabaseClient.from('store_performances').select('*', { count: 'exact', head: true })
    ]);

    const stats = {
      stores: storesCount.count || 0,
      machines: machinesCount.count || 0,
      events: eventsCount.count || 0,
      performances: performancesCount.count || 0,
      lastUpdated: new Date().toISOString()
    };

    return new NextResponse(null, {
      headers: {
        'X-Data-Stats': JSON.stringify(stats),
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('統計取得エラー:', error);
    return new NextResponse(null, { status: 500 });
  }
} 
/**
 * CSV処理ライブラリ
 * 
 * CSVデータの読み込み・解析・変換機能
 * - 店舗情報CSV処理
 * - 機種情報CSV処理  
 * - イベント情報CSV処理
 * - 営業実績CSV処理
 */

import Papa from 'papaparse';

// 型定義
interface StoreInfoRow {
  store_id: string;
  store_name: string;
  prefecture: string;
  nearest_station: string;
  distance_from_station: number;
  opening_hours: string;
  total_machines: number;
  popular_machines: string;
  event_frequency: number;
  smoking_allowed: string;
  parking_available: string;
}

interface MachineInfoRow {
  machine_id: string;
  machine_name: string;
  manufacturer: string;
  machine_type: string;
  rtp_percentage: number;
  popularity_score: number;
  release_date: string;
}

interface EventInfoRow {
  event_id: string;
  event_name: string;
  event_date: string;
  target_stores: string;
  event_type: string;
  bonus_multiplier: number;
  description: string;
}

interface StoreProductionRow {
  store_id: string;
  date: string;
  production_data: string; // JSON文字列
}

interface ParsedStoreData {
  stores: StoreInfoRow[];
  machines: MachineInfoRow[];
  events: EventInfoRow[];
  performances: StoreProductionRow[];
}

interface CSVProcessingResult {
  success: boolean;
  data?: ParsedStoreData;
  errors?: string[];
  summary?: {
    storesCount: number;
    machinesCount: number;
    eventsCount: number;
    performancesCount: number;
  };
}

/**
 * CSV処理クラス
 */
export class CSVProcessor {
  
  /**
   * CSVファイルをパース
   */
  static async parseCSVFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV解析警告:', results.errors);
          }
          resolve(results.data as any[]);
        },
        error: (error) => {
          reject(new Error(`CSV解析エラー: ${error.message}`));
        }
      });
    });
  }

  /**
   * 複数CSVファイルを一括処理
   */
  static async processAllCSVFiles(files: {
    storeInfo?: File;
    machineInfo?: File;
    eventInfo?: File;
    storeProduction?: File;
  }): Promise<CSVProcessingResult> {
    try {
      const errors: string[] = [];
      const parsedData: Partial<ParsedStoreData> = {};

      // 店舗情報CSV処理
      if (files.storeInfo) {
        try {
          const storeData = await this.parseCSVFile(files.storeInfo);
          parsedData.stores = this.validateStoreData(storeData);
        } catch (error) {
          errors.push(`店舗情報CSV: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }

      // 機種情報CSV処理
      if (files.machineInfo) {
        try {
          const machineData = await this.parseCSVFile(files.machineInfo);
          parsedData.machines = this.validateMachineData(machineData);
        } catch (error) {
          errors.push(`機種情報CSV: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }

      // イベント情報CSV処理
      if (files.eventInfo) {
        try {
          const eventData = await this.parseCSVFile(files.eventInfo);
          parsedData.events = this.validateEventData(eventData);
        } catch (error) {
          errors.push(`イベント情報CSV: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }

      // 営業実績CSV処理
      if (files.storeProduction) {
        try {
          const productionData = await this.parseCSVFile(files.storeProduction);
          parsedData.performances = this.validateProductionData(productionData);
        } catch (error) {
          errors.push(`営業実績CSV: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }

      // 結果の組み立て
      const result: CSVProcessingResult = {
        success: errors.length === 0,
        data: parsedData as ParsedStoreData,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          storesCount: parsedData.stores?.length || 0,
          machinesCount: parsedData.machines?.length || 0,
          eventsCount: parsedData.events?.length || 0,
          performancesCount: parsedData.performances?.length || 0
        }
      };

      return result;

    } catch (error) {
      return {
        success: false,
        errors: [`CSV処理エラー: ${error instanceof Error ? error.message : '不明なエラー'}`]
      };
    }
  }

  /**
   * 店舗データバリデーション
   */
  private static validateStoreData(data: any[]): StoreInfoRow[] {
    return data.map((row, index) => {
      try {
        return {
          store_id: String(row.store_id || `store_${index + 1}`),
          store_name: String(row.store_name || ''),
          prefecture: String(row.prefecture || ''),
          nearest_station: String(row.nearest_station || ''),
          distance_from_station: Number(row.distance_from_station) || 0,
          opening_hours: String(row.opening_hours || '10:00-22:00'),
          total_machines: Number(row.total_machines) || 0,
          popular_machines: String(row.popular_machines || ''),
          event_frequency: Number(row.event_frequency) || 0,
          smoking_allowed: String(row.smoking_allowed || 'true'),
          parking_available: String(row.parking_available || 'false')
        };
      } catch (error) {
        throw new Error(`店舗データ行 ${index + 1}: バリデーションエラー`);
      }
    });
  }

  /**
   * 機種データバリデーション
   */
  private static validateMachineData(data: any[]): MachineInfoRow[] {
    return data.map((row, index) => {
      try {
        return {
          machine_id: String(row.machine_id || `machine_${index + 1}`),
          machine_name: String(row.machine_name || ''),
          manufacturer: String(row.manufacturer || ''),
          machine_type: String(row.machine_type || 'slot'),
          rtp_percentage: Number(row.rtp_percentage) || 95.0,
          popularity_score: Number(row.popularity_score) || 50,
          release_date: String(row.release_date || new Date().toISOString().split('T')[0])
        };
      } catch (error) {
        throw new Error(`機種データ行 ${index + 1}: バリデーションエラー`);
      }
    });
  }

  /**
   * イベントデータバリデーション
   */
  private static validateEventData(data: any[]): EventInfoRow[] {
    return data.map((row, index) => {
      try {
        return {
          event_id: String(row.event_id || `event_${index + 1}`),
          event_name: String(row.event_name || ''),
          event_date: String(row.event_date || ''),
          target_stores: String(row.target_stores || ''),
          event_type: String(row.event_type || 'general'),
          bonus_multiplier: Number(row.bonus_multiplier) || 1.0,
          description: String(row.description || '')
        };
      } catch (error) {
        throw new Error(`イベントデータ行 ${index + 1}: バリデーションエラー`);
      }
    });
  }

  /**
   * 営業実績データバリデーション
   */
  private static validateProductionData(data: any[]): StoreProductionRow[] {
    return data.map((row, index) => {
      try {
        return {
          store_id: String(row.store_id || ''),
          date: String(row.date || ''),
          production_data: String(row.production_data || '{}')
        };
      } catch (error) {
        throw new Error(`営業実績データ行 ${index + 1}: バリデーションエラー`);
      }
    });
  }

  /**
   * 営業実績JSONデータを解析
   */
  static parseProductionData(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('JSON解析エラー:', error);
      return {};
    }
  }

  /**
   * CSVデータをSupabase形式に変換
   */
  static convertToSupabaseFormat(data: ParsedStoreData) {
    const stores = data.stores?.map(store => ({
      store_id: store.store_id,
      store_name: store.store_name,
      prefecture: store.prefecture,
      nearest_station: store.nearest_station,
      distance_from_station: store.distance_from_station,
      opening_hours: store.opening_hours,
      total_machines: store.total_machines,
      popular_machines: store.popular_machines.split(',').map(m => m.trim()).filter(Boolean),
      event_frequency: store.event_frequency,
      smoking_allowed: store.smoking_allowed === 'true',
      parking_available: store.parking_available === 'true',
      is_active: true
    })) || [];

    const machines = data.machines?.map(machine => ({
      machine_id: machine.machine_id,
      machine_name: machine.machine_name,
      manufacturer: machine.manufacturer,
      machine_type: machine.machine_type,
      rtp_percentage: machine.rtp_percentage,
      popularity_score: machine.popularity_score,
      release_date: machine.release_date,
      is_active: true
    })) || [];

    const events = data.events?.map(event => ({
      event_id: event.event_id,
      event_name: event.event_name,
      event_date: event.event_date,
      target_stores: event.target_stores.split(',').map(s => s.trim()).filter(Boolean),
      event_type: event.event_type,
      bonus_multiplier: event.bonus_multiplier,
      description: event.description,
      is_active: true
    })) || [];

    const performances = data.performances?.map(perf => {
      const productionData = this.parseProductionData(perf.production_data);
      
      return {
        store_id: perf.store_id,
        date: perf.date,
        total_difference: productionData.total_difference || 0,
        average_difference: productionData.average_difference || 0,
        average_games: productionData.average_games || 0,
        total_visitors: productionData.total_visitors || 0,
        machine_performances: productionData.machine_performances || {},
        weather: productionData.weather || 'unknown',
        day_of_week: new Date(perf.date).getDay(),
        is_event_day: productionData.is_event_day || false
      };
    }) || [];

    return {
      stores,
      machines,
      events,
      performances
    };
  }

  /**
   * データ統計を生成
   */
  static generateDataStatistics(data: ParsedStoreData) {
    const stats = {
      stores: {
        total: data.stores?.length || 0,
        byPrefecture: {} as Record<string, number>,
        avgMachines: 0
      },
      machines: {
        total: data.machines?.length || 0,
        byManufacturer: {} as Record<string, number>,
        avgPopularity: 0
      },
      events: {
        total: data.events?.length || 0,
        byType: {} as Record<string, number>,
        avgBonus: 0
      },
      performances: {
        total: data.performances?.length || 0,
        dateRange: { start: '', end: '' },
        avgDifference: 0
      }
    };

    // 店舗統計
    if (data.stores) {
      data.stores.forEach(store => {
        stats.stores.byPrefecture[store.prefecture] = 
          (stats.stores.byPrefecture[store.prefecture] || 0) + 1;
        stats.stores.avgMachines += store.total_machines;
      });
      stats.stores.avgMachines = Math.round(stats.stores.avgMachines / data.stores.length);
    }

    // 機種統計
    if (data.machines) {
      data.machines.forEach(machine => {
        stats.machines.byManufacturer[machine.manufacturer] = 
          (stats.machines.byManufacturer[machine.manufacturer] || 0) + 1;
        stats.machines.avgPopularity += machine.popularity_score;
      });
      stats.machines.avgPopularity = Math.round(stats.machines.avgPopularity / data.machines.length);
    }

    // イベント統計
    if (data.events) {
      data.events.forEach(event => {
        stats.events.byType[event.event_type] = 
          (stats.events.byType[event.event_type] || 0) + 1;
        stats.events.avgBonus += event.bonus_multiplier;
      });
      stats.events.avgBonus = Number((stats.events.avgBonus / data.events.length).toFixed(2));
    }

    // 実績統計
    if (data.performances && data.performances.length > 0) {
      const dates = data.performances.map(p => p.date).sort();
      stats.performances.dateRange.start = dates[0];
      stats.performances.dateRange.end = dates[dates.length - 1];
      
      const totalDifference = data.performances.reduce((sum, perf) => {
        const productionData = this.parseProductionData(perf.production_data);
        return sum + (productionData.average_difference || 0);
      }, 0);
      stats.performances.avgDifference = Math.round(totalDifference / data.performances.length);
    }

    return stats;
  }
}

/**
 * CSV処理ユーティリティ関数
 */
export const csvUtils = {
  /**
   * ファイルサイズをフォーマット
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * CSVファイルかどうかチェック
   */
  isCSVFile(file: File): boolean {
    return file.type === 'text/csv' || 
           file.name.toLowerCase().endsWith('.csv');
  },

  /**
   * ファイル名からCSVタイプを推測
   */
  detectCSVType(filename: string): string {
    const name = filename.toLowerCase();
    if (name.includes('store') || name.includes('店舗')) return 'store_info';
    if (name.includes('machine') || name.includes('機種')) return 'machine_info';
    if (name.includes('event') || name.includes('イベント')) return 'event_info';
    if (name.includes('production') || name.includes('実績')) return 'store_production';
    return 'unknown';
  },

  /**
   * サンプルCSVデータを生成
   */
  generateSampleCSV(type: 'store' | 'machine' | 'event' | 'production'): string {
    switch (type) {
      case 'store':
        return `store_id,store_name,prefecture,nearest_station,distance_from_station,opening_hours,total_machines,popular_machines,event_frequency,smoking_allowed,parking_available
1,アイランド秋葉原店,東京都,JR秋葉原駅,50,10:00-22:00,384,北斗の拳,ジャグラー,12,true,false
2,JOYPIT神田店,東京都,JR神田駅,120,10:00-23:00,256,ゴッドイーター,バイオハザード,8,true,true`;

      case 'machine':
        return `machine_id,machine_name,manufacturer,machine_type,rtp_percentage,popularity_score,release_date
M001,北斗の拳 宿命,サミー,slot,97.8,85,2024-01-15
M002,ゴッドイーター3,山佐,slot,96.2,78,2024-02-20`;

      case 'event':
        return `event_id,event_name,event_date,target_stores,event_type,bonus_multiplier,description
E001,新台入替イベント,2025-06-06,1,2,3,new_machine,1.2,新台導入記念イベント
E002,月末大特価,2025-06-30,1,2,special_day,1.15,月末恒例の特価イベント`;

      case 'production':
        return `store_id,date,production_data
1,2025-06-04,"{""total_difference"":145000,""average_difference"":378,""average_games"":6234,""is_event_day"":false,""weather"":""晴れ""}"
1,2025-06-03,"{""total_difference"":132000,""average_difference"":344,""average_games"":5987,""is_event_day"":true,""weather"":""曇り""}"`;

      default:
        return '';
    }
  }
};

/**
 * 機種データの大量処理対応
 */
export async function processMachinesBatch(machineRecords: any[], batchSize = 50) {
  const results = [];
  
  // バッチ処理でデータベースへの負荷を軽減
  for (let i = 0; i < machineRecords.length; i += batchSize) {
    const batch = machineRecords.slice(i, i + batchSize);
    
    // 各バッチを並列処理
    const batchResults = await Promise.all(
      batch.map(async (record) => {
        // 機種名から人気度スコアを自動算出
        const popularityScore = estimateMachinePopularity(record.machine_name || '');
        
        return {
          ...record,
          popularity_score: popularityScore,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      })
    );
    
    results.push(...batchResults);
    
    // バッチ間で少し待機（API制限対応）
    if (i + batchSize < machineRecords.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * 機種名から人気度を推定（CSV処理用）
 */
function estimateMachinePopularity(machineName: string): number {
  const popularKeywords = [
    { keyword: 'ゴッドイーター', score: 85 },
    { keyword: 'To LOVEる', score: 80 },
    { keyword: 'バイオハザード', score: 90 },
    { keyword: 'ディスクアップ', score: 75 },
    { keyword: '政宗', score: 70 },
    { keyword: 'ガールズパンツァー', score: 75 },
    { keyword: 'エヴァンゲリオン', score: 85 },
    { keyword: '北斗', score: 85 },
    { keyword: 'まどマギ', score: 80 },
    { keyword: 'リゼロ', score: 75 },
    { keyword: 'スマスロ', score: 5 } // ボーナス加算
  ];

  let baseScore = 50;

  for (const { keyword, score } of popularKeywords) {
    if (machineName.includes(keyword)) {
      if (keyword === 'スマスロ') {
        baseScore += score;
      } else {
        baseScore = Math.max(baseScore, score);
      }
    }
  }

  return Math.min(baseScore, 95);
}

/**
 * CSV処理ユーティリティ
 * 
 * 機種データ、イベントデータ、店舗データのCSV処理を統合管理
 */

export interface ProcessedData {
  /** 処理されたデータ */
  data: any[] | { stores: any[]; store_details: any[] } | any;
  /** 処理されたレコード数 */
  processedCount: number;
  /** エラーレコード数 */
  errorCount: number;
  /** エラー詳細 */
  errors: string[];
  /** 処理したデータ種別 */
  dataType: 'machines' | 'events' | 'stores' | 'unknown';
}

/**
 * CSVデータの種別を自動判定
 */
export function detectDataType(headers: string[]): 'machines' | 'events' | 'stores' | 'unknown' {
  const headerStr = headers.join(',').toLowerCase();
  
  // 店舗データの判定
  if (headerStr.includes('store_id') && headerStr.includes('element') && headerStr.includes('要素名')) {
    return 'stores';
  }
  
  // 機種データの判定
  if (headerStr.includes('machine_id') || headerStr.includes('machine_name')) {
    return 'machines';
  }
  
  // イベントデータの判定
  if (headerStr.includes('event_id') || headerStr.includes('event_name')) {
    return 'events';
  }
  
  return 'unknown';
}

/**
 * 店舗CSV処理（store_001.csv形式）
 */
export function processStoreCSV(csvText: string): ProcessedData {
  try {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // ヘッダー検証
    const expectedHeaders = ['store_id', 'number', 'element', '要素名', '情報', '大項目', '重要度'];
    const hasValidHeaders = expectedHeaders.every(header => headers.includes(header));
    
    if (!hasValidHeaders) {
      return {
        data: [],
        processedCount: 0,
        errorCount: 1,
        errors: [`店舗CSVの形式が正しくありません。必要な列: ${expectedHeaders.join(', ')}`],
        dataType: 'stores'
      };
    }
    
    const storeDataMap = new Map<string, any>();
    const storeDetailsArray: any[] = [];
    const errors: string[] = [];
    let errorCount = 0;
    
    // 各行を処理
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length < expectedHeaders.length) {
          continue;
        }
        
        const [storeId, number, element, elementName, info, category, importance] = values;
        
        // 基本店舗情報の設定
        if (!storeDataMap.has(storeId)) {
          storeDataMap.set(storeId, {
            store_id: storeId,
            store_name: '',
            prefecture: '',
            city: '',
            address: '',
            full_address: '',
            postal_code: '',
            nearest_station: '',
            walk_minutes: 0,
            distance_from_station: 0,
            business_hours: '',
            opening_hours: '',
            phone_number: '',
            website_url: '',
            total_machines: 0,
            total_slots: 0,
            pachinko_machines: 0,
            pachislot_machines: 0,
            popular_machines: '',
            parking_spots: 0,
            parking_available: false,
            smoking_allowed: true,
            event_frequency: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        const storeData = storeDataMap.get(storeId);
        
        // 重要な要素は基本テーブルにも保存
        switch (element) {
          case 'official_store_name_image':
          case 'official_store_name2':
            storeData.store_name = info;
            break;
          case 'prefecture':
            storeData.prefecture = info;
            break;
          case 'city':
            storeData.city = info;
            break;
          case 'full_address':
            storeData.address = info.split(',')[0]; // 最初のアドレスを使用
            storeData.full_address = info;
            break;
          case 'nearest_station':
            storeData.nearest_station = info;
            break;
          case 'business_hours':
            storeData.business_hours = info;
            break;
          case 'total_machines':
            storeData.total_machines = parseInt(info.replace(/台|約|,/g, '')) || 0;
            break;
          case 'pachinko_machines':
            storeData.pachinko_machines = parseInt(info.replace(/台|約|,/g, '')) || 0;
            break;
          case 'pachislot_machines':
            storeData.pachislot_machines = parseInt(info.replace(/台|約|,/g, '')) || 0;
            break;
          case 'phone_number':
            storeData.phone_number = info;
            break;
          case 'website_url':
            storeData.website_url = info;
            break;
          case 'postal_code':
            storeData.postal_code = info;
            break;
          case 'parking_info':
            storeData.parking_available = info.includes('あり') || info.includes('有');
            break;
          case 'smoking_policy':
            storeData.smoking_allowed = !info.includes('禁煙');
            break;
          case 'event_frequency':
            storeData.event_frequency = info.includes('週') ? 
              parseInt(info.replace(/[^\d]/g, '')) * 4 : 
              parseInt(info.replace(/[^\d]/g, '')) || 0;
            break;
          case 'station_access':
            const walkMatch = info.match(/徒歩(\d+)分/);
            if (walkMatch) {
              storeData.walk_minutes = parseInt(walkMatch[1]);
            }
            break;
        }
        
        // 全ての要素を詳細テーブル用データとして保存
        storeDetailsArray.push({
          store_id: storeId,
          number: parseInt(number) || 0,
          element: element,
          element_name: elementName,
          value: info,
          category: category,
          importance: importance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      } catch (error) {
        errorCount++;
        errors.push(`行 ${i + 1}: ${error instanceof Error ? error.message : '処理エラー'}`);
      }
    }
    
    const processedStores = Array.from(storeDataMap.values()).filter(store => 
      store.store_name && store.prefecture
    );
    
    return {
      data: {
        stores: processedStores,
        store_details: storeDetailsArray
      },
      processedCount: processedStores.length,
      errorCount,
      errors: errors.slice(0, 10), // 最初の10個のエラーのみ
      dataType: 'stores'
    };
    
  } catch (error) {
    return {
      data: [],
      processedCount: 0,
      errorCount: 1,
      errors: [`CSV処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`],
      dataType: 'stores'
    };
  }
}

/**
 * 機種CSV処理
 */
export function processMachineCSV(csvText: string): ProcessedData {
  // 既存の機種CSV処理ロジック
  try {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const machines: any[] = [];
    const errors: string[] = [];
    let errorCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length >= headers.length) {
          const machineData: any = {};
          headers.forEach((header, index) => {
            machineData[header] = values[index] || '';
          });
          
          // 人気度スコアの自動設定
          if (machineData.machine_name) {
            machineData.popularity_score = estimateMachinePopularity(machineData.machine_name);
          }
          
          machines.push(machineData);
        }
      } catch (error) {
        errorCount++;
        errors.push(`行 ${i + 1}: ${error instanceof Error ? error.message : '処理エラー'}`);
      }
    }
    
    return {
      data: machines,
      processedCount: machines.length,
      errorCount,
      errors: errors.slice(0, 10),
      dataType: 'machines'
    };
    
  } catch (error) {
    return {
      data: [],
      processedCount: 0,
      errorCount: 1,
      errors: [`CSV処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`],
      dataType: 'machines'
    };
  }
} 
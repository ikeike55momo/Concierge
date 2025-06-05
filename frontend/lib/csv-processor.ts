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
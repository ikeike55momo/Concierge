/**
 * スコア算出ロジック
 * 
 * 店舗パフォーマンススコアの計算機能
 * - 基本スコア算出
 * - イベントボーナス計算
 * - 機種人気度調整
 * - アクセススコア計算
 * - 総合スコア生成
 */

interface PerformanceMetrics {
  /** 総差枚数 */
  totalDifference: number;
  /** 平均差枚数 */
  averageDifference: number;
  /** 平均ゲーム数 */
  averageGames: number;
  /** 来店者数 */
  totalVisitors: number;
  /** 稼働率 */
  utilizationRate: number;
  /** 機種別実績 */
  machinePerformances: Record<string, number>;
}

interface StoreFactors {
  /** 店舗ID */
  storeId: string;
  /** 店舗名 */
  storeName: string;
  /** 都道府県 */
  prefecture: string;
  /** 最寄駅からの距離 */
  distanceFromStation: number;
  /** 総台数 */
  totalMachines: number;
  /** 人気機種リスト */
  popularMachines: string[];
  /** イベント頻度 */
  eventFrequency: number;
  /** 喫煙可否 */
  smokingAllowed: boolean;
  /** 駐車場有無 */
  parkingAvailable: boolean;
}

interface EventBonus {
  /** イベント日フラグ */
  isEventDay: boolean;
  /** イベント種別 */
  eventType: string;
  /** ボーナス倍率 */
  bonusMultiplier: number;
  /** イベント名 */
  eventName: string;
}

interface WeatherFactor {
  /** 天候 */
  weather: string;
  /** 曜日 */
  dayOfWeek: number;
  /** 祝日フラグ */
  isHoliday: boolean;
}

interface ScoreComponents {
  /** 基本スコア (0-60) */
  baseScore: number;
  /** イベントボーナス (0-20) */
  eventBonus: number;
  /** 機種人気度 (0-10) */
  machinePopularity: number;
  /** アクセススコア (0-10) */
  accessScore: number;
  /** 個人調整 (-5 to +5) */
  personalAdjustment: number;
  /** 総合スコア (0-100) */
  totalScore: number;
}

interface CalculationResult {
  /** スコア要素 */
  scoreComponents: ScoreComponents;
  /** 勝率予測 */
  predictedWinRate: number;
  /** 信頼度 */
  confidence: number;
  /** 算出根拠 */
  rationale: string[];
  /** 推奨度 */
  recommendation: 'highly_recommended' | 'recommended' | 'neutral' | 'not_recommended';
}

/**
 * スコア計算クラス
 */
export class StoreScoreCalculator {
  
  /**
   * 総合スコアを計算
   */
  static calculateTotalScore(
    performanceMetrics: PerformanceMetrics,
    storeFactors: StoreFactors,
    eventBonus: EventBonus,
    weatherFactor: WeatherFactor,
    historicalData?: PerformanceMetrics[]
  ): CalculationResult {
    
    // 基本スコア算出
    const baseScore = this.calculateBaseScore(performanceMetrics, historicalData);
    
    // イベントボーナス算出
    const eventBonusScore = this.calculateEventBonus(eventBonus, storeFactors);
    
    // 機種人気度スコア算出
    const machinePopularityScore = this.calculateMachinePopularityScore(
      performanceMetrics.machinePerformances,
      storeFactors.popularMachines
    );
    
    // アクセススコア算出
    const accessScore = this.calculateAccessScore(storeFactors);
    
    // 天候・曜日調整
    const weatherAdjustment = this.calculateWeatherAdjustment(weatherFactor);
    
    // 個人調整スコア（後で設定可能）
    const personalAdjustment = 0;
    
    // 総合スコア計算
    const totalScore = Math.max(0, Math.min(100, Math.round(
      baseScore + 
      eventBonusScore + 
      machinePopularityScore + 
      accessScore + 
      weatherAdjustment + 
      personalAdjustment
    )));
    
    // スコア要素
    const scoreComponents: ScoreComponents = {
      baseScore: Math.round(baseScore),
      eventBonus: Math.round(eventBonusScore),
      machinePopularity: Math.round(machinePopularityScore),
      accessScore: Math.round(accessScore),
      personalAdjustment: Math.round(personalAdjustment),
      totalScore
    };
    
    // 勝率予測
    const predictedWinRate = this.calculateWinRate(totalScore, performanceMetrics);
    
    // 信頼度算出
    const confidence = this.calculateConfidence(historicalData, performanceMetrics);
    
    // 算出根拠
    const rationale = this.generateRationale(scoreComponents, eventBonus, weatherFactor);
    
    // 推奨度
    const recommendation = this.determineRecommendation(totalScore, confidence);
    
    return {
      scoreComponents,
      predictedWinRate,
      confidence,
      rationale,
      recommendation
    };
  }

  /**
   * 基本スコア算出 (0-60点)
   */
  private static calculateBaseScore(
    current: PerformanceMetrics, 
    historical?: PerformanceMetrics[]
  ): number {
    let score = 30; // ベーススコア
    
    // 平均差枚数による評価 (±20点)
    const avgDiffScore = Math.max(-20, Math.min(20, current.averageDifference / 10));
    score += avgDiffScore;
    
    // 稼働率による評価 (±10点)
    const utilizationScore = Math.max(-10, Math.min(10, (current.utilizationRate - 70) / 3));
    score += utilizationScore;
    
    // 来店者数による評価 (±10点)
    if (current.totalVisitors > 0) {
      const visitorScore = Math.max(-10, Math.min(10, (current.totalVisitors - 200) / 20));
      score += visitorScore;
    }
    
    // 過去データとの比較 (±10点)
    if (historical && historical.length > 0) {
      const avgHistorical = historical.reduce((sum, h) => sum + h.averageDifference, 0) / historical.length;
      const trendScore = Math.max(-10, Math.min(10, (current.averageDifference - avgHistorical) / 5));
      score += trendScore;
    }
    
    return Math.max(0, Math.min(60, score));
  }

  /**
   * イベントボーナス算出 (0-20点)
   */
  private static calculateEventBonus(eventBonus: EventBonus, storeFactors: StoreFactors): number {
    if (!eventBonus.isEventDay) {
      return 0;
    }
    
    let bonus = 10; // 基本イベントボーナス
    
    // イベント種別による調整
    switch (eventBonus.eventType) {
      case 'new_machine':
        bonus += 5; // 新台イベント
        break;
      case 'special_day':
        bonus += 3; // 特別日
        break;
      case 'campaign':
        bonus += 2; // キャンペーン
        break;
      default:
        break;
    }
    
    // ボーナス倍率適用
    bonus *= eventBonus.bonusMultiplier;
    
    // 店舗のイベント頻度による調整
    const frequencyAdjustment = Math.max(0.8, Math.min(1.2, storeFactors.eventFrequency / 10));
    bonus *= frequencyAdjustment;
    
    return Math.max(0, Math.min(20, bonus));
  }

  /**
   * 機種人気度スコア算出 (0-10点)
   */
  private static calculateMachinePopularityScore(
    machinePerformances: Record<string, number>,
    popularMachines: string[]
  ): number {
    if (popularMachines.length === 0) {
      return 5; // デフォルト値
    }
    
    let totalScore = 0;
    let machineCount = 0;
    
    popularMachines.forEach(machineName => {
      const performance = machinePerformances[machineName];
      if (performance !== undefined) {
        // 機種ごとの実績を評価
        const machineScore = Math.max(0, Math.min(10, performance / 100));
        totalScore += machineScore;
        machineCount++;
      }
    });
    
    if (machineCount === 0) {
      return 5;
    }
    
    return totalScore / machineCount;
  }

  /**
   * アクセススコア算出 (0-10点)
   */
  private static calculateAccessScore(storeFactors: StoreFactors): number {
    let score = 5; // ベーススコア
    
    // 駅からの距離による評価 (±3点)
    const distanceScore = Math.max(-3, Math.min(3, (200 - storeFactors.distanceFromStation) / 50));
    score += distanceScore;
    
    // 駐車場の有無 (+1点)
    if (storeFactors.parkingAvailable) {
      score += 1;
    }
    
    // 喫煙可否 (+1点)
    if (storeFactors.smokingAllowed) {
      score += 1;
    }
    
    return Math.max(0, Math.min(10, score));
  }

  /**
   * 天候・曜日調整 (-5 to +5点)
   */
  private static calculateWeatherAdjustment(weatherFactor: WeatherFactor): number {
    let adjustment = 0;
    
    // 天候による調整
    switch (weatherFactor.weather.toLowerCase()) {
      case '晴れ':
      case 'sunny':
        adjustment += 1;
        break;
      case '雨':
      case 'rainy':
        adjustment += 2; // 雨の日は来店者増加傾向
        break;
      case '雪':
      case 'snow':
        adjustment -= 1;
        break;
      default:
        break;
    }
    
    // 曜日による調整
    if (weatherFactor.dayOfWeek === 0 || weatherFactor.dayOfWeek === 6) {
      adjustment += 1; // 土日
    }
    
    // 祝日調整
    if (weatherFactor.isHoliday) {
      adjustment += 2;
    }
    
    return Math.max(-5, Math.min(5, adjustment));
  }

  /**
   * 勝率予測
   */
  private static calculateWinRate(totalScore: number, performanceMetrics: PerformanceMetrics): number {
    // 基本勝率計算
    let winRate = 30 + (totalScore * 0.6); // 30-90%の範囲
    
    // 平均差枚数による調整
    if (performanceMetrics.averageDifference > 0) {
      winRate += Math.min(10, performanceMetrics.averageDifference / 20);
    }
    
    return Math.max(25, Math.min(90, Math.round(winRate)));
  }

  /**
   * 信頼度算出
   */
  private static calculateConfidence(
    historicalData?: PerformanceMetrics[], 
    current?: PerformanceMetrics
  ): number {
    let confidence = 70; // ベース信頼度
    
    // 過去データの豊富さによる調整
    if (historicalData && historicalData.length > 0) {
      confidence += Math.min(20, historicalData.length * 2);
      
      // データの一貫性チェック
      const performances = historicalData.map(h => h.averageDifference);
      const variance = this.calculateVariance(performances);
      
      if (variance < 50) {
        confidence += 5; // 安定した実績
      } else if (variance > 200) {
        confidence -= 10; // 不安定な実績
      }
    }
    
    return Math.max(50, Math.min(95, confidence));
  }

  /**
   * 算出根拠生成
   */
  private static generateRationale(
    components: ScoreComponents,
    eventBonus: EventBonus,
    weatherFactor: WeatherFactor
  ): string[] {
    const rationale: string[] = [];
    
    // 基本スコア根拠
    if (components.baseScore >= 50) {
      rationale.push('過去の実績データから高い期待値を算出');
    } else if (components.baseScore <= 30) {
      rationale.push('実績データから慎重な評価が必要');
    } else {
      rationale.push('標準的な実績レベルで安定した期待値');
    }
    
    // イベントボーナス根拠
    if (eventBonus.isEventDay && components.eventBonus > 0) {
      rationale.push(`${eventBonus.eventName}でボーナス期待値追加`);
    }
    
    // アクセス根拠
    if (components.accessScore >= 8) {
      rationale.push('アクセス良好で通いやすい立地');
    }
    
    // 天候根拠
    if (weatherFactor.weather === '雨') {
      rationale.push('雨天時の来店増加パターンを考慮');
    }
    
    return rationale;
  }

  /**
   * 推奨度決定
   */
  private static determineRecommendation(totalScore: number, confidence: number): 
    'highly_recommended' | 'recommended' | 'neutral' | 'not_recommended' {
    
    if (totalScore >= 80 && confidence >= 80) {
      return 'highly_recommended';
    } else if (totalScore >= 65 && confidence >= 70) {
      return 'recommended';
    } else if (totalScore >= 45) {
      return 'neutral';
    } else {
      return 'not_recommended';
    }
  }

  /**
   * 分散計算
   */
  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    
    return variance;
  }
}

/**
 * スコア算出ヘルパー関数
 */
export const scoreUtils = {
  /**
   * スコアをランクに変換
   */
  scoreToRank(score: number): string {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'E';
  },

  /**
   * 推奨度をラベルに変換
   */
  recommendationToLabel(recommendation: string): string {
    switch (recommendation) {
      case 'highly_recommended': return '強く推奨';
      case 'recommended': return '推奨';
      case 'neutral': return '普通';
      case 'not_recommended': return '非推奨';
      default: return '不明';
    }
  },

  /**
   * スコア範囲チェック
   */
  validateScore(score: number): boolean {
    return score >= 0 && score <= 100;
  },

  /**
   * サンプルパフォーマンスデータ生成
   */
  generateSamplePerformanceMetrics(storeId: string): PerformanceMetrics {
    const baseScore = parseInt(storeId) * 15 + 40; // storeIdベースの基本値
    
    return {
      totalDifference: baseScore * 300 + Math.random() * 50000,
      averageDifference: baseScore * 0.8 + Math.random() * 200 - 100,
      averageGames: 5000 + Math.random() * 2000,
      totalVisitors: 150 + Math.random() * 200,
      utilizationRate: 60 + Math.random() * 30,
      machinePerformances: {
        '北斗の拳': baseScore + Math.random() * 200 - 100,
        'ジャグラー': baseScore * 0.8 + Math.random() * 150 - 75,
        'ゴッドイーター': baseScore * 1.2 + Math.random() * 250 - 125
      }
    };
  },

  /**
   * サンプル店舗要素生成
   */
  generateSampleStoreFactors(storeId: string, storeName: string): StoreFactors {
    return {
      storeId,
      storeName,
      prefecture: '東京都',
      distanceFromStation: 50 + Math.random() * 150,
      totalMachines: 200 + Math.random() * 300,
      popularMachines: ['北斗の拳', 'ジャグラー', 'ゴッドイーター'],
      eventFrequency: 8 + Math.random() * 8,
      smokingAllowed: Math.random() > 0.3,
      parkingAvailable: Math.random() > 0.6
    };
  }
}; 
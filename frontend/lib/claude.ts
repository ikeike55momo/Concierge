/**
 * Claude API Client
 * 
 * Claude APIとの統合機能
 * - 店舗分析コメント生成
 * - おすすめ機種分析
 * - 立ち回り戦略提案
 */

interface StorePerformanceData {
  /** 店舗ID */
  storeId: string;
  /** 店舗名 */
  storeName: string;
  /** 過去のパフォーマンスデータ */
  recentPerformances: {
    date: string;
    totalDifference: number;
    averageDifference: number;
    averageGames: number;
    isEventDay: boolean;
    weather?: string;
    dayOfWeek: number;
  }[];
  /** 機種情報 */
  availableMachines: {
    machineId: string;
    machineName: string;
    manufacturer: string;
    popularityScore: number;
    rtpPercentage: number;
  }[];
  /** イベント情報 */
  upcomingEvents: {
    eventDate: string;
    eventName: string;
    eventType: string;
    bonusMultiplier: number;
  }[];
  /** 店舗基本情報 */
  storeInfo: {
    prefecture: string;
    nearestStation: string;
    totalMachines: number;
    smokingAllowed: boolean;
    parkingAvailable: boolean;
  };
}

interface AnalysisRequest {
  /** 分析対象店舗データ */
  storeData: StorePerformanceData;
  /** 分析日 */
  analysisDate: string;
  /** 分析タイプ */
  analysisType: 'daily' | 'weekly' | 'event';
}

interface AnalysisResponse {
  /** 総合スコア */
  totalScore: number;
  /** 勝率予測 */
  predictedWinRate: number;
  /** 信頼度 */
  confidence: number;
  /** LLMコメント */
  comment: string;
  /** おすすめ機種 */
  recommendedMachines: {
    machineId: string;
    machineName: string;
    unitNumber: string;
    expectedDifference: number;
    reason: string;
  }[];
  /** 立ち回り戦略 */
  playStrategy: {
    recommendedEntryTime: string;
    targetMachines: string[];
    avoidMachines: string[];
    strategy: string;
    warnings: string[];
  };
  /** 分析根拠 */
  analysisRationale: {
    baseScore: number;
    eventBonus: number;
    machinePopularity: number;
    accessScore: number;
    personalAdjustment: number;
  };
}

/**
 * Claude APIクライアント
 */
export class ClaudeAnalysisClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.anthropic.com/v1';
  private readonly model: string;

  constructor(apiKey?: string, model = 'claude-3-haiku-20240307') {
    this.apiKey = apiKey || process.env.CLAUDE_API_KEY || '';
    this.model = model;

    if (!this.apiKey) {
      throw new Error('Claude API キーが設定されていません');
    }
  }

  /**
   * 店舗分析を実行
   */
  async analyzeStore(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const prompt = this.buildAnalysisPrompt(request);
      
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Claude API Error: ${response.status} ${response.statusText} ${errorData?.error?.message || ''}`);
      }

      const data = await response.json();
      const analysisText = data.content[0]?.text || '';
      
      return this.parseAnalysisResponse(analysisText, request);

    } catch (error) {
      console.error('Claude API分析エラー:', error);
      
      // フォールバック分析を返す
      return this.generateFallbackAnalysis(request);
    }
  }

  /**
   * 分析プロンプトを構築
   */
  private buildAnalysisPrompt(request: AnalysisRequest): string {
    const { storeData, analysisDate, analysisType } = request;
    
    return `
# パチスロ店舗分析タスク

あなたはパチスロ業界のエキスパートアナリストです。以下の店舗データを分析し、明日の勝率予測と具体的な立ち回り提案を行ってください。

## 店舗情報
- 店舗名: ${storeData.storeName}
- 所在地: ${storeData.storeInfo.prefecture}
- 最寄駅: ${storeData.storeInfo.nearestStation}
- 総台数: ${storeData.storeInfo.totalMachines}台
- 喫煙: ${storeData.storeInfo.smokingAllowed ? '可' : '不可'}
- 駐車場: ${storeData.storeInfo.parkingAvailable ? 'あり' : 'なし'}

## 過去7日間の実績データ
${storeData.recentPerformances.map(perf => `
- ${perf.date} (${this.getDayOfWeekName(perf.dayOfWeek)}): 
  総差枚 ${perf.totalDifference.toLocaleString()}枚, 
  平均差枚 ${perf.averageDifference}枚, 
  平均G数 ${perf.averageGames}G
  ${perf.isEventDay ? '[イベント日]' : ''}
  ${perf.weather ? `天候: ${perf.weather}` : ''}
`).join('')}

## 利用可能機種
${storeData.availableMachines.map(machine => `
- ${machine.machineName} (${machine.manufacturer})
  人気度: ${machine.popularityScore}/100, RTP: ${machine.rtpPercentage}%
`).join('')}

## 今後のイベント
${storeData.upcomingEvents.length > 0 ? 
  storeData.upcomingEvents.map(event => `
- ${event.eventDate}: ${event.eventName}
  種類: ${event.eventType}, ボーナス倍率: ${event.bonusMultiplier}x
`).join('') : '予定されているイベントはありません'}

## 分析要求
- 分析日: ${analysisDate}
- 分析タイプ: ${analysisType}

## 出力形式
以下のJSON形式で回答してください：

\`\`\`json
{
  "totalScore": [0-100の総合スコア],
  "predictedWinRate": [勝率予測パーセンテージ],
  "confidence": [予測信頼度パーセンテージ],
  "comment": "[魅力的で具体的なコメント（50文字以内）]",
  "recommendedMachines": [
    {
      "machineId": "[機種ID]",
      "machineName": "[機種名]", 
      "unitNumber": "[推奨台番号]",
      "expectedDifference": [期待差枚数],
      "reason": "[推奨理由]"
    }
  ],
  "playStrategy": {
    "recommendedEntryTime": "[推奨入店時間]",
    "targetMachines": ["[狙い目機種・台番]"],
    "avoidMachines": ["[避けるべき機種・台番]"],
    "strategy": "[具体的な立ち回り戦略]",
    "warnings": ["[注意事項リスト]"]
  },
  "analysisRationale": {
    "baseScore": [ベーススコア],
    "eventBonus": [イベントボーナス],
    "machinePopularity": [機種人気度],
    "accessScore": [アクセススコア],
    "personalAdjustment": [個人調整]
  }
}
\`\`\`

## 分析のポイント
1. 過去の実績トレンドを重視
2. イベント日の影響を考慮
3. 機種の特性と人気度を分析
4. 曜日・天候パターンを考慮
5. 現実的で実践的なアドバイス
6. リスク要因の明示
`;
  }

  /**
   * Claude APIレスポンスを解析
   */
  private parseAnalysisResponse(analysisText: string, request: AnalysisRequest): AnalysisResponse {
    try {
      // JSONブロックを抽出
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('JSONブロックが見つかりません');
      }

      const jsonData = JSON.parse(jsonMatch[1]);
      
      // バリデーション
      if (!this.validateAnalysisResponse(jsonData)) {
        throw new Error('レスポンス形式が不正です');
      }

      return jsonData as AnalysisResponse;

    } catch (error) {
      console.error('Claude レスポンス解析エラー:', error);
      console.log('Raw response:', analysisText);
      
      // フォールバック分析を返す
      return this.generateFallbackAnalysis(request);
    }
  }

  /**
   * レスポンス形式をバリデーション
   */
  private validateAnalysisResponse(data: any): boolean {
    return (
      typeof data.totalScore === 'number' &&
      typeof data.predictedWinRate === 'number' &&
      typeof data.confidence === 'number' &&
      typeof data.comment === 'string' &&
      Array.isArray(data.recommendedMachines) &&
      typeof data.playStrategy === 'object' &&
      typeof data.analysisRationale === 'object'
    );
  }

  /**
   * フォールバック分析を生成
   */
  private generateFallbackAnalysis(request: AnalysisRequest): AnalysisResponse {
    const { storeData } = request;
    
    // 簡易スコア計算
    const avgDifference = storeData.recentPerformances.reduce((sum, perf) => 
      sum + perf.averageDifference, 0) / storeData.recentPerformances.length;
    
    const baseScore = Math.max(30, Math.min(90, 50 + avgDifference * 0.1));
    const hasUpcomingEvent = storeData.upcomingEvents.length > 0;
    const eventBonus = hasUpcomingEvent ? 10 : 0;
    
    const totalScore = Math.round(baseScore + eventBonus);
    const predictedWinRate = Math.max(30, Math.min(85, totalScore * 0.8));
    
    return {
      totalScore,
      predictedWinRate,
      confidence: 75,
      comment: hasUpcomingEvent ? 'イベント日で期待値UP！' : '安定した実績の優良店',
      recommendedMachines: [
        {
          machineId: 'M001',
          machineName: '北斗の拳 宿命',
          unitNumber: '101-105',
          expectedDifference: 1200,
          reason: '過去実績から高設定期待'
        }
      ],
      playStrategy: {
        recommendedEntryTime: '10:30-11:00',
        targetMachines: ['北斗シリーズ', 'ジャグラー系'],
        avoidMachines: ['低設定疑惑台'],
        strategy: '朝一の動向を見て台選択。昼過ぎまで様子見推奨。',
        warnings: ['予算管理を徹底', '深追い禁物']
      },
      analysisRationale: {
        baseScore: Math.round(baseScore),
        eventBonus: eventBonus,
        machinePopularity: 5,
        accessScore: 3,
        personalAdjustment: 0
      }
    };
  }

  /**
   * 曜日名を取得
   */
  private getDayOfWeekName(dayOfWeek: number): string {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[dayOfWeek] || '不明';
  }
}

/**
 * デフォルトのClaude分析クライアント
 */
export const claudeClient = new ClaudeAnalysisClient();

/**
 * 分析リクエストのヘルパー関数
 */
export const analysisHelpers = {
  /**
   * 店舗データから分析リクエストを構築
   */
  buildAnalysisRequest(
    storeData: StorePerformanceData, 
    analysisDate: string = new Date().toISOString().split('T')[0],
    analysisType: 'daily' | 'weekly' | 'event' = 'daily'
  ): AnalysisRequest {
    return {
      storeData,
      analysisDate,
      analysisType
    };
  },

  /**
   * サンプル店舗データを生成（テスト用）
   */
  generateSampleStoreData(storeId: string, storeName: string): StorePerformanceData {
    return {
      storeId,
      storeName,
      recentPerformances: [
        {
          date: '2025-06-04',
          totalDifference: 145000,
          averageDifference: 378,
          averageGames: 6234,
          isEventDay: false,
          weather: '晴れ',
          dayOfWeek: 3
        },
        {
          date: '2025-06-03',
          totalDifference: 132000,
          averageDifference: 344,
          averageGames: 5987,
          isEventDay: true,
          weather: '曇り',
          dayOfWeek: 2
        },
        {
          date: '2025-06-02',
          totalDifference: 167000,
          averageDifference: 435,
          averageGames: 6543,
          isEventDay: false,
          weather: '雨',
          dayOfWeek: 1
        }
      ],
      availableMachines: [
        {
          machineId: 'M001',
          machineName: '北斗の拳 宿命',
          manufacturer: 'サミー',
          popularityScore: 85,
          rtpPercentage: 97.8
        },
        {
          machineId: 'M002',
          machineName: 'ゴッドイーター3',
          manufacturer: '山佐',
          popularityScore: 78,
          rtpPercentage: 96.2
        }
      ],
      upcomingEvents: [
        {
          eventDate: '2025-06-06',
          eventName: '新台入替イベント',
          eventType: 'new_machine',
          bonusMultiplier: 1.2
        }
      ],
      storeInfo: {
        prefecture: '東京都',
        nearestStation: 'JR秋葉原駅',
        totalMachines: 384,
        smokingAllowed: true,
        parkingAvailable: false
      }
    };
  }
}; 
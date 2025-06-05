### 4.3 データ更新タイミング
- **店舗出玉情報**: 日次更新（バッチ処理）
- **店舗マスタ**: 変更時のみ
- **機種マスタ**: 新機種導入時に追記
- **イベントマスタ**: 開催予定決定時に該当日付に追記# パチスロ店舗情報システム データアーキテクチャ仕様書

## 1. システム概要

本システムは、全国のパチンコ・パチスロ店舗の出玉データを管理し、独自のスコアリングアルゴリズムによって「明日のおすすめホール」を提案するWebサービスです。データは個別のCSVファイルとして管理され、必要に応じて組み合わせて使用します。

## 2. データベース構造

### 2.1 基本設計思想
- **縦持ち構造の統一**: 全CSVファイルでelement（要素）単位の縦持ち構造を採用
- **日付の縦軸配置**: 1日〜31日を縦に並べ、複数月のデータをJSON形式で横持ち
- **1エンティティ = 1CSVファイル**の原則（ただし機種マスタは全機種を1ファイルに集約）
- 各ファイルは独立して更新・管理可能
- 必要なデータのみを読み込んで処理
- スケーラブルな設計（店舗数・イベント種類の増加に対応）

### 2.2 ファイル命名規則
```
{エンティティタイプ}_{ID}.csv
例：
- store_001.csv
- store_production_info_001.csv
- machine_M001.csv
- event_E001.csv
```

## 3. CSVファイル詳細仕様

### ファイル構造の共通仕様
- **縦持ち構造**: element（要素）単位でデータを管理
- **日付データ**: day_1〜day_31として日付を縦軸に配置
- **JSON格納**: 複数月のデータは各セルにJSON形式で保持
- **データ追加**: 既存ファイルに新規データを追記する方式

### 3.1 店舗マスタ（store_{store_id}.csv）
**ファイル数**: 約6,000ファイル（店舗数分）

**ファイル構造**:
```csv
number,element,要素名,情報
1,store_id,店舗ID,001
2,store_name,店舗名,アイランド秋葉原店
3,address,住所,東京都千代田区外神田3-1-1
4,prefecture,都道府県,東京都
5,city,市区町村,千代田区
6,total_slots,総台数,385
7,parking_spots,駐車場台数,20
8,nearest_station,最寄り駅,秋葉原駅
9,walk_minutes,駅徒歩分数,5
10,opening_hours,営業時間,10:00-23:00
```

### 3.2 店舗出玉情報（store_production_info_{store_id}.csv）
**ファイル数**: 約6,000ファイル（店舗数分）

**ファイル構造**:
```csv
number,element,要素名,情報
1,store_id,店舗ID,001
2,store_name,店舗名,アイランド秋葉原店
3,day_1,1日,"[{""month"":3,""year"":2025,""total_diff"":78537,""avg_diff"":204}]"
4,day_2,2日,"[{""month"":3,""year"":2025,""total_diff"":-36244,""avg_diff"":-94}]"
...
34,machine_day_1,1日機種別,"[{""month"":3,""year"":2025,""machines"":{""M001"":{""machine_name"":""北斗の拳"",""units"":{""101"":{""diff"":15000,""games"":8000,""rate"":""110.5%""}},""total_diff"":21000,""avg_diff"":1050}}}]"
...
65,top10_day_1,1日TOP10,"[{""month"":3,""year"":2025,""top10"":[{""rank"":1,""machine_id"":""M001"",""machine_name"":""北斗の拳"",""unit"":""101"",""diff"":15000}]}]"
...
```

**データ構造の特徴**:
- 日付（1〜31日）を縦軸とした構造
- 各セルにJSON形式で複数月のデータを保持
- データ追加時は既存ファイルに追記

### 3.3 機種マスタ（machines_info.csv）
**ファイル形式**: 単一ファイル（全機種を1ファイルに格納）

**ファイル構造**:
```csv
machine_id,number,element,要素名,情報,大項目
M001,1,machine_id,機種ID,M001,基本情報
M001,2,machine_name,機種名,パチスロ北斗の拳,基本情報
M001,3,machine_type,機種タイプ,スロット,基本情報
M001,4,maker,メーカー,サミー,基本情報
M001,5,spec_type,スペック,6号機,基本情報
M001,6,introduction_date,導入日,2023-01-15,基本情報
M001,7,popularity_index,人気指数,92,性能情報
M002,8,machine_id,機種ID,M002,基本情報
M002,9,machine_name,機種名,ゴッドイーター,基本情報
...
```

**データ構造の特徴**:
- 縦持ち構造（element単位）
- machine_idで機種を識別
- 大項目でグループ化可能

### 3.4 イベントマスタ（event_{event_id}.csv）
**ファイル数**: イベント種類分（例：event_E001.csv）

**ファイル構造**:
```csv
event_id,number,element,要素名,情報,重要度
E001,1,event_name,イベント名,某誌取材,高
E001,2,event_type,イベントタイプ,取材,高
E001,3,expected_bonus,期待値係数,1.5,高
E001,4,description,説明,大手パチスロ雑誌の取材イベント,中
E001,5,day_1,1日,,
E001,6,day_2,2日,,
...
E001,18,day_14,14日,"[{""year"": 2025, ""month"": 2, ""store_id"": ""001"", ""store_name"": ""アイランド秋葉原店""}]",高
...
E001,28,day_24,24日,"[{""year"": 2025, ""month"": 1, ""store_id"": ""001"", ""store_name"": ""アイランド秋葉原店""}]",高
...
E001,35,day_31,31日,,
```

**データ構造の特徴**:
- 日付（1〜31日）を縦軸とした構造
- 各セルにJSON形式で開催店舗情報を保持
- 開催がない日は空白
- 複数店舗が同日開催の場合は配列で格納

## 4. データ連携仕様

### 4.1 データ処理フロー
```
1. 元データ受信（3つのCSV）
   ├── [店舗名]_日付毎サマリー_YYYYMMDD.csv
   ├── [店舗名]_機種別差枚数_YYYYMMDD.csv
   └── [店舗名]_台番別差枚数_YYYYMMDD.csv
   
2. データ統合処理
   └── store_production_info_{store_id}.csv に統合
   
3. スコアリング処理時の参照
   ├── store_{store_id}.csv（店舗情報）
   ├── machine_{machine_id}.csv（機種情報）
   └── event_{event_id}.csv（イベント情報）
```

### 4.2 データ処理時の参照パターン
```typescript
// スコアリング処理時の例
async function calculateScoreWithEvent(storeId: string, date: Date) {
  // 1. 店舗の出玉データ取得
  const productionData = await getStoreProductionData(storeId, date);
  
  // 2. イベント情報の確認（全イベントファイルをチェック）
  const eventFiles = await listEventFiles(); // event_E001.csv, event_E002.csv...
  const todayEvents = [];
  
  for (const eventFile of eventFiles) {
    const eventData = await getEventData(eventFile, date);
    if (eventData && eventData.some(e => e.store_id === storeId)) {
      todayEvents.push(eventData);
    }
  }
  
  // 3. 機種情報の参照
  const machineData = await getMachineInfo(); // machines_info.csvから必要な機種を抽出
  
  // 4. スコア計算
  return computeScore(productionData, todayEvents, machineData);
}
```

## 5. 実装上の考慮事項

### 5.1 パフォーマンス最適化
- 必要なCSVファイルのみを読み込む
- インデックスファイルの作成を検討
- キャッシュ戦略の実装

### 5.2 データ整合性
- ファイル名とIDの一致を保証
- 更新時のトランザクション処理
- バックアップとリカバリー戦略

### 5.3 スケーラビリティ
- ファイル数増加に対応できるディレクトリ構造
- 並列処理による高速化
- 将来的なデータベース移行を考慮した設計

## 6. ディレクトリ構造

```
data/
├── stores/
│   ├── store_001.csv
│   ├── store_002.csv
│   └── ...（店舗数分）
├── store_production_info/
│   ├── store_production_info_001.csv
│   ├── store_production_info_002.csv
│   └── ...（店舗数分）
├── machines/
│   └── machines_info.csv（全機種を1ファイルに格納）
└── events/
    ├── event_E001.csv
    ├── event_E002.csv
    └── ...（イベント種類分）
```

## 7. API設計への影響

### 7.1 データ取得パターン
```typescript
// 単一店舗の情報取得
async function getStoreData(storeId: string) {
  const storeInfo = await readCSV(`stores/store_${storeId}.csv`);
  const productionInfo = await readCSV(`store_production_info/store_production_info_${storeId}.csv`);
  return { storeInfo, productionInfo };
}

// 複数店舗のスコアリング
async function calculateScores(storeIds: string[]) {
  const promises = storeIds.map(id => getStoreData(id));
  const storesData = await Promise.all(promises);
  // スコア計算処理
}
```

### 7.2 データ更新パターン
```typescript
// 店舗出玉情報の更新
async function updateStoreProduction(storeId: string, newData: any) {
  const filePath = `store_production_info/store_production_info_${storeId}.csv`;
  const existingData = await readCSV(filePath);
  const mergedData = mergeProductionData(existingData, newData);
  await writeCSV(filePath, mergedData);
}
```

## 8. 今後の拡張性

### 8.1 データ形式の移行
- CSV → JSON形式への移行パス
- NoSQLデータベースへの移行検討
- リアルタイムデータ対応

### 8.2 新規データタイプ
- ユーザー行動データ
- リアルタイム稼働状況
- 天候・イベント相関データ

## 9. セキュリティ考慮事項

### 9.1 アクセス制御
- ファイルレベルでの権限管理
- APIレベルでの認証・認可
- 個人情報の取り扱い

### 9.2 データ保護
- 暗号化の実装
- バックアップ戦略
- 監査ログの実装

---

この仕様書に基づいて、スケーラブルで保守性の高いデータ管理システムを構築します。
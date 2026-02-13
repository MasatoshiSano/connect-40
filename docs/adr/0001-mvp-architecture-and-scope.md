# ADR-0001: MVP アーキテクチャとスコープの決定

## Status

Accepted

## Date

2025-12-21

## Context

Connect40は40代男性向けの孤独解消マッチングプラットフォームであり、初期MVPリリースに向けて以下の課題と制約が存在する：

### 現在の課題
1. **コスト効率性**: 初期ユーザー数（500人想定）に対して過剰なインフラコストは避けたい
2. **開発リソース**: 個人開発（AWS経験豊富なエンジニア1名）のため、実装複雑度を抑える必要がある
3. **リリース速度**: 市場検証のため、3ヶ月以内のMVPリリースが目標
4. **スケーラビリティ**: 将来的な成長（5,000ユーザー）に対応できる設計が必要

### 検討した選択肢

#### 1. キャッシュ層
- **Option A**: ElastiCache Redis導入（月$12、高速、運用複雑）
- **Option B**: キャッシュなし（Cognito + DynamoDBのみ）
- **Option C**: DynamoDB DAX（高コスト、オーバースペック）

#### 2. チャット実装方式
- **Option A**: AWS AppSync（GraphQL、簡単、若干高コスト）
- **Option B**: API Gateway WebSocket（柔軟、低コスト、実装複雑）
- **Option C**: サードパーティ（Twilio, SendBird等、高コスト、依存リスク）

#### 3. ファイル添付機能
- **Option A**: MVP段階で実装（開発工数増、S3コスト増）
- **Option B**: MVP後のフェーズで実装（工数削減、スコープ明確化）

#### 4. 決済方式
- **Option A**: Stripeクレジットカードのみ（実装簡単、登録ハードル高）
- **Option B**: 複数決済手段（コンビニ決済、銀行振込含む、実装複雑）

#### 5. 無料トライアル時のカード登録
- **Option A**: 登録必須（不正利用防止、ハードル高）
- **Option B**: 登録不要（登録しやすい、課金忘れリスク、不正利用リスク）

## Decision

Connect40のMVPフェーズにおいて、以下の設計決定を行う：

### 1. ElastiCache Redisを使用しない

**理由**:
- セッション管理はAmazon Cognitoで完結可能
- 位置情報検索のキャッシュは初期トラフィック（MAU 150人）では不要
- DynamoDBのパフォーマンスで十分対応可能
- 月$12のコスト削減（年間$144削減）

**実装方針**:
- セッション: Cognito User Pool + JWT
- 位置検索: DynamoDB GSI（Geohash）で直接クエリ
- 将来的にパフォーマンス問題が発生した場合は、ADRを更新してキャッシュ層を追加

### 2. チャット機能はAPI Gateway WebSocketで実装

**理由**:
- 個人開発者はAWS経験豊富であり、WebSocket実装の複雑度に対応可能
- AppSyncと比較して低コスト（接続時間課金のみ）
- より柔軟なカスタマイズが可能（将来的な機能拡張に有利）
- GraphQLのオーバーヘッドが不要（シンプルなメッセージング）

**実装方針**:
- API Gateway WebSocket API
- Lambda関数でメッセージ処理
- DynamoDBでメッセージ永続化
- 接続管理はDynamoDBテーブル（ConnectionId管理）

### 3. チャットでのファイル添付機能は初期MVPに含めない

**理由**:
- MVPの核心価値（オフライン活動のマッチング）に直結しない
- 実装工数の削減（画像アップロード、リサイズ、検証、S3管理等）
- ストレージコストの削減
- ユーザーフィードバック後に優先度を再評価可能

**実装方針**:
- チャットはテキストメッセージのみ対応
- 必要に応じてURL共有で代替可能
- フェーズ2以降で画像添付機能を検討（ADR更新）

### 4. 決済はStripeクレジットカードのみ

**理由**:
- Stripe APIの実装がシンプル（Checkout Session + Webhook）
- ターゲット層（35-49歳男性）のクレジットカード保有率は高い
- コンビニ決済・銀行振込の実装工数と手数料を回避
- 初期MVPでのビジネス検証に十分

**実装方針**:
- Stripe Checkout Session（サブスクリプションモード）
- Webhook処理（`checkout.session.completed`, `customer.subscription.deleted`）
- プレミアム会員のDynamoDB属性管理

### 5. 無料トライアル開始時にクレジットカード登録を必須とする

**理由**:
- 不正利用（捨てアカウント作成）の防止
- トライアル期間終了後の自動課金（コンバージョン率向上）
- ビジネスモデルの健全性（真剣なユーザーのみ登録）

**実装方針**:
- Stripe Checkout で `subscription_data.trial_period_days: 30` 設定
- カード登録時に$0認証（Authorization Hold）
- トライアル終了後の自動課金

## Consequences

### メリット

1. **コスト削減**
   - ElastiCache削除: 月$12削減
   - ファイル添付なし: S3/転送コスト削減
   - **合計月額コスト: $48-110**（従来$60-122から削減）

2. **開発速度向上**
   - ファイル添付機能の実装工数削減（推定1週間削減）
   - WebSocket APIの実装は経験豊富な開発者にとって効率的
   - 決済フローがシンプル（Stripe単一統合）

3. **技術的シンプルさ**
   - 管理するAWSサービス数の削減
   - GraphQLスキーマ管理の複雑性回避
   - 認証フローの一元化（Cognito）

4. **スケーラビリティ**
   - WebSocketは同時接続数1,000まで$1/百万接続分で対応可能
   - DynamoDBオンデマンドモードで自動スケール
   - 必要時にキャッシュ層を追加可能

### デメリット

1. **初期機能制限**
   - チャットでの画像共有不可（ユーザー体験に影響の可能性）
   - 決済手段の選択肢が限定的（一部ユーザーの離脱リスク）

2. **将来的な技術負債**
   - WebSocket実装の複雑性（AppSyncより保守コスト高）
   - キャッシュなしでのパフォーマンス制約（1,000ユーザー超で要検討）

3. **クレジットカード登録ハードル**
   - 登録コンバージョン率の低下可能性
   - プライバシー懸念ユーザーの離脱

### 影響範囲

#### 更新が必要なファイル・モジュール

1. **設計書（.tmp/design.md）**
   - セクション1.2: ElastiCache削除
   - セクション2.2: ChatFunction詳細をWebSocket向けに書き換え
   - セクション4: WebSocket APIエンドポイント定義
   - セクション9.2: 環境変数からRedis関連削除

2. **インフラコード（未実装）**
   - CDK Stack: ElastiCache Stackの削除
   - API Gateway WebSocket API定義
   - Lambda関数: WebSocket接続管理、メッセージ送受信

3. **フロントエンド（未実装）**
   - WebSocketクライアント実装（Socket.io Client等）
   - チャットUI（ファイルアップロードボタン削除）
   - Stripe Checkout統合

4. **データベース設計**
   - DynamoDBテーブル: WebSocket接続管理テーブル追加
   ```
   WebSocketConnections Table
   PK: connectionId
   Attributes: userId, connectedAt, ttl
   GSI: userId-index (逆引き用)
   ```

#### 新規作成が必要なファイル

- `cdk/lib/stacks/websocket-stack.ts`: WebSocket APIスタック
- `backend/functions/websocket/connect.ts`: 接続ハンドラー
- `backend/functions/websocket/disconnect.ts`: 切断ハンドラー
- `backend/functions/websocket/sendMessage.ts`: メッセージ送信
- `frontend/src/services/websocket.ts`: WebSocketクライアント

## References

- [Amazon API Gateway WebSocket API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [DynamoDB GSI Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-indexes-general.html)
- [Stripe Checkout for Subscriptions](https://stripe.com/docs/billing/subscriptions/checkout)
- 関連ドキュメント: `.tmp/requirements.md`, `.tmp/design.md`

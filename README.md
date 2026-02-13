# Connect40

> 40代男性向け孤独解消マッチングプラットフォーム

「第3の居場所を見つける」をコンセプトに、アクティビティを起点とした地域密着型のマッチングサービスです。

## 📋 プロジェクト概要

- **ターゲット**: 35-49歳（アラウンド40）男性
- **初期ローンチ地域**: 関西地区
- **サービスコンセプト**: 具体的なアクティビティに限定した地域コミュニティプラットフォーム
- **技術スタック**: React + Vite + Tailwind CSS / AWS Serverless

## 🏗️ アーキテクチャ

### フロントエンド
- React 18 + Vite 5
- TypeScript 5
- Tailwind CSS 3
- Zustand (状態管理)
- TanStack Query (データフェッチ)

### バックエンド
- AWS Lambda (Node.js 20, TypeScript)
- Amazon DynamoDB (Single Table Design)
- Amazon Cognito (認証)
- API Gateway (REST + WebSocket)
- Amazon S3 (ストレージ)
- CloudFront (CDN)

### インフラ
- AWS CDK v2 (TypeScript)
- GitHub Actions (CI/CD)

## 📁 プロジェクト構成

```
Connect40/
├── frontend/          # React + Vite フロントエンド
├── backend/           # Lambda関数
│   ├── functions/     # 各Lambda関数
│   └── layers/        # Lambda Layer
├── cdk/               # AWS CDK インフラ定義
├── docs/              # ドキュメント
│   └── adr/          # Architecture Decision Records
├── .tmp/              # 設計ドキュメント
└── UI/                # 既存UIデザイン（参照用）
```

## 🚀 セットアップ

### 前提条件

- Node.js >= 20.18.1
- npm >= 10.0.0
- AWS CLI v2
- AWS CDK CLI v2

### インストール

```bash
# Node.jsバージョン確認
node --version

# 依存関係インストール
npm install

# 各ワークスペースの依存関係インストール
npm install --workspaces
```

### 開発環境起動

```bash
# フロントエンド開発サーバー起動
npm run dev

# 型チェック
npm run typecheck

# リント
npm run lint

# フォーマット
npm run format
```

### AWS インフラデプロイ

```bash
# CDK Bootstrap (初回のみ)
cd cdk
npx cdk bootstrap

# インフラデプロイ (dev環境)
npm run cdk:deploy -- --all --context env=dev

# インフラ削除
npx cdk destroy --all --context env=dev
```

## 🧪 テスト

```bash
# 全ワークスペースのテスト実行
npm run test

# フロントエンド単体テスト
npm run test --workspace=frontend

# E2Eテスト (Playwright)
npm run test:e2e --workspace=frontend
```

## 📚 ドキュメント

- [要件定義書](.tmp/requirements.md)
- [詳細設計書](.tmp/design.md)
- [タスクリスト](.tmp/tasks.md)
- [ADR](docs/adr/)
  - [ADR-0001: MVPアーキテクチャとスコープの決定](docs/adr/0001-mvp-architecture-and-scope.md)

## 🔑 環境変数

### フロントエンド (.env)

```env
VITE_API_ENDPOINT=https://api.connect40.jp
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_GOOGLE_MAPS_API_KEY=xxxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### バックエンド (AWS Systems Manager Parameter Store)

```
/connect40/dev/stripe/secret-key
/connect40/dev/google-maps/api-key
```

## 🎯 主要機能

### MVP機能
- ✅ ランディングページ
- ✅ ユーザー認証・登録 (Cognito)
- ✅ プロフィール作成 (3ステップ)
- ✅ 本人確認フロー
- ✅ アクティビティ検索・一覧
- ✅ アクティビティ詳細・参加申込
- ✅ チャット機能 (WebSocket)
- ✅ 決済・プレミアム会員管理 (Stripe)
- ✅ マイページ・ダッシュボード

## 💰 料金プラン

| 機能 | フリー会員 | プレミアム会員 |
|------|-----------|---------------|
| 月額料金 | 無料 | 980円 |
| イベント参加 | 月1回 | 無制限 |
| イベント作成 | 不可 | 可能 |
| 新規チャット開始 | 月3回 | 無制限 |
| 無料トライアル | - | 30日間 |

## 📊 開発スケジュール

- Phase 1: プロジェクトセットアップ・基盤構築 (2週間)
- Phase 2: 認証・ユーザー管理機能 (2週間)
- Phase 3: アクティビティ機能 (3週間)
- Phase 4: チャット機能 (2週間)
- Phase 5: 決済・プレミアム機能 (1週間)
- Phase 6: UI/UX仕上げ (1週間)
- Phase 7: テスト・デプロイ (1週間)

**合計: 約12週間**

## 🤝 コントリビューション

このプロジェクトは個人開発プロジェクトです。

## 📄 ライセンス

UNLICENSED - このプロジェクトは非公開です。

## 👤 作成者

Masatoshi Sano

---

*Generated with [Claude Code](https://claude.com/claude-code)*

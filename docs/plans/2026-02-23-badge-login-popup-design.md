# バッジログインポップアップ 設計ドキュメント

**日付**: 2026-02-23
**ステータス**: 承認済み

## 概要

ログイン後のダッシュボード表示時に、新しく獲得したバッジを祝福するポップアップモーダルを表示する。同時に、次に取得できるバッジ候補2〜3件を進捗バー＋アクションボタン付きで提案し、ユーザーの継続的な活動を促す。

## トリガーロジック

| 状況 | 表示内容 |
|---|---|
| 初回（localStorage未記録）＋バッジゼロ | バッジ紹介「こんなバッジが獲得できます！まずこれから始めよう」 |
| 初回（localStorage未記録）＋バッジあり | 全取得済みバッジを「おめでとう！」として表示＋次のバッジ提案 |
| 2回目以降＋新バッジあり | 新バッジのみ祝福表示＋次のバッジ提案 |
| 2回目以降＋新バッジなし | 表示しない |

**永続化**: `localStorage` キー `connect40_seen_badges_{userId}`（バッジIDの配列）

## UIデザイン

### パターン①「祝福」（新バッジあり）
- ヘッダー: 「🎉 バッジを獲得しました！」
- 新バッジカード: アイコン・名前・説明・特典
- セパレーター: 「── 次のバッジに挑戦しよう ──」
- 次バッジカード×2〜3: 進捗バー（現在値/必要値）＋提案文＋アクションボタン

### パターン②「初回オンボーディング」（バッジゼロ）
- ヘッダー: 「🏅 バッジを集めよう！」
- 説明文: 「活動するとバッジが増えていきます」
- 次バッジカード×2〜3: 同上

## 次バッジ選出ロジック

- 未取得バッジを達成率（現在値÷必要値）の高い順にソート
- `veteran`（30日経過）は最後尾に回す（行動では変えられないため）
- 上位2〜3件を表示

## アクションボタンマッピング

| バッジ | ボタンラベル | 遷移先 |
|---|---|---|
| first_join / regular | アクティビティを探す | /activities |
| first_host / popular_host | アクティビティを作成 | /activities/create |
| reviewer | レビューを書く | /activities |
| social | チャットを始める | /chat |
| veteran | 表示しない or 自然に待とう | — |

## コンポーネント構成

### 新規: `frontend/src/components/badges/BadgeLoginPopup.tsx`
- Props: `userStats: UserStats`, `userId: string`, `nickname: string`
- localStorage比較で表示要否を判定
- モーダルUI（祝福 or オンボーディング）をレンダリング
- 閉じる時にlocalStorageを更新

### 修正: `frontend/src/pages/Dashboard.tsx`
- `isLoading === false` かつ `userStats` 計算後に `<BadgeLoginPopup>` をマウント
- 既存の `userStats`・`userId`・`nickname` をそのまま渡す

## 技術制約

- バックエンド変更・API追加なし
- 新規ストア不要（`useState` のみ）
- TypeScript `any`・`unknown` 型不使用
- `class` 不使用

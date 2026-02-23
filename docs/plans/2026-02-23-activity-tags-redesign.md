# アクティビティタグ再設計 設計ドキュメント

**日付**: 2026-02-23
**ステータス**: 承認済み

## 概要

アクティビティ作成時のタグ選択UXを改善する。30件の内容タグを一覧から手動選択する現行UIを廃止し、**状況タグ（固定・手動選択）** と **内容タグ（AI提案＋手動追加）** の2層構造に刷新する。

## タグ構造

### 状況タグ（SITUATION_TAGS）
カテゴリに関係なく常時表示。約12件から手動選択。

| 時間帯 | 参加スタイル |
|---|---|
| 早朝（〜9時） | 平日OK |
| 午前中 | 週末のみ |
| 昼 | 初心者歓迎 |
| 夕方 | 経験者向け |
| 仕事帰り | 日帰り |
| 夜 | 少人数（〜4人） |

### 内容タグ（ACTIVITY_TAGS）
既存30件を50件に拡張したプールから：
1. AIがタイトル・説明・カテゴリを元に3〜5件を提案
2. 提案チップを個別にON/OFF
3. 「他のタグを追加」ボタンで残りのタグから手動追加

## UIフロー

```
【状況タグ】  常時表示 → クリックでON/OFF
早朝 | 午前中 | 昼 | 夕方 | 仕事帰り | 夜
平日OK | 週末のみ | 初心者歓迎 | 経験者向け | 日帰り | 少人数

【内容タグ】
[✨ AIでタグを提案]  ← title or description が入力済みの場合のみ有効
  ↓ クリック後
AI提案: [ゴルフ ✕] [週末 ✕] [初心者OK ✕]  ← 個別にOFFできる
[他のタグを追加 ▾]  ← クリックで残りの50件展開（提案済みはグレーアウト）
```

## タグ合計上限

- 状況タグ＋AI提案＋手動追加の合計が **最大10件**
- 合計10件に達したら新規選択を無効化（disabled表示）

## コンポーネント・状態管理

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `frontend/src/constants/activities.ts` | `SITUATION_TAGS`（12件）追加、`ACTIVITY_TAGS` を50件に拡張 |
| `frontend/src/pages/activities/CreateActivity.tsx` | タグUIを2層に分離、AIタグ提案ボタン追加 |
| `backend/functions/ai/refineText.ts` | `mode: 'tags'` 追加 |

### 状態管理（useState のみ）

```ts
const [situationTags, setSituationTags] = useState<string[]>([]);
const [suggestedTags, setSuggestedTags] = useState<string[]>([]);  // AI提案（選択済み）
const [manualTags, setManualTags] = useState<string[]>([]);         // 手動追加
const [isSuggestingTags, setIsSuggestingTags] = useState(false);
const [showMoreTags, setShowMoreTags] = useState(false);
```

送信時: `tags: [...situationTags, ...suggestedTags, ...manualTags]`（重複除去）

### 合計カウントヘルパー

```ts
const totalTags = situationTags.length + suggestedTags.length + manualTags.length;
const canAddMore = totalTags < MAX_TAGS; // MAX_TAGS = 10
```

## バックエンドAPI拡張

既存 `POST /ai/refine` に `mode: 'tags'` を追加：

```ts
// リクエスト
{ mode: 'tags', title: string, description: string, category: string }

// レスポンス
{ tags: string[] }  // ACTIVITY_TAGS の中から3〜5件
```

AIプロンプト：ACTIVITY_TAGS のリストを渡し、タイトル・説明・カテゴリに最も合うタグを3〜5件選ばせる。レスポンスはJSON配列。

## 追加する内容タグ（50件リスト）

既存30件に加え、以下20件を追加：
- ゴルフ、テニス、フットサル、バスケ、バドミントン
- 温泉・サウナ、スキー・スノボ、サーフィン、マラソン
- ワイン・日本酒、グルメ探索、コーヒー巡り
- プログラミング、副業・起業、資格勉強
- 子育て仲間、ペット連れOK、シニア歓迎、外国語、オンライン可

## 技術制約

- バックエンド変更は `refineText.ts` のみ（Lambda再デプロイ必要）
- 新規ストア不要（`useState` のみ）
- TypeScript `any`/`unknown` 型不使用
- `class` 不使用

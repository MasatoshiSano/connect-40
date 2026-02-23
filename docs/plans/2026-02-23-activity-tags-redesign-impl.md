# Activity Tags Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** アクティビティ作成のタグ選択を「状況タグ（固定・手動選択）」+「内容タグ（AI提案＋手動追加）」の2層構造に刷新する。

**Architecture:** フロントエンド側は useState のみで状態管理。バックエンドは既存の POST /ai/refine に `mode: 'tags'` を追加して対応。Lambda を直接更新してデプロイ。

**Tech Stack:** React, TypeScript, Tailwind CSS, AWS Lambda (Node.js 20), Bedrock Claude Haiku

---

### Task 1: constants/activities.ts を更新

**Files:**
- Modify: `frontend/src/constants/activities.ts`

**Step 1: SITUATION_TAGS を追加し、ACTIVITY_TAGS を50件に拡張する**

`frontend/src/constants/activities.ts` を開き、既存の `ACTIVITY_TAGS` の前に `SITUATION_TAGS` を追加し、`ACTIVITY_TAGS` を以下の50件に置き換える:

```ts
export const SITUATION_TAGS = [
  '早朝（〜9時）',
  '午前中',
  '昼',
  '夕方',
  '仕事帰り',
  '夜',
  '平日OK',
  '週末のみ',
  '初心者歓迎',
  '経験者向け',
  '日帰り',
  '少人数（〜4人）',
] as const;

export type SituationTag = (typeof SITUATION_TAGS)[number];

export const ACTIVITY_TAGS = [
  // 既存30件
  '料理教室',
  'ハイキング',
  '写真撮影',
  '読書会',
  '語学交換',
  'ボードゲーム',
  'サイクリング',
  'ヨガ・瞑想',
  '音楽演奏',
  'アート・クラフト',
  '釣り',
  'ガーデニング',
  '映画鑑賞',
  'ランニング',
  'ダンス',
  'キャンプ',
  'バードウォッチング',
  '茶道・華道',
  'カフェ巡り',
  '旅行計画',
  'ボランティア',
  'スポーツ観戦',
  '料理・グルメ',
  '登山',
  '温泉巡り',
  'DIY・ものづくり',
  '天体観測',
  '動物・ペット',
  '音楽鑑賞',
  '歴史探訪',
  // 新規20件
  'ゴルフ',
  'テニス',
  'フットサル',
  'バスケットボール',
  'バドミントン',
  'スキー・スノボ',
  'サーフィン',
  'マラソン',
  '温泉・サウナ',
  'ワイン・日本酒',
  'コーヒー巡り',
  'プログラミング',
  '副業・起業',
  '資格勉強',
  '子育て仲間',
  'ペット連れOK',
  'シニア歓迎',
  '外国語',
  'オンライン可',
  'グルメ探索',
] as const;

export type ActivityTag = (typeof ACTIVITY_TAGS)[number];
```

**Step 2: TypeScript チェック**

Run: `cd /mnt/c/Users/masat/AllApps/Connect40/frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: エラーなし

**Step 3: コミット**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40 && git add frontend/src/constants/activities.ts && git commit -m "feat: add SITUATION_TAGS and expand ACTIVITY_TAGS to 50 items"
```

---

### Task 2: api.ts に recommendTags を追加

**Files:**
- Modify: `frontend/src/services/api.ts`

**Step 1: recommendTags 関数を追加する**

`api.ts` の末尾（`recommendCategory` 関数の直後）に追加:

```ts
/**
 * Recommend content tags using AI based on title, description, and category
 */
export async function recommendTags(
  title: string,
  description: string,
  category: string
): Promise<string[]> {
  const response = await fetchWithAuth<{ tags: string[] }>('/ai/refine', {
    method: 'POST',
    body: JSON.stringify({ title, text: description, category, mode: 'tags' }),
  });
  return response.tags;
}
```

**Step 2: TypeScript チェック**

Run: `cd /mnt/c/Users/masat/AllApps/Connect40/frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: エラーなし

**Step 3: コミット**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40 && git add frontend/src/services/api.ts && git commit -m "feat: add recommendTags API function"
```

---

### Task 3: refineText.ts に mode:'tags' を追加してLambdaデプロイ

**Files:**
- Modify: `backend/functions/ai/refineText.ts`

**Step 1: ファイルを読んで現状を確認する**

`/mnt/c/Users/masat/AllApps/Connect40/backend/functions/ai/refineText.ts` を Read ツールで読む。

**Step 2: RefineMode 型と入力インターフェースを拡張する**

`RefineMode` 型を変更:
```ts
type RefineMode = 'refine' | 'category' | 'tags';
```

`RefineTextInput` インターフェースを変更（`category` フィールドを追加）:
```ts
interface RefineTextInput {
  text: string;
  type: 'activity' | 'bio';
  mode?: RefineMode;
  title?: string;
  category?: string;
  userContext: {
    nickname: string;
    age: number;
    interests: string[];
    location?: string;
  };
}
```

**Step 3: ACTIVITY_TAGS_LIST 定数を追加する**

ファイルの先頭付近（`VALID_CATEGORIES` の直後）に追加:

```ts
const ACTIVITY_TAGS_LIST = [
  '料理教室', 'ハイキング', '写真撮影', '読書会', '語学交換',
  'ボードゲーム', 'サイクリング', 'ヨガ・瞑想', '音楽演奏', 'アート・クラフト',
  '釣り', 'ガーデニング', '映画鑑賞', 'ランニング', 'ダンス',
  'キャンプ', 'バードウォッチング', '茶道・華道', 'カフェ巡り', '旅行計画',
  'ボランティア', 'スポーツ観戦', '料理・グルメ', '登山', '温泉巡り',
  'DIY・ものづくり', '天体観測', '動物・ペット', '音楽鑑賞', '歴史探訪',
  'ゴルフ', 'テニス', 'フットサル', 'バスケットボール', 'バドミントン',
  'スキー・スノボ', 'サーフィン', 'マラソン', '温泉・サウナ', 'ワイン・日本酒',
  'コーヒー巡り', 'プログラミング', '副業・起業', '資格勉強', '子育て仲間',
  'ペット連れOK', 'シニア歓迎', '外国語', 'オンライン可', 'グルメ探索',
] as const;
```

**Step 4: handler 内に mode:'tags' のブロックを追加する**

`mode === 'category'` のブロックの直後（`// Refine mode (default)` の前）に追加:

```ts
if (mode === 'tags') {
  const tagSystemPrompt = `あなたはConnect40（40代のためのコミュニティアプリ）のタグ推薦アシスタントです。
アクティビティのタイトル・説明・カテゴリから、最も関連性の高いタグを以下のリストから3〜5件選んでください。

利用可能なタグ:
${ACTIVITY_TAGS_LIST.join('、')}

必ずJSONの配列形式のみで返してください。例: ["ゴルフ","ランニング","仲間募集"]
余計な説明・前置きは一切不要です。`;

  const tagUserMessage = `タイトル: ${input.title ?? ''}
カテゴリ: ${input.category ?? ''}
説明: ${input.text ?? ''}`;

  const tagPayload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 200,
    system: tagSystemPrompt,
    messages: [{ role: 'user', content: tagUserMessage }],
  };

  const tagCommand = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    body: JSON.stringify(tagPayload),
    contentType: 'application/json',
  });

  const tagResponse = await bedrockClient.send(tagCommand);
  const tagResponseBody = JSON.parse(new TextDecoder().decode(tagResponse.body));
  const rawTagText = (tagResponseBody.content?.[0]?.text ?? '[]').trim();

  let tags: string[] = [];
  try {
    const parsed = JSON.parse(rawTagText);
    if (Array.isArray(parsed)) {
      tags = parsed
        .filter((t): t is string => typeof t === 'string')
        .filter((t) => (ACTIVITY_TAGS_LIST as readonly string[]).includes(t))
        .slice(0, 5);
    }
  } catch {
    tags = [];
  }

  return successResponse({ tags });
}
```

**Step 5: TypeScript チェック**

Run: `cd /mnt/c/Users/masat/AllApps/Connect40 && npx tsc --noEmit -p backend/tsconfig.json 2>&1 | head -20`
Expected: エラーなし（tsconfig.json がなければ `npx tsc --noEmit backend/functions/ai/refineText.ts --target ES2020 --moduleResolution node --esModuleInterop 2>&1 | head -20`）

**Step 6: Lambda をデプロイする**

```bash
# esbuild でバンドル
cd /mnt/c/Users/masat/AllApps/Connect40
npx esbuild backend/functions/ai/refineText.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --external:"@aws-sdk/*" \
  --outfile=/tmp/refine-handler.js

# zip 作成
python3 -c "
import zipfile
with zipfile.ZipFile('/tmp/refine-lambda.zip', 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.write('/tmp/refine-handler.js', 'index.js')
print('zip created')
"

# Lambda 更新
aws lambda update-function-code \
  --function-name Connect40-Api-dev-RefineTextFunction18322120-VpYG79DJbBVI \
  --zip-file fileb:///tmp/refine-lambda.zip \
  --query 'FunctionName' \
  --output text
```

Expected: `Connect40-Api-dev-RefineTextFunction18322120-VpYG79DJbBVI`

**Step 7: コミット**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40 && git add backend/functions/ai/refineText.ts && git commit -m "feat: add mode:'tags' to AI refine endpoint for tag recommendation"
```

---

### Task 4: CreateActivity.tsx のタグUIを2層構造に刷新

**Files:**
- Modify: `frontend/src/pages/activities/CreateActivity.tsx`

**Step 1: import と state を更新する**

import 行を変更:
```ts
import { ACTIVITY_CATEGORIES, DURATION_OPTIONS, MAX_PARTICIPANTS_OPTIONS, RECURRENCE_OPTIONS, ACTIVITY_TAGS, SITUATION_TAGS } from '../../constants/activities';
```

`recommendTags` を api.ts から追加でインポート（動的インポートで使うため、ファイル冒頭への静的 import は不要。onSubmit などと同様に `const { recommendTags } = await import('../../services/api');` で呼ぶ）。

既存の `selectedTags` state を削除し、以下の3つに置き換える:
```ts
const [situationTags, setSituationTags] = useState<string[]>([]);
const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
const [manualTags, setManualTags] = useState<string[]>([]);
const [isSuggestingTags, setIsSuggestingTags] = useState(false);
const [showMoreTags, setShowMoreTags] = useState(false);
```

合計カウント用のヘルパー（コンポーネント内に定義）:
```ts
const totalTagCount = situationTags.length + suggestedTags.length + manualTags.length;
const canAddMore = totalTagCount < MAX_TAGS;
```

**Step 2: ハンドラーを更新する**

既存の `handleTagToggle` を削除し、以下の3つに置き換える:

```ts
const handleSituationTagToggle = (tag: string) => {
  setSituationTags(prev =>
    prev.includes(tag)
      ? prev.filter(t => t !== tag)
      : canAddMore ? [...prev, tag] : prev
  );
};

const handleSuggestedTagToggle = (tag: string) => {
  setSuggestedTags(prev =>
    prev.includes(tag)
      ? prev.filter(t => t !== tag)
      : canAddMore ? [...prev, tag] : prev
  );
};

const handleManualTagToggle = (tag: string) => {
  setManualTags(prev =>
    prev.includes(tag)
      ? prev.filter(t => t !== tag)
      : canAddMore ? [...prev, tag] : prev
  );
};

const handleSuggestTags = async () => {
  const title = watch('title');
  const description = watch('description');
  const category = watch('category');
  if (!title && !description) return;
  setIsSuggestingTags(true);
  try {
    const { recommendTags } = await import('../../services/api');
    const tags = await recommendTags(title ?? '', description ?? '', category ?? '');
    setSuggestedTags(tags);
  } catch (error) {
    console.error('Tag suggestion failed:', error);
  } finally {
    setIsSuggestingTags(false);
  }
};
```

**Step 3: onSubmit の tags を更新する**

```ts
// 変更前
tags: selectedTags,

// 変更後
tags: [...new Set([...situationTags, ...suggestedTags, ...manualTags])],
```

**Step 4: JSXのタグセクションを置き換える**

既存のタグセクション（`タグ <span>(任意...` から始まる `<div>` 全体）を以下に置き換える:

```tsx
<div>
  {/* タグ合計カウンター */}
  <div className="flex items-center justify-between mb-3">
    <label className="text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-secondary uppercase">
      タグ <span className="text-text-secondary dark:text-text-dark-muted normal-case tracking-normal">(任意・最大{MAX_TAGS}個)</span>
    </label>
    {totalTagCount > 0 && (
      <span className="text-xs text-text-secondary dark:text-text-dark-muted">
        {totalTagCount} / {MAX_TAGS}
      </span>
    )}
  </div>

  {/* 状況タグ */}
  <p className="text-xs text-text-secondary dark:text-text-dark-muted mb-2 font-light">
    状況・時間帯
  </p>
  <div className="flex flex-wrap gap-2 mb-5">
    {SITUATION_TAGS.map((tag) => {
      const isSelected = situationTags.includes(tag);
      const isDisabled = !isSelected && !canAddMore;
      return (
        <button
          key={tag}
          type="button"
          onClick={() => handleSituationTagToggle(tag)}
          disabled={isDisabled}
          className={`
            px-3 py-1.5 text-sm border transition-all duration-base
            ${isSelected
              ? 'border-gold bg-gold/10 text-gold'
              : isDisabled
                ? 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted opacity-40 cursor-not-allowed'
                : 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 hover:text-gold/80'
            }
          `}
        >
          {tag}
        </button>
      );
    })}
  </div>

  {/* 内容タグ（AI提案） */}
  <p className="text-xs text-text-secondary dark:text-text-dark-muted mb-2 font-light">
    内容タグ
  </p>
  <div className="mb-3">
    <button
      type="button"
      onClick={handleSuggestTags}
      disabled={isSuggestingTags || (!watch('title') && !watch('description'))}
      className="text-sm text-gold border border-gold/40 hover:border-gold hover:bg-gold/5 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 transition-all duration-base flex items-center gap-1.5"
    >
      {isSuggestingTags ? (
        <Icon name="sync" size="sm" className="animate-spin" />
      ) : (
        <Icon name="auto_awesome" size="sm" />
      )}
      {isSuggestingTags ? 'AI提案中...' : 'AIでタグを提案'}
    </button>
  </div>

  {/* AI提案タグ */}
  {suggestedTags.length > 0 && (
    <div className="flex flex-wrap gap-2 mb-3">
      {suggestedTags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => handleSuggestedTagToggle(tag)}
          className="px-3 py-1.5 text-sm border border-gold bg-gold/10 text-gold transition-all duration-base flex items-center gap-1 hover:bg-gold/20"
        >
          {tag}
          <span className="text-xs opacity-60">✕</span>
        </button>
      ))}
    </div>
  )}

  {/* 他のタグを追加（折りたたみ） */}
  <button
    type="button"
    onClick={() => setShowMoreTags(prev => !prev)}
    className="text-xs text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors flex items-center gap-1 mb-2"
  >
    <Icon name={showMoreTags ? 'expand_less' : 'expand_more'} size="sm" />
    他のタグを追加
  </button>

  {showMoreTags && (
    <div className="flex flex-wrap gap-2 mb-3">
      {ACTIVITY_TAGS.map((tag) => {
        const isInSuggested = suggestedTags.includes(tag);
        const isInManual = manualTags.includes(tag);
        const isSelected = isInManual;
        const isDisabled = !isSelected && (!canAddMore || isInSuggested);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => !isInSuggested && handleManualTagToggle(tag)}
            disabled={isDisabled}
            className={`
              px-3 py-1.5 text-sm border transition-all duration-base
              ${isInSuggested
                ? 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted opacity-40 cursor-not-allowed'
                : isSelected
                  ? 'border-gold bg-gold/10 text-gold'
                  : isDisabled
                    ? 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted opacity-40 cursor-not-allowed'
                    : 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary hover:border-gold/40 hover:text-gold/80'
              }
            `}
          >
            {tag}
          </button>
        );
      })}
    </div>
  )}

  {/* 選択中タグのサマリー */}
  {totalTagCount > 0 && (
    <div className="mt-3 flex items-start gap-2">
      <p className="text-xs text-text-secondary dark:text-text-dark-muted mt-0.5 shrink-0">選択中:</p>
      <div className="flex flex-wrap gap-1">
        {[...situationTags, ...suggestedTags, ...manualTags].map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs border border-gold/30 bg-gold/5 text-gold"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )}
</div>
```

**Step 5: TypeScript チェック**

Run: `cd /mnt/c/Users/masat/AllApps/Connect40/frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: エラーなし

**Step 6: コミット**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40 && git add frontend/src/pages/activities/CreateActivity.tsx && git commit -m "feat: redesign tag UI with situation tags and AI tag suggestion"
```

---

### Task 5: フロントエンドビルド & デプロイ

**Step 1: ビルド**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40/frontend && npm run build 2>&1 | tail -10
```

Expected: `✓ built in XX.XXs`

**Step 2: S3 デプロイ**

```bash
aws s3 sync /mnt/c/Users/masat/AllApps/Connect40/frontend/dist/ s3://connect40-frontend-dev-863646532781 --delete 2>&1 | tail -3
```

**Step 3: CloudFront キャッシュ無効化**

```bash
aws cloudfront create-invalidation --distribution-id E356KF1HDDL8LL --paths "/*" --query 'Invalidation.Id' --output text
```

Expected: Invalidation ID が出力される

---

## 実装チェックリスト

- [ ] Task 1: SITUATION_TAGS 追加 + ACTIVITY_TAGS 50件化
- [ ] Task 2: api.ts に recommendTags 追加
- [ ] Task 3: refineText.ts に mode:'tags' 追加 + Lambda デプロイ
- [ ] Task 4: CreateActivity.tsx タグUI 刷新
- [ ] Task 5: フロントエンド ビルド & デプロイ

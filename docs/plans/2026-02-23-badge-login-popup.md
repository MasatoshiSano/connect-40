# Badge Login Popup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** ログイン後のダッシュボード表示時に、新バッジ獲得の祝福・初回オンボーディング・次バッジへの誘導を行うポップアップモーダルを実装する。

**Architecture:** localStorageで既知バッジIDを管理し、新規取得バッジを検出したらモーダルを表示。バックエンド変更なし・新規ストア不要で、`useState`のみで完結させる。

**Tech Stack:** React, TypeScript, Tailwind CSS, localStorage, `constants/badges.ts`（`BADGES`, `evaluateBadge`, `getEarnedBadges`, `UserStats`）

---

### Task 1: BadgeLoginPopup コンポーネント作成

**Files:**
- Create: `frontend/src/components/badges/BadgeLoginPopup.tsx`

**Step 1: ファイルを作成する**

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { BADGES, evaluateBadge, getEarnedBadges } from '../../constants/badges';
import type { BadgeDefinition, UserStats } from '../../constants/badges';

interface BadgeLoginPopupProps {
  userStats: UserStats;
  userId: string;
  nickname: string;
}

interface NextBadgeInfo {
  badge: BadgeDefinition;
  currentValue: number;
  threshold: number;
  ratio: number;
}

const STORAGE_KEY_PREFIX = 'connect40_seen_badges_';

const ACTION_MAP: Record<string, { label: string; path: string } | null> = {
  first_join: { label: 'アクティビティを探す', path: '/activities' },
  regular: { label: 'アクティビティを探す', path: '/activities' },
  first_host: { label: 'アクティビティを作成', path: '/activities/create' },
  popular_host: { label: 'アクティビティを作成', path: '/activities/create' },
  reviewer: { label: 'レビューを書く', path: '/activities' },
  social: { label: 'チャットを始める', path: '/chat' },
  veteran: null,
};

const STAT_KEY_MAP: Record<string, keyof UserStats> = {
  activities_joined: 'activitiesJoined',
  activities_hosted: 'activitiesHosted',
  total_participants: 'totalParticipants',
  reviews_written: 'reviewsWritten',
  chat_rooms: 'chatRooms',
  days_since_registration: 'daysSinceRegistration',
};

const parseCondition = (condition: string): { statKey: keyof UserStats; threshold: number } | null => {
  const match = condition.match(/^(\w+)\s*>=\s*(\d+)$/);
  if (!match) return null;
  const statKey = STAT_KEY_MAP[match[1]];
  if (!statKey) return null;
  return { statKey, threshold: Number(match[2]) };
};

const getNextBadges = (stats: UserStats): NextBadgeInfo[] => {
  const earned = new Set(getEarnedBadges(stats).map((b) => b.id));
  const candidates: NextBadgeInfo[] = [];

  for (const badge of BADGES) {
    if (earned.has(badge.id)) continue;
    const parsed = parseCondition(badge.condition);
    if (!parsed) continue;
    const currentValue = stats[parsed.statKey] as number;
    const ratio = currentValue / parsed.threshold;
    candidates.push({ badge, currentValue, threshold: parsed.threshold, ratio });
  }

  // veteran は最後尾
  candidates.sort((a, b) => {
    if (a.badge.id === 'veteran') return 1;
    if (b.badge.id === 'veteran') return -1;
    return b.ratio - a.ratio;
  });

  return candidates.slice(0, 3);
};

export const BadgeLoginPopup = ({ userStats, userId, nickname }: BadgeLoginPopupProps) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [newBadges, setNewBadges] = useState<BadgeDefinition[]>([]);
  const [nextBadges, setNextBadges] = useState<NextBadgeInfo[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
    const stored = localStorage.getItem(storageKey);
    const seenIds: string[] = stored ? (JSON.parse(stored) as string[]) : [];
    const isFirst = stored === null;

    const earnedBadges = getEarnedBadges(userStats);
    const earnedIds = earnedBadges.map((b) => b.id);
    const unseenBadges = earnedBadges.filter((b) => !seenIds.includes(b.id));
    const computed = getNextBadges(userStats);

    if (isFirst && earnedBadges.length === 0) {
      // 初回かつバッジゼロ → オンボーディング表示
      setIsFirstVisit(true);
      setNextBadges(computed);
      setVisible(true);
    } else if (unseenBadges.length > 0) {
      // 新バッジあり → 祝福表示
      setNewBadges(unseenBadges);
      setNextBadges(computed);
      setVisible(true);
    } else if (isFirst && earnedBadges.length > 0) {
      // 初回かつバッジあり → 全取得済みバッジを祝福表示
      setNewBadges(earnedBadges);
      setNextBadges(computed);
      setVisible(true);
    }
    // 2回目以降かつ新バッジなし → 表示しない

    // 現在の取得済みバッジIDを記録（次回比較用）
    if (isFirst || unseenBadges.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(earnedIds));
    }
  }, [userId, userStats]);

  const handleClose = () => {
    setVisible(false);
  };

  const handleAction = (path: string) => {
    handleClose();
    navigate(path);
  };

  if (!visible) return null;

  const isCelebration = newBadges.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleClose}
    >
      <div
        className="relative bg-base dark:bg-surface-dark border border-gold/30 w-full max-w-lg mx-4 p-8 shadow-xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors"
          aria-label="閉じる"
        >
          <Icon name="close" size="md" />
        </button>

        {/* ヘッダー */}
        <div className="text-center mb-6">
          {isCelebration ? (
            <>
              <p className="text-2xl mb-1">🎉</p>
              <h2 className="text-xl font-serif font-light tracking-ryokan text-gold">
                バッジを獲得しました！
              </h2>
              <p className="text-sm text-text-secondary dark:text-text-dark-muted mt-1 font-light">
                {nickname}さん、おめでとうございます
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl mb-1">🏅</p>
              <h2 className="text-xl font-serif font-light tracking-ryokan text-gold">
                バッジを集めよう！
              </h2>
              <p className="text-sm text-text-secondary dark:text-text-dark-muted mt-1 font-light">
                活動するとバッジが増えていきます
              </p>
            </>
          )}
        </div>

        {/* 新バッジ一覧（祝福時のみ） */}
        {isCelebration && (
          <div className="space-y-3 mb-6">
            {newBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-start gap-4 p-4 bg-gold/5 border border-gold/20"
              >
                <div className="w-10 h-10 bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <Icon name={badge.icon} size="md" className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-light text-gold">{badge.name}</p>
                  <p className="text-xs text-text-secondary dark:text-text-dark-muted font-light mt-0.5">
                    {badge.description}
                  </p>
                  <p className="text-xs text-gold/80 font-light mt-1">✨ 特典: {badge.perk}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* セパレーター */}
        {nextBadges.length > 0 && (
          <>
            {isCelebration && (
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-border-light dark:bg-border-dark" />
                <span className="text-xs text-text-secondary dark:text-text-dark-muted font-light whitespace-nowrap">
                  次のバッジに挑戦しよう
                </span>
                <div className="flex-1 h-px bg-border-light dark:bg-border-dark" />
              </div>
            )}

            {/* 次バッジカード */}
            <div className="space-y-3">
              {nextBadges.map(({ badge, currentValue, threshold }) => {
                const pct = Math.min(Math.round((currentValue / threshold) * 100), 100);
                const action = ACTION_MAP[badge.id];
                return (
                  <div
                    key={badge.id}
                    className="p-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon name={badge.icon} size="sm" className="text-text-secondary dark:text-text-dark-muted" />
                      <span className="text-sm font-light text-text-primary dark:text-text-dark-primary">
                        {badge.name}
                      </span>
                      <span className="ml-auto text-xs text-text-secondary dark:text-text-dark-muted font-light">
                        {currentValue} / {threshold}
                      </span>
                    </div>
                    {/* 進捗バー */}
                    <div className="h-1.5 bg-border-light dark:bg-border-dark rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gold transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-secondary dark:text-text-dark-muted font-light mb-3">
                      {badge.description}
                    </p>
                    {action && (
                      <button
                        onClick={() => handleAction(action.path)}
                        className="w-full py-2 border border-gold/40 text-gold text-sm font-light hover:bg-gold/10 transition-all duration-base ease-elegant"
                      >
                        {action.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 閉じるリンク */}
        <div className="text-center mt-6">
          <button
            onClick={handleClose}
            className="text-xs text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors font-light"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: TypeScript エラーがないか確認**

Run: `cd /mnt/c/Users/masat/AllApps/Connect40/frontend && npx tsc --noEmit 2>&1 | head -30`
Expected: エラーなし（0件）

**Step 3: コミット**

```bash
git add frontend/src/components/badges/BadgeLoginPopup.tsx
git commit -m "feat: add BadgeLoginPopup component with celebration and onboarding modes"
```

---

### Task 2: Dashboard.tsx に BadgeLoginPopup をマウント

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`

**Step 1: import を追加し、ローディング完了後にポップアップをマウントする**

`Dashboard.tsx` の先頭 import 群（`BadgeGrid` の下）に追記:

```tsx
import { BadgeLoginPopup } from '../components/badges/BadgeLoginPopup';
```

JSX の `<Layout isAuthenticated={true}>` の直後（`<div className="container mx-auto...">` の前）に追加:

```tsx
{!isLoading && userId && (
  <BadgeLoginPopup
    userStats={userStats}
    userId={userId}
    nickname={nickname ?? ''}
  />
)}
```

つまり変更後の JSX は:

```tsx
return (
  <Layout isAuthenticated={true}>
    {!isLoading && userId && (
      <BadgeLoginPopup
        userStats={userStats}
        userId={userId}
        nickname={nickname ?? ''}
      />
    )}
    <div className="container mx-auto px-4 py-20">
      {/* ...既存コンテンツ... */}
    </div>
  </Layout>
);
```

**Step 2: TypeScript エラーがないか確認**

Run: `cd /mnt/c/Users/masat/AllApps/Connect40/frontend && npx tsc --noEmit 2>&1 | head -30`
Expected: エラーなし（0件）

**Step 3: コミット**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: mount BadgeLoginPopup on Dashboard after data loads"
```

---

### Task 3: ビルド & デプロイ

**Step 1: フロントエンドをビルド**

Run: `cd /mnt/c/Users/masat/AllApps/Connect40/frontend && npm run build 2>&1 | tail -20`
Expected: `dist/` が生成される（エラーなし）

**Step 2: S3 にアップロード**

Run:
```bash
aws s3 sync /mnt/c/Users/masat/AllApps/Connect40/frontend/dist/ s3://connect40-frontend-dev-863646532781 --delete
```
Expected: upload 完了メッセージ

**Step 3: CloudFront キャッシュ無効化**

Run:
```bash
aws cloudfront create-invalidation --distribution-id E356KF1HDDL8LL --paths "/*"
```
Expected: Invalidation が作成される

**Step 4: 動作確認（手動）**

1. https://d2s0k9gtsxu3ev.cloudfront.net/dashboard を開く
2. ダッシュボードが表示された直後にポップアップが出ること
3. 次バッジカードの進捗バー・アクションボタンが正常に表示されること
4. 「閉じる」ボタンでモーダルが閉じること
5. ページリロード後はポップアップが再表示されないこと（localStorage に記録済み）

**Step 5: コミット（ビルド成果物は含めない）**

ビルド成果物はすでにデプロイ済みのため、コミット不要。

---

## 実装チェックリスト

- [ ] Task 1: `BadgeLoginPopup.tsx` 作成
- [ ] Task 2: `Dashboard.tsx` にマウント
- [ ] Task 3: ビルド & デプロイ & 動作確認

## 仕様まとめ（設計ドキュメントより）

| 状況 | 表示内容 |
|---|---|
| 初回（localStorage未記録）＋バッジゼロ | オンボーディング「バッジを集めよう！」＋次バッジ提案 |
| 初回（localStorage未記録）＋バッジあり | 全取得済みバッジ祝福＋次バッジ提案 |
| 2回目以降＋新バッジあり | 新バッジのみ祝福＋次バッジ提案 |
| 2回目以降＋新バッジなし | 表示しない |

- localStorage キー: `connect40_seen_badges_{userId}`
- 次バッジ選出: 達成率（現在値÷必要値）降順、veteran は最後尾、上位2〜3件

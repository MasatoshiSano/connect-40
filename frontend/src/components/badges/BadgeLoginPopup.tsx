import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import {
  BADGES,
  getEarnedBadges,
  type BadgeDefinition,
  type UserStats,
} from '../../constants/badges';

interface BadgeLoginPopupProps {
  userStats: UserStats;
  userId: string;
  nickname: string;
}

const STAT_KEY_MAP: Record<string, keyof UserStats> = {
  activities_joined: 'activitiesJoined',
  activities_hosted: 'activitiesHosted',
  total_participants: 'totalParticipants',
  reviews_written: 'reviewsWritten',
  chat_rooms: 'chatRooms',
  days_since_registration: 'daysSinceRegistration',
};

const ACTION_MAP: Record<string, { label: string; path: string } | null> = {
  first_join: { label: 'アクティビティを探す', path: '/activities' },
  regular: { label: 'アクティビティを探す', path: '/activities' },
  first_host: { label: 'アクティビティを作成', path: '/activities/create' },
  popular_host: { label: 'アクティビティを作成', path: '/activities/create' },
  reviewer: { label: 'レビューを書く', path: '/activities' },
  social: { label: 'チャットを始める', path: '/chat' },
  veteran: null,
};

type DisplayPattern = 'celebration' | 'onboarding' | 'none';

interface BadgeProgress {
  badge: BadgeDefinition;
  current: number;
  threshold: number;
  ratio: number;
}

const parseCondition = (condition: string): { key: string; threshold: number } | null => {
  const match = condition.match(/^(\w+)\s*>=\s*(\d+)$/);
  if (!match) return null;
  return { key: match[1], threshold: Number(match[2]) };
};

const getNextBadges = (stats: UserStats, earnedIds: Set<string>): BadgeProgress[] => {
  const unearnedBadges = BADGES.filter((b) => !earnedIds.has(b.id));

  const withProgress: BadgeProgress[] = unearnedBadges.map((badge) => {
    const parsed = parseCondition(badge.condition);
    if (!parsed) return { badge, current: 0, threshold: 1, ratio: 0 };

    const statKey = STAT_KEY_MAP[parsed.key];
    const current = statKey !== undefined ? stats[statKey] : 0;
    const ratio = Math.min(current / parsed.threshold, 0.99);

    return { badge, current, threshold: parsed.threshold, ratio };
  });

  // veteran は最後尾、それ以外は進捗率の高い順
  const nonVeteran = withProgress
    .filter((p) => p.badge.id !== 'veteran')
    .sort((a, b) => b.ratio - a.ratio);
  const veteran = withProgress.filter((p) => p.badge.id === 'veteran');

  return [...nonVeteran, ...veteran].slice(0, 3);
};

const NextBadgeCard = ({
  progress,
  onClose,
}: {
  progress: BadgeProgress;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const action = ACTION_MAP[progress.badge.id];
  const percent = Math.round(progress.ratio * 100);

  return (
    <div className="p-4 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 flex items-center justify-center bg-gold/10">
          <Icon name={progress.badge.icon} size="sm" className="text-gold/60" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-light text-text-primary dark:text-text-dark-primary">
            {progress.badge.name}
          </p>
          <p className="text-xs text-text-secondary dark:text-text-dark-muted font-light">
            {progress.badge.description}
          </p>
        </div>
      </div>
      <div className="mb-1">
        <div className="flex justify-between text-xs text-text-secondary dark:text-text-dark-muted mb-1 font-light">
          <span>
            {progress.current} / {progress.threshold}
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-1 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      {action && (
        <button
          onClick={() => {
            onClose();
            navigate(action.path);
          }}
          className="mt-2 w-full py-1.5 text-xs border border-gold/40 text-gold hover:bg-gold/5 transition-colors duration-base font-light"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

const EarnedBadgeCard = ({ badge }: { badge: BadgeDefinition }) => (
  <div className="flex items-start gap-3 p-4 bg-gold/5 border border-gold/20">
    <div className="w-10 h-10 flex items-center justify-center bg-gold/10 shrink-0">
      <Icon name={badge.icon} size="md" className="text-gold" />
    </div>
    <div>
      <p className="text-sm font-light text-gold">{badge.name}</p>
      <p className="text-xs text-text-secondary dark:text-text-dark-muted font-light mt-0.5">
        {badge.description}
      </p>
      <p className="text-xs text-gold/70 font-light mt-1">特典: {badge.perk}</p>
    </div>
  </div>
);

export const BadgeLoginPopup = ({ userStats, userId, nickname }: BadgeLoginPopupProps) => {
  const storageKey = `connect40_seen_badges_${userId}`;

  const [visible, setVisible] = useState(false);
  const [pattern, setPattern] = useState<DisplayPattern>('none');
  const [newBadges, setNewBadges] = useState<BadgeDefinition[]>([]);
  const [nextBadges, setNextBadges] = useState<BadgeProgress[]>([]);

  useEffect(() => {
    if (visible) return;  // すでに表示済みなら再実行しない

    const earned = getEarnedBadges(userStats);
    const earnedIds = new Set(earned.map((b) => b.id));
    const raw = localStorage.getItem(storageKey);

    let resolvedPattern: DisplayPattern = 'none';
    let resolvedNewBadges: BadgeDefinition[] = [];

    if (raw === null) {
      // 初回訪問
      if (earned.length === 0) {
        resolvedPattern = 'onboarding';
      } else {
        resolvedPattern = 'celebration';
        resolvedNewBadges = earned;
      }
    } else {
      // 2回目以降
      let seenIds: string[] = [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          seenIds = (parsed as string[]).filter((item) => typeof item === 'string');
        }
      } catch {
        // 不正なデータは無視し、初回訪問として扱う
      }
      const seenSet = new Set(seenIds);
      const freshBadges = earned.filter((b) => !seenSet.has(b.id));
      if (freshBadges.length > 0) {
        resolvedPattern = 'celebration';
        resolvedNewBadges = freshBadges;
      }
    }

    if (resolvedPattern !== 'none') {
      // localStorageを現在取得済みバッジで更新
      localStorage.setItem(storageKey, JSON.stringify([...earnedIds]));
      setPattern(resolvedPattern);
      setNewBadges(resolvedNewBadges);
      setNextBadges(getNextBadges(userStats, earnedIds));
      setVisible(true);
    }
  }, [userId, userStats]);

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible || pattern === 'none') {
    return null;
  }

  const isCelebration = pattern === 'celebration';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-surface-light dark:bg-surface-dark border border-gold/30 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors duration-base"
          aria-label="閉じる"
        >
          <Icon name="close" size="md" />
        </button>

        <div className="p-8">
          {/* ヘッダー */}
          <div className="text-center mb-6">
            <div className="text-3xl mb-3">{isCelebration ? '🎉' : '🏅'}</div>
            <h2 className="text-xl font-serif font-light tracking-ryokan text-gold mb-2">
              {isCelebration ? 'バッジを獲得しました！' : 'バッジを集めよう！'}
            </h2>
            <p className="text-sm text-text-secondary dark:text-text-dark-muted font-light">
              {isCelebration
                ? `${nickname}さん、おめでとうございます`
                : '活動するとバッジが増えていきます'}
            </p>
          </div>

          {/* 新バッジ一覧（祝福パターンのみ） */}
          {isCelebration && newBadges.length > 0 && (
            <div className="space-y-3 mb-6">
              {newBadges.map((badge) => (
                <EarnedBadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          )}

          {/* セパレーター（祝福パターンのみ） */}
          {isCelebration && nextBadges.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border-light dark:bg-border-dark" />
              <span className="text-xs text-text-secondary dark:text-text-dark-muted font-light whitespace-nowrap">
                次のバッジに挑戦しよう
              </span>
              <div className="flex-1 h-px bg-border-light dark:bg-border-dark" />
            </div>
          )}

          {/* 次バッジ候補 */}
          {nextBadges.length > 0 && (
            <div className="space-y-3 mb-6">
              {nextBadges.map((progress) => (
                <NextBadgeCard
                  key={progress.badge.id}
                  progress={progress}
                  onClose={handleClose}
                />
              ))}
            </div>
          )}

          {/* 閉じるボタン（下部） */}
          <div className="text-center">
            <button
              onClick={handleClose}
              className="text-sm text-text-secondary dark:text-text-dark-muted hover:text-gold transition-colors duration-base font-light underline underline-offset-4"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

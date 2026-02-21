import { BadgeCard } from './BadgeCard';
import { BADGES, getEarnedBadges } from '../../constants/badges';
import type { UserStats } from '../../constants/badges';

interface BadgeGridProps {
  stats: UserStats;
}

export const BadgeGrid = ({ stats }: BadgeGridProps) => {
  const earnedBadges = getEarnedBadges(stats);
  const earnedIds = new Set(earnedBadges.map((b) => b.id));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {BADGES.map((badge) => (
        <BadgeCard
          key={badge.id}
          badge={badge}
          earned={earnedIds.has(badge.id)}
        />
      ))}
    </div>
  );
};

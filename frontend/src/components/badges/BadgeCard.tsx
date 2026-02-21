import { Icon } from '../ui/Icon';
import type { BadgeDefinition } from '../../constants/badges';

interface BadgeCardProps {
  badge: BadgeDefinition;
  earned: boolean;
}

export const BadgeCard = ({ badge, earned }: BadgeCardProps) => {
  return (
    <div
      className={`flex flex-col items-center p-4 border transition-colors duration-base ${
        earned
          ? 'border-gold/30 bg-gold/5'
          : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark opacity-50'
      }`}
    >
      <div
        className={`w-12 h-12 flex items-center justify-center mb-2 ${
          earned ? 'bg-gold/10' : 'bg-base'
        }`}
      >
        <Icon
          name={badge.icon}
          size="lg"
          className={earned ? 'text-gold' : 'text-text-secondary dark:text-text-dark-muted'}
        />
      </div>
      <p
        className={`text-sm font-light text-center ${
          earned ? 'text-gold' : 'text-text-secondary dark:text-text-dark-muted'
        }`}
      >
        {badge.name}
      </p>
      <p className="text-xs text-text-secondary dark:text-text-dark-muted text-center mt-1 font-light">
        {badge.description}
      </p>
    </div>
  );
};

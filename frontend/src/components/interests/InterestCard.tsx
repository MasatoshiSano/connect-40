import { memo } from 'react';
import { Icon } from '../ui/Icon';

interface InterestCardProps {
  interest: string;
  photoUrl?: string;
  isSelected?: boolean;
  onToggle?: (interest: string) => void;
  showCheckmark?: boolean;
  compact?: boolean;
}

export const InterestCard = memo(({
  interest,
  photoUrl,
  isSelected,
  onToggle,
  showCheckmark = true,
  compact = false,
}: InterestCardProps) => {
  const handleClick = () => {
    onToggle?.(interest);
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-gold/20 text-gold text-sm">
        {photoUrl && (
          <img
            src={photoUrl}
            alt=""
            className="w-5 h-5 object-cover rounded-full flex-shrink-0"
            loading="lazy"
          />
        )}
        <span>{interest}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        group relative overflow-hidden transition-all duration-base w-[140px]
        ${isSelected
          ? 'ring-2 ring-gold shadow-lg'
          : 'ring-1 ring-border-light dark:ring-border-dark hover:ring-gold/40'
        }
      `}
    >
      <div className="relative h-20 bg-elevated-light dark:bg-elevated-dark overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gold/5">
            <Icon name="image" size="md" className="text-text-muted dark:text-text-dark-muted" />
          </div>
        )}
        <div className={`absolute inset-0 ${isSelected ? 'bg-gold/30' : 'bg-black/20 group-hover:bg-black/10'} transition-colors`} />
        {showCheckmark && isSelected && (
          <div className="absolute top-1 right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
            <Icon name="check" size="sm" className="text-base !text-[12px]" />
          </div>
        )}
      </div>
      <div className={`px-2 py-1.5 text-center ${isSelected ? 'bg-gold/10' : 'bg-surface-light dark:bg-surface-dark'}`}>
        <span className={`text-xs font-light ${isSelected ? 'text-gold' : 'text-text-primary dark:text-text-dark-primary'}`}>
          {interest}
        </span>
      </div>
    </button>
  );
});

InterestCard.displayName = 'InterestCard';

import { useState } from 'react';
import { Icon } from './Icon';
import { refineText, getUserProfile } from '../../services/api';

interface RefineButtonProps {
  text: string;
  type: 'activity' | 'bio';
  onRefined: (refinedText: string) => void;
}

export const RefineButton = ({ text, type, onRefined }: RefineButtonProps) => {
  const [isRefining, setIsRefining] = useState(false);

  const handleRefine = async () => {
    if (!text || isRefining) return;
    setIsRefining(true);
    try {
      const profile = await getUserProfile();
      const userContext = {
        nickname: profile.nickname,
        age: profile.age,
        interests: profile.interests,
        location: profile.location?.address,
      };
      const refined = await refineText(text, type, userContext);
      onRefined(refined);
    } catch (error) {
      console.error('Refine failed:', error);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRefine}
      disabled={isRefining || !text}
      className="text-sm text-gold border border-gold/40 hover:border-gold hover:bg-gold/5 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1 transition-all duration-base flex items-center gap-1"
    >
      {isRefining ? (
        <Icon name="sync" size="sm" className="animate-spin" />
      ) : (
        <Icon name="auto_fix_high" size="sm" />
      )}
      AIで推敲
    </button>
  );
};

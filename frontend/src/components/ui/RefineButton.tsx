import { useState } from 'react';
import { Icon } from './Icon';
import { refineText, getUserProfile } from '../../services/api';

interface RefineButtonProps {
  text: string;
  type: 'activity' | 'bio';
  title?: string;
  onRefined: (refinedText: string) => void;
}

export const RefineButton = ({ text, type, title, onRefined }: RefineButtonProps) => {
  const [isRefining, setIsRefining] = useState(false);
  const [proposal, setProposal] = useState<string | null>(null);

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
      const refined = await refineText(text, type, userContext, title);
      setProposal(refined);
    } catch (error) {
      console.error('Refine failed:', error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleAccept = () => {
    if (proposal) {
      onRefined(proposal);
      setProposal(null);
    }
  };

  const handleRetry = () => {
    setProposal(null);
    handleRefine();
  };

  const handleCancel = () => {
    setProposal(null);
  };

  return (
    <div className="w-full">
      {!proposal && (
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
          {isRefining ? 'AI整え中...' : 'AIで文章を整える'}
        </button>
      )}

      {proposal && (
        <div className="mt-2 border border-gold/30 bg-gold/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="auto_fix_high" size="sm" className="text-gold" />
            <p className="text-xs font-medium text-gold uppercase tracking-ryokan-wide">AIが整えた文章</p>
          </div>
          <p className="text-sm text-text-primary dark:text-text-dark-primary whitespace-pre-wrap mb-4 leading-relaxed">
            {proposal}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="px-4 py-1.5 border border-gold text-gold text-sm hover:bg-gold/10 transition-all duration-base flex items-center gap-1"
            >
              <Icon name="check" size="sm" />
              採用する
            </button>
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRefining}
              className="px-4 py-1.5 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary text-sm hover:border-gold/40 transition-all duration-base flex items-center gap-1 disabled:opacity-40"
            >
              {isRefining ? (
                <Icon name="sync" size="sm" className="animate-spin" />
              ) : (
                <Icon name="refresh" size="sm" />
              )}
              やり直し
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 border border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary text-sm hover:border-red-400/40 hover:text-red-400 transition-all duration-base flex items-center gap-1"
            >
              <Icon name="close" size="sm" />
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

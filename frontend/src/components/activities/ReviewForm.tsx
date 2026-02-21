import { useState } from 'react';
import { Icon } from '../ui/Icon';

interface ReviewFormProps {
  activityId: string;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

export const ReviewForm = ({ activityId: _activityId, onSubmit }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('評価を選択してください');
      return;
    }
    if (!comment.trim()) {
      setError('コメントを入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(rating, comment.trim());
      setRating(0);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'レビューの投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-muted uppercase mb-2">
          評価
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-2xl transition-colors duration-150"
            >
              <span className={star <= displayRating ? 'text-gold' : 'text-border-light dark:text-border-dark'}>
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs tracking-ryokan-wide text-text-secondary dark:text-text-dark-muted uppercase mb-2">
          コメント
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="アクティビティの感想を書いてください"
          className="w-full px-4 py-3 border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0 bg-transparent focus:outline-none focus:border-b-gold text-text-primary dark:text-text-dark-primary resize-none"
        />
        <p className={`text-xs mt-1 ${comment.length > 500 ? 'text-red-500' : 'text-text-secondary dark:text-text-dark-muted'}`}>
          {comment.length} / 500
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2">
          <Icon name="error" size="sm" className="text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full py-3 border border-gold text-gold hover:bg-gold/10 transition-all duration-base ease-elegant font-light flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Icon name="sync" size="sm" className="animate-spin" />
            投稿中...
          </>
        ) : (
          <>
            <Icon name="rate_review" size="sm" />
            レビューを投稿
          </>
        )}
      </button>
    </form>
  );
};

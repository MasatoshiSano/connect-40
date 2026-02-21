import { Icon } from '../ui/Icon';
import type { Review } from '../../types/activity';

interface ReviewListProps {
  reviews: Review[];
  isLoading: boolean;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={star <= rating ? 'text-gold' : 'text-border-light dark:text-border-dark'}
      >
        ★
      </span>
    ))}
  </div>
);

export const ReviewList = ({ reviews, isLoading }: ReviewListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon name="sync" className="text-gold animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon name="reviews" size="lg" className="text-text-secondary dark:text-text-dark-muted mx-auto mb-2" />
        <p className="text-sm text-text-secondary dark:text-text-dark-muted">まだレビューはありません</p>
      </div>
    );
  }

  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-4">
      {/* Average Rating */}
      <div className="flex items-center gap-3 pb-4 border-b border-border-light dark:border-border-dark">
        <span className="text-2xl font-serif font-light text-gold">
          {averageRating.toFixed(1)}
        </span>
        <div>
          <StarRating rating={Math.round(averageRating)} />
          <p className="text-xs text-text-secondary dark:text-text-dark-muted mt-0.5">
            {reviews.length}件のレビュー
          </p>
        </div>
      </div>

      {/* Review Items */}
      {reviews.map((review) => {
        const date = new Date(review.createdAt).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        return (
          <div
            key={review.reviewId}
            className="py-4 border-b border-border-light dark:border-border-dark last:border-b-0"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gold/10 flex items-center justify-center">
                  <Icon name="person" size="sm" className="text-gold" />
                </div>
                <span className="text-sm font-light text-text-primary dark:text-text-dark-primary">
                  {review.nickname}
                </span>
              </div>
              <span className="text-xs text-text-secondary dark:text-text-dark-muted">{date}</span>
            </div>
            <StarRating rating={review.rating} />
            <p className="mt-2 text-sm text-text-secondary dark:text-text-dark-secondary whitespace-pre-wrap">
              {review.comment}
            </p>
          </div>
        );
      })}
    </div>
  );
};

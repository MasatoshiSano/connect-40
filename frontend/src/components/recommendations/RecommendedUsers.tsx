import { Icon } from '../ui/Icon';

interface RecommendedUser {
  userId: string;
  nickname: string;
  profilePhoto: string;
  interests: string[];
  matchScore: number;
}

interface RecommendedUsersProps {
  users: RecommendedUser[];
  isLoading: boolean;
}

export const RecommendedUsers = ({ users, isLoading }: RecommendedUsersProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon name="sync" size="lg" className="text-gold animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="people" className="text-gold" />
        <h2 className="text-xl font-light tracking-ryokan text-text-primary dark:text-text-dark-primary">
          おすすめユーザー
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {users.map((user) => (
          <div
            key={user.userId}
            className="flex-shrink-0 w-48 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 text-center"
          >
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.nickname}
                className="w-16 h-16 object-cover mx-auto mb-3"
              />
            ) : (
              <div className="w-16 h-16 bg-gold/10 flex items-center justify-center mx-auto mb-3">
                <Icon name="person" size="lg" className="text-gold" />
              </div>
            )}
            <h3 className="text-sm font-light text-text-primary dark:text-text-dark-primary mb-1">
              {user.nickname}
            </h3>
            <div className="flex items-center justify-center gap-1 text-xs text-gold mb-2">
              <Icon name="favorite" size="sm" />
              <span>{user.matchScore}個の共通の興味</span>
            </div>
            <div className="flex flex-wrap gap-1 justify-center">
              {user.interests.slice(0, 3).map((interest, idx) => (
                <span
                  key={idx}
                  className="text-xs border border-gold/20 text-text-secondary dark:text-text-dark-muted px-2 py-0.5"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

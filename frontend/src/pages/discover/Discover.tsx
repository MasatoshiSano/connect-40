import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { discoverUsers } from '../../services/api';
import { useAuthStore } from '../../stores/auth';

interface DiscoverUser {
  userId: string;
  nickname: string;
  age: number;
  bio: string;
  profilePhoto: string;
  interests: string[];
  matchScore: number;
  location?: { latitude: number; longitude: number; address: string };
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const Discover = () => {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const result = await discoverUsers();
        setUsers(result.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ユーザーの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [userId]);

  // Collect all unique interests from discovered users for filter tags
  const allInterests = Array.from(
    new Set(users.flatMap((u) => u.interests))
  ).sort();

  const handleNearbyToggle = () => {
    if (!nearbyEnabled) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setNearbyEnabled(true);
          setIsGettingLocation(false);
        },
        () => {
          setIsGettingLocation(false);
        }
      );
    } else {
      setNearbyEnabled(false);
    }
  };

  const filteredByInterest = selectedInterest
    ? users.filter((u) => u.interests.includes(selectedInterest))
    : users;

  const filteredUsers = nearbyEnabled && myLocation
    ? [...filteredByInterest].sort((a, b) => {
        const distA = a.location ? calcDistance(myLocation.latitude, myLocation.longitude, a.location.latitude, a.location.longitude) : 9999;
        const distB = b.location ? calcDistance(myLocation.latitude, myLocation.longitude, b.location.latitude, b.location.longitude) : 9999;
        return distA - distB;
      })
    : filteredByInterest;

  if (isLoading) {
    return (
      <Layout isAuthenticated={true}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Icon name="sync" size="xl" className="text-gold animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isAuthenticated={true}>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-ryokan mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-2">
              仲間を探す
            </h1>
            <p className="text-text-secondary dark:text-text-dark-secondary font-light">
              興味・関心が近いメンバーを見つけましょう
            </p>
          </div>

          {/* Interest filter tags */}
          {allInterests.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedInterest(null)}
                  className={`px-3 py-1.5 text-xs font-light border transition-colors duration-base ${
                    selectedInterest === null
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted hover:border-gold/50 hover:text-gold'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={handleNearbyToggle}
                  disabled={isGettingLocation}
                  className={`px-3 py-1.5 text-xs font-light border transition-colors duration-base ${
                    nearbyEnabled
                      ? 'bg-gold/10 border-gold/60 text-gold'
                      : 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted hover:border-gold/40'
                  }`}
                >
                  {isGettingLocation ? '取得中...' : (
                    <>
                      <Icon name="near_me" size="sm" className="inline-block align-text-bottom mr-1" />
                      近所を優先
                      {nearbyEnabled && <Icon name="check" size="sm" className="inline-block align-text-bottom ml-1" />}
                    </>
                  )}
                </button>
                {allInterests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() =>
                      setSelectedInterest(
                        selectedInterest === interest ? null : interest
                      )
                    }
                    className={`px-3 py-1.5 text-xs font-light border transition-colors duration-base ${
                      selectedInterest === interest
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted hover:border-gold/50 hover:text-gold'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-400 font-light">{error}</p>
            </div>
          )}

          {/* User grid */}
          {filteredUsers.length === 0 && !error ? (
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-12 text-center">
              <Icon name="person_search" size="xl" className="text-text-secondary dark:text-text-dark-muted mb-4 mx-auto" />
              <p className="text-text-secondary dark:text-text-dark-secondary font-light">
                {selectedInterest
                  ? 'この興味に一致するユーザーが見つかりません'
                  : 'まだ他のメンバーがいません'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <button
                  key={user.userId}
                  onClick={() => navigate(`/users/${user.userId}`)}
                  className="text-left bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-gold/30 transition-colors duration-base p-5 group"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="shrink-0 w-14 h-14 bg-base-50 dark:bg-base overflow-hidden">
                      {user.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt={user.nickname}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling;
                            if (fallback instanceof HTMLElement) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ display: user.profilePhoto ? 'none' : 'flex' }}
                      >
                        <Icon name="person" size="lg" className="text-text-secondary dark:text-text-dark-muted" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-text-primary dark:text-text-dark-primary font-light group-hover:text-gold transition-colors duration-base truncate">
                          {user.nickname}
                        </h3>
                        {user.age > 0 && (
                          <span className="text-xs text-text-secondary dark:text-text-dark-muted shrink-0">
                            {user.age}歳
                          </span>
                        )}
                      </div>
                      {user.bio && (
                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1 line-clamp-2 font-light">
                          {user.bio}
                        </p>
                      )}
                    </div>

                    {/* Match score */}
                    {user.matchScore > 0 && (
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-serif font-light text-gold">
                          {user.matchScore}%
                        </p>
                        <p className="text-[10px] text-text-secondary dark:text-text-dark-muted">一致</p>
                      </div>
                    )}
                  </div>

                  {/* Interests */}
                  {user.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {user.interests.slice(0, 5).map((interest) => (
                        <span
                          key={interest}
                          className={`px-2 py-0.5 text-[10px] font-light border ${
                            selectedInterest === interest
                              ? 'border-gold/50 text-gold bg-gold/5'
                              : 'border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-muted'
                          }`}
                        >
                          {interest}
                        </span>
                      ))}
                      {user.interests.length > 5 && (
                        <span className="text-[10px] text-text-secondary dark:text-text-dark-muted font-light">
                          +{user.interests.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

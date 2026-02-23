import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../services/api';

interface PremiumLimits {
  activitiesPerMonth: number;
  activeChats: number;
  photosPerActivity: number;
}

const FREE_LIMITS: PremiumLimits = {
  activitiesPerMonth: 5,
  activeChats: 3,
  photosPerActivity: 1,
};

const PREMIUM_LIMITS: PremiumLimits = {
  activitiesPerMonth: Infinity,
  activeChats: Infinity,
  photosPerActivity: Infinity,
};

export const usePremiumCheck = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { getUserProfile } = await import('../services/api');
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } catch (err) {
        console.error('Failed to load profile for premium check:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const isPremium = profile?.membershipTier === 'premium';
  const limits = isPremium ? PREMIUM_LIMITS : FREE_LIMITS;

  const canJoinActivity = useCallback(
    (currentJoinedCount: number): boolean => {
      if (isPremium) return true;
      return currentJoinedCount < limits.activitiesPerMonth;
    },
    [isPremium, limits.activitiesPerMonth]
  );

  const canCreateChat = useCallback(
    (currentChatCount: number): boolean => {
      if (isPremium) return true;
      return currentChatCount < limits.activeChats;
    },
    [isPremium, limits.activeChats]
  );

  const canUploadPhotos = useCallback(
    (currentPhotoCount: number): boolean => {
      if (isPremium) return true;
      return currentPhotoCount < limits.photosPerActivity;
    },
    [isPremium, limits.photosPerActivity]
  );

  return {
    isPremium,
    isLoading,
    membershipTier: profile?.membershipTier || 'free',
    limits,
    canJoinActivity,
    canCreateChat,
    canUploadPhotos,
  };
};

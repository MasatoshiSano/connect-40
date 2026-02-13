import { useAuthStore } from '../stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/dev';

/**
 * Make authenticated API request
 */
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      },
    }));
    throw new Error(error.error?.message || 'Request failed');
  }

  const data = await response.json();
  return data.data as T;
}

/**
 * Upload file to S3 (presigned URL)
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  // TODO: Implement S3 presigned URL upload
  // 1. Request presigned URL from backend
  // 2. Upload file to S3 using presigned URL
  // 3. Return S3 object URL

  // Placeholder: return data URL for now
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}

export interface CreateUserProfileInput {
  nickname: string;
  age: number;
  bio: string;
  interests: string[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  profilePhoto: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  nickname: string;
  age: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  profilePhoto: string;
  interests: string[];
  verificationStatus: 'pending' | 'approved' | 'rejected';
  membershipTier: 'free' | 'premium';
  createdAt: string;
  updatedAt: string;
}

/**
 * Create user profile
 */
export async function createUserProfile(
  input: CreateUserProfileInput
): Promise<UserProfile> {
  return fetchWithAuth<UserProfile>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  return fetchWithAuth<UserProfile>('/users/me', {
    method: 'GET',
  });
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  input: Partial<CreateUserProfileInput>
): Promise<UserProfile> {
  return fetchWithAuth<UserProfile>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

// Activity API

export interface CreateActivityInput {
  title: string;
  description: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dateTime: string;
  duration: number;
  maxParticipants: number;
  imageUrl?: string;
  tags: string[];
}

export interface Activity {
  activityId: string;
  hostUserId: string;
  hostNickname: string;
  title: string;
  description: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dateTime: string;
  duration: number;
  maxParticipants: number;
  currentParticipants: number;
  participants: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Upload activity image
 */
export async function uploadActivityImage(file: File): Promise<string> {
  // TODO: Implement S3 presigned URL upload
  return uploadProfilePhoto(file);
}

/**
 * Create activity
 */
export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  return fetchWithAuth<Activity>('/activities', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Get activities list
 */
export async function getActivities(params?: {
  category?: string;
  limit?: number;
}): Promise<{ activities: Activity[]; count: number }> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  return fetchWithAuth(`/activities${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

/**
 * Get single activity
 */
export async function getActivity(activityId: string): Promise<Activity> {
  return fetchWithAuth<Activity>(`/activities/${activityId}`, {
    method: 'GET',
  });
}

/**
 * Join activity
 */
export async function joinActivity(activityId: string): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`/activities/${activityId}/join`, {
    method: 'POST',
  });
}

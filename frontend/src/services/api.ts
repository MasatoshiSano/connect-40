import { useAuthStore } from '../stores/auth';
import { refreshSession } from './auth';
import type {
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityCategory,
  ActivityStatus,
  Location,
  Review,
} from '../types/activity';

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/dev';

// Re-export activity types for convenience
export type {
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityCategory,
  ActivityStatus,
  Location,
  Review,
};

/**
 * Make a single fetch request with the given token
 */
async function doFetch(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Make authenticated API request with automatic token refresh on 401
 */
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { idToken } = useAuthStore.getState();

  if (!idToken) {
    throw new Error('Not authenticated');
  }

  let response = await doFetch(endpoint, idToken, options);

  // On 401, attempt token refresh and retry once
  if (response.status === 401) {
    try {
      const newTokens = await refreshSession();
      useAuthStore.getState().setTokens({
        accessToken: newTokens.accessToken,
        idToken: newTokens.idToken,
        refreshToken: newTokens.refreshToken,
      });
      response = await doFetch(endpoint, newTokens.idToken, options);
    } catch {
      // Refresh failed — clear auth and redirect to login
      useAuthStore.getState().clearAuth();
      throw new Error('Session expired. Please log in again.');
    }
  }

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
  return uploadFile(file, 'profile');
}

/**
 * Upload activity image to S3
 */
export async function uploadActivityImage(file: File): Promise<string> {
  return uploadFile(file, 'activity');
}

/**
 * Generic file upload function using presigned URLs
 */
async function uploadFile(file: File, uploadType: 'profile' | 'activity'): Promise<string> {
  try {
    // Step 1: Get presigned URL from backend
    const response = await fetch(`${API_BASE_URL}/uploads/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${useAuthStore.getState().idToken}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        uploadType,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error?.message || 'Failed to get presigned URL');
    }

    const responseData = await response.json();
    const { presignedUrl, publicUrl } = responseData.data as { presignedUrl: string; publicUrl: string };

    // Step 2: Upload file to S3 using presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to S3');
    }

    // Step 3: Return the public URL
    return publicUrl;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
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
  bio?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  profilePhoto: string;
  interests: string[];
  verificationStatus: 'pending' | 'approved' | 'rejected';
  membershipTier: 'free' | 'premium';
  chatCredits?: number;
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

// Public Profile API

export interface PublicProfile {
  userId: string;
  nickname: string;
  age: number;
  bio: string;
  interests: string[];
  profilePhoto: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

/**
 * Get public profile for a user
 */
export async function getUserPublicProfile(userId: string): Promise<PublicProfile> {
  return fetchWithAuth<PublicProfile>(`/users/${userId}/profile`, {
    method: 'GET',
  });
}

/**
 * Block a user
 */
export async function blockUser(userId: string): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`/users/${userId}/block`, {
    method: 'POST',
  });
}

/**
 * Report a user
 */
export async function reportUser(
  reportedUserId: string,
  reason: string
): Promise<{ message: string; reportId: string }> {
  return fetchWithAuth<{ message: string; reportId: string }>('/reports', {
    method: 'POST',
    body: JSON.stringify({ reportedUserId, reason }),
  });
}

// Activity API

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
  radius?: number;
  latitude?: number;
  longitude?: number;
}): Promise<{ activities: Activity[]; count: number }> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.radius !== undefined) queryParams.append('radius', params.radius.toString());
  if (params?.latitude !== undefined) queryParams.append('latitude', params.latitude.toString());
  if (params?.longitude !== undefined) queryParams.append('longitude', params.longitude.toString());

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
export async function joinActivity(activityId: string): Promise<{ message: string; chatRoomId?: string }> {
  return fetchWithAuth<{ message: string; chatRoomId?: string }>(`/activities/${activityId}/join`, {
    method: 'POST',
  });
}

/**
 * Leave activity
 */
export async function leaveActivity(activityId: string): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`/activities/${activityId}/leave`, {
    method: 'POST',
  });
}

/**
 * Update activity
 */
export async function updateActivity(
  activityId: string,
  input: UpdateActivityInput
): Promise<Activity> {
  return fetchWithAuth<Activity>(`/activities/${activityId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/**
 * Create review for activity
 */
export async function createReview(
  activityId: string,
  rating: number,
  comment: string
): Promise<Review> {
  return fetchWithAuth<Review>(`/activities/${activityId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment }),
  });
}

/**
 * Get reviews for activity
 */
export async function getReviews(
  activityId: string
): Promise<{ reviews: Review[]; count: number }> {
  return fetchWithAuth<{ reviews: Review[]; count: number }>(
    `/activities/${activityId}/reviews`,
    { method: 'GET' }
  );
}

// Discovery API

interface DiscoverUserResponse {
  userId: string;
  nickname: string;
  age: number;
  bio: string;
  profilePhoto: string;
  interests: string[];
  matchScore: number;
  location?: { latitude: number; longitude: number; address: string };
}

/**
 * Discover users with similar interests
 */
export async function discoverUsers(params?: {
  radius?: number;
  latitude?: number;
  longitude?: number;
}): Promise<{ users: DiscoverUserResponse[] }> {
  const queryParams = new URLSearchParams();
  if (params?.radius !== undefined) queryParams.append('radius', params.radius.toString());
  if (params?.latitude !== undefined) queryParams.append('latitude', params.latitude.toString());
  if (params?.longitude !== undefined) queryParams.append('longitude', params.longitude.toString());

  const query = queryParams.toString();
  return fetchWithAuth<{ users: DiscoverUserResponse[] }>(
    `/users/discover${query ? `?${query}` : ''}`,
    { method: 'GET' }
  );
}

// Photo Gallery API

interface PhotoItem {
  photoId: string;
  activityId: string;
  userId: string;
  nickname: string;
  photoUrl: string;
  createdAt: string;
}

/**
 * Upload photo to activity gallery (returns presigned URL)
 */
export async function uploadActivityPhoto(
  activityId: string,
  fileName: string,
  contentType: string
): Promise<{ photoId: string; presignedUrl: string; photoUrl: string; expiresIn: number }> {
  return fetchWithAuth<{ photoId: string; presignedUrl: string; photoUrl: string; expiresIn: number }>(
    `/activities/${activityId}/photos`,
    {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType }),
    }
  );
}

/**
 * Get photos for an activity
 */
export async function getActivityPhotos(
  activityId: string
): Promise<{ photos: PhotoItem[]; count: number }> {
  return fetchWithAuth<{ photos: PhotoItem[]; count: number }>(
    `/activities/${activityId}/photos`,
    { method: 'GET' }
  );
}

// Verification types and API calls

export interface VerificationStatus {
  status: 'unverified' | 'payment_pending' | 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export async function getVerificationStatus(): Promise<VerificationStatus> {
  return fetchWithAuth<VerificationStatus>('/verification/status');
}

export async function createVerificationCheckout(data: {
  documentUrl: string;
  email: string;
}): Promise<{ sessionId: string; url: string }> {
  return fetchWithAuth<{ sessionId: string; url: string }>('/verification/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createActivityJoinCheckout(
  activityId: string,
  email: string
): Promise<{ sessionId: string; url: string }> {
  return fetchWithAuth<{ sessionId: string; url: string }>(
    `/activities/${activityId}/join-checkout`,
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    }
  );
}

// Recommendations API

interface RecommendedActivity {
  activityId: string;
  title: string;
  category: string;
  dateTime: string;
  location: { latitude: number; longitude: number; address: string };
  hostNickname: string;
  imageUrl?: string;
  tags: string[];
  currentParticipants: number;
  maxParticipants: number;
  score: number;
}

interface RecommendedUser {
  userId: string;
  nickname: string;
  profilePhoto: string;
  interests: string[];
  matchScore: number;
}

/**
 * Get personalized recommendations
 */
export async function getRecommendations(): Promise<{
  recommendedActivities: RecommendedActivity[];
  recommendedUsers: RecommendedUser[];
}> {
  return fetchWithAuth<{
    recommendedActivities: RecommendedActivity[];
    recommendedUsers: RecommendedUser[];
  }>('/recommendations', {
    method: 'GET',
  });
}

// Public Profile by userId (for chat sender display)

export async function getPublicProfile(userId: string): Promise<{
  userId: string;
  nickname: string;
  profilePhoto: string;
  age?: number;
  bio?: string;
  interests?: string[];
}> {
  return fetchWithAuth<{
    userId: string;
    nickname: string;
    profilePhoto: string;
    age?: number;
    bio?: string;
    interests?: string[];
  }>(`/users/${userId}/profile`);
}

// Chat API

export interface ChatRoomSummary {
  chatRoomId: string;
  name?: string;
  participantIds: string[];
  type: 'direct' | 'group';
  activityId?: string;
  lastMessageAt: string;
  lastMessage?: string;
  unreadCount?: number;
}

export interface ChatRoomDetail {
  chatRoomId: string;
  name?: string;
  participantIds: string[];
  type: 'direct' | 'group';
  activityId?: string;
  createdAt: string;
  messages: Array<{
    messageId: string;
    chatRoomId: string;
    senderId: string;
    content: string;
    messageType: 'user' | 'system';
    readBy: string[];
    createdAt: string;
    timestamp: number;
  }>;
}

export async function getChatRooms(): Promise<{ rooms: ChatRoomSummary[] }> {
  return fetchWithAuth<{ rooms: ChatRoomSummary[] }>('/chat/rooms');
}

export async function getChatRoom(chatRoomId: string): Promise<ChatRoomDetail> {
  return fetchWithAuth<ChatRoomDetail>(`/chat/rooms/${chatRoomId}`);
}

export async function markRoomAsRead(chatRoomId: string): Promise<void> {
  try {
    await fetchWithAuth(`/chat/rooms/${chatRoomId}/read`, { method: 'POST' });
  } catch {
    // エンドポイントが存在しない場合はサイレントに無視
  }
}

// AI Text Refinement API

/**
 * Refine text using AI (Bedrock Claude Haiku)
 */
export async function refineText(
  text: string,
  type: 'activity' | 'bio',
  userContext: { nickname: string; age: number; interests: string[]; location?: string },
  title?: string
): Promise<string> {
  const response = await fetchWithAuth<{ refinedText: string }>('/ai/refine', {
    method: 'POST',
    body: JSON.stringify({ text, type, mode: 'refine', title, userContext }),
  });
  return response.refinedText;
}

/**
 * Recommend category using AI based on title and description
 */
export async function recommendCategory(
  title: string,
  description?: string
): Promise<string> {
  const response = await fetchWithAuth<{ category: string }>('/ai/refine', {
    method: 'POST',
    body: JSON.stringify({ text: description ?? '', title, mode: 'category' }),
  });
  return response.category;
}

/**
 * Recommend content tags using AI based on title, description, and category
 */
export async function recommendTags(
  title: string,
  description: string,
  category: string
): Promise<string[]> {
  const response = await fetchWithAuth<{ tags: string[] }>('/ai/refine', {
    method: 'POST',
    body: JSON.stringify({ title, text: description, category, mode: 'tags' }),
  });
  return response.tags;
}

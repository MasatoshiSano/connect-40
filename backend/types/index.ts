// Common types for Connect40 backend

export interface User {
  userId: string;
  email: string;
  nickname: string;
  age: number;
  bio: string;
  location: Location;
  profilePhoto: string;
  interests: string[];
  verificationStatus: 'unverified' | 'pending' | 'approved' | 'rejected';
  membershipTier: 'free' | 'premium';
  chatCredits?: number;
  lastCreditDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export type Recurrence = 'none' | 'weekly' | 'biweekly' | 'monthly';

export interface Activity {
  activityId: string;
  hostUserId: string;
  hostNickname: string; // Denormalized for display
  title: string;
  description: string;
  category: 'sports' | 'outdoor' | 'hobby' | 'food' | 'culture' | 'business' | 'other';
  location: Location;
  dateTime: string; // ISO 8601
  duration: number; // minutes
  maxParticipants: number;
  currentParticipants: number;
  participants: string[]; // userIds
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  entryFee?: number; // 円単位, 0 or undefined = 無料
  recurrence?: Recurrence;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  reviewId: string;
  activityId: string;
  userId: string;
  nickname: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface ChatRoom {
  chatRoomId: string;
  participantIds: string[];
  type: 'group' | 'direct';
  activityId?: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface Message {
  messageId: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  readBy: string[];
  createdAt: string;
}

export interface Subscription {
  userId: string;
  stripeCustomerId: string;
  subscriptionId: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string;
}

export interface VerificationRecord {
  userId: string;
  documentUrl: string;
  paymentStatus: 'payment_pending' | 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  stripeSessionId?: string;
}

export interface Usage {
  userId: string;
  month: string; // YYYY-MM
  eventsJoined: number;
  chatsStarted: number;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

// Environment variables
export interface Env {
  TABLE_NAME: string;
  REGION: string;
  USER_POOL_ID: string;
  GOOGLE_MAPS_API_KEY: string;
  STRIPE_SECRET_KEY: string;
}

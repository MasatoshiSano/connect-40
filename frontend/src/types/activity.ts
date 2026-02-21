export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export type ActivityCategory = 'sports' | 'outdoor' | 'hobby' | 'food' | 'culture' | 'business' | 'other';

export type ActivityStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type Recurrence = 'none' | 'weekly' | 'biweekly' | 'monthly';

export interface Activity {
  activityId: string;
  hostUserId: string;
  hostNickname: string;
  title: string;
  description: string;
  category: ActivityCategory;
  location: Location;
  dateTime: string; // ISO 8601
  duration: number; // minutes
  maxParticipants: number;
  currentParticipants: number;
  participants: string[]; // userIds
  status: ActivityStatus;
  recurrence?: Recurrence;
  imageUrl?: string;
  tags: string[];
  entryFee?: number; // 円単位。0 または undefined = 無料
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityInput {
  title: string;
  description: string;
  category: ActivityCategory;
  location: Location;
  dateTime: string;
  duration: number;
  maxParticipants: number;
  recurrence?: Recurrence;
  imageUrl?: string;
  tags: string[];
  entryFee?: number;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string;
  category?: ActivityCategory;
  location?: Location;
  dateTime?: string;
  duration?: number;
  maxParticipants?: number;
  recurrence?: Recurrence;
  imageUrl?: string;
  tags?: string[];
  status?: ActivityStatus;
  entryFee?: number;
}

export interface Review {
  reviewId: string;
  activityId: string;
  userId: string;
  nickname: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ActivityFilter {
  category?: ActivityCategory;
  dateFrom?: string;
  dateTo?: string;
  maxDistance?: number; // km
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  tags?: string[];
  status?: ActivityStatus;
}

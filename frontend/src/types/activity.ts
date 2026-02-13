export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export type ActivityCategory = 'sports' | 'outdoor' | 'hobby' | 'food' | 'culture' | 'business' | 'other';

export type ActivityStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

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
  imageUrl?: string;
  tags: string[];
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
  imageUrl?: string;
  tags: string[];
}

export interface UpdateActivityInput {
  title?: string;
  description?: string;
  category?: ActivityCategory;
  location?: Location;
  dateTime?: string;
  duration?: number;
  maxParticipants?: number;
  imageUrl?: string;
  tags?: string[];
  status?: ActivityStatus;
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

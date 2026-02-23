import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';

const TABLE_NAME = process.env.TABLE_NAME!;

interface UserProfile {
  userId: string;
  nickname: string;
  age: number;
  bio: string;
  profilePhoto: string;
  interests: string[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface DiscoverUser {
  userId: string;
  nickname: string;
  age: number;
  bio: string;
  profilePhoto: string;
  interests: string[];
  location?: { latitude: number; longitude: number; address: string };
  matchScore: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
const calcDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateMatchScore = (
  userInterests: string[],
  otherInterests: string[]
): number => {
  if (userInterests.length === 0 && otherInterests.length === 0) return 0;

  const userSet = new Set(userInterests);
  const otherSet = new Set(otherInterests);
  const allUnique = new Set([...userInterests, ...otherInterests]);
  let sharedCount = 0;

  for (const interest of userSet) {
    if (otherSet.has(interest)) {
      sharedCount++;
    }
  }

  return allUnique.size > 0
    ? Math.round((sharedCount / allUnique.size) * 100)
    : 0;
};

/**
 * Discover users with similar interests
 * GET /users/discover
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    // Get current user's profile
    const currentUserResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      })
    );

    if (!currentUserResult.Item) {
      return errorResponse(404, 'PROFILE_NOT_FOUND', 'User profile not found');
    }

    const currentUser = currentUserResult.Item;
    const currentInterests = (currentUser.interests as string[]) || [];

    // Parse optional radius filter parameters
    const radiusParam = event.queryStringParameters?.radius;
    const latParam = event.queryStringParameters?.latitude;
    const lonParam = event.queryStringParameters?.longitude;

    const radiusKm = radiusParam ? parseFloat(radiusParam) : undefined;
    const filterLat = latParam ? parseFloat(latParam) : undefined;
    const filterLon = lonParam ? parseFloat(lonParam) : undefined;
    const hasLocationFilter =
      radiusKm !== undefined &&
      !isNaN(radiusKm) &&
      filterLat !== undefined &&
      !isNaN(filterLat) &&
      filterLon !== undefined &&
      !isNaN(filterLon);

    // Scan for other users (with filter to only get profiles)
    const scanResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'SK = :sk AND PK <> :currentUserPk AND nickname <> :adminNickname',
        ExpressionAttributeValues: {
          ':sk': 'PROFILE',
          ':currentUserPk': `USER#${userId}`,
          ':adminNickname': 'Connect40 運営',
        },
        Limit: 100,
      })
    );

    const users: DiscoverUser[] = (scanResult.Items || [])
      .map((item) => {
        const profile = item as unknown as UserProfile & { PK: string };
        const otherInterests = profile.interests || [];
        const matchScore = calculateMatchScore(currentInterests, otherInterests);

        return {
          userId: (item.PK as string).replace('USER#', ''),
          nickname: profile.nickname || 'ユーザー',
          age: profile.age || 0,
          bio: profile.bio || '',
          profilePhoto: profile.profilePhoto || '',
          interests: otherInterests,
          location: (item.location as DiscoverUser['location']) ?? undefined,
          matchScore,
        };
      })
      .filter((user) => {
        // Apply radius filter if location parameters are provided
        if (!hasLocationFilter) return true;
        if (!user.location) return false;
        const distance = calcDistanceKm(
          filterLat,
          filterLon,
          user.location.latitude,
          user.location.longitude
        );
        return distance <= radiusKm;
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);

    return successResponse({ users });
  } catch (error) {
    console.error('Discover users error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to discover users');
  }
};

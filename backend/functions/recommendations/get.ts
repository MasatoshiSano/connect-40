import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { GetCommand, QueryCommand, ScanCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';

const TABLE_NAME = process.env.TABLE_NAME!;

interface ScoredActivity {
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

interface ScoredUser {
  userId: string;
  nickname: string;
  profilePhoto: string;
  interests: string[];
  matchScore: number;
}

/**
 * Get AI-based recommendations
 * GET /recommendations
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    // Fetch current user profile
    const userResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
      })
    );

    if (!userResult.Item) {
      return errorResponse(404, 'NOT_FOUND', 'User profile not found');
    }

    const userProfile = userResult.Item;
    const userInterests = (userProfile.interests as string[]) || [];
    const userGeohash = (userProfile.geohash as string) || '';

    // Fetch user's past activity categories
    const userActivitiesResult = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'ACTIVITY#',
        },
      })
    );
    const pastActivityIds = (userActivitiesResult.Items || []).map(
      (item) => item.activityId as string
    );

    // Fetch upcoming activities (scan for simplicity with small dataset)
    const now = new Date().toISOString();
    const activitiesResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#type = :type AND #status = :status AND dateTime > :now',
        ExpressionAttributeNames: {
          '#type': 'Type',
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':type': 'Activity',
          ':status': 'upcoming',
          ':now': now,
        },
      })
    );

    const activities = activitiesResult.Items || [];

    // Batch-fetch past activity metadata to get categories (replaces N sequential GetCommands)
    const pastCategories = new Set<string>();
    const activityKeys = pastActivityIds.slice(0, 10).map((actId) => ({
      PK: `ACTIVITY#${actId}`,
      SK: 'METADATA',
    }));

    if (activityKeys.length > 0) {
      const batchResult = await ddbDocClient.send(
        new BatchGetCommand({
          RequestItems: {
            [TABLE_NAME]: { Keys: activityKeys },
          },
        })
      );
      for (const item of batchResult.Responses?.[TABLE_NAME] || []) {
        if (item.category) {
          pastCategories.add(item.category as string);
        }
      }
    }

    // Score activities
    const scoredActivities: ScoredActivity[] = activities
      .filter((act) => {
        // Exclude activities user is already in or hosting
        const participants = (act.participants as string[]) || [];
        return act.hostUserId !== userId && !participants.includes(userId);
      })
      .map((act) => {
        let score = 0;
        const actTags = (act.tags as string[]) || [];

        // +10 per matching interest tag
        for (const tag of actTags) {
          if (userInterests.some((interest) => interest.toLowerCase() === tag.toLowerCase())) {
            score += 10;
          }
        }

        // +5 for same category as past activities
        if (pastCategories.has(act.category as string)) {
          score += 5;
        }

        // +3 for proximity (same geohash prefix, 4 chars = ~39km)
        const actGeohash = (act.geohash as string) || '';
        if (userGeohash && actGeohash && userGeohash.substring(0, 4) === actGeohash.substring(0, 4)) {
          score += 3;
        }

        return {
          activityId: act.activityId as string,
          title: act.title as string,
          category: act.category as string,
          dateTime: act.dateTime as string,
          location: act.location as { latitude: number; longitude: number; address: string },
          hostNickname: act.hostNickname as string,
          imageUrl: act.imageUrl as string | undefined,
          tags: actTags,
          currentParticipants: act.currentParticipants as number,
          maxParticipants: act.maxParticipants as number,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Fetch users for recommendations (scan with limit)
    const usersResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#type = :type AND userId <> :userId',
        ExpressionAttributeNames: { '#type': 'Type' },
        ExpressionAttributeValues: {
          ':type': 'User',
          ':userId': userId,
        },
        Limit: 50,
      })
    );

    const users = usersResult.Items || [];

    // Score users by interest overlap
    const scoredUsers: ScoredUser[] = users
      .map((u) => {
        const otherInterests = (u.interests as string[]) || [];
        const matchCount = otherInterests.filter((interest) =>
          userInterests.some((ui) => ui.toLowerCase() === interest.toLowerCase())
        ).length;

        return {
          userId: u.userId as string,
          nickname: u.nickname as string,
          profilePhoto: u.profilePhoto as string,
          interests: otherInterests,
          matchScore: matchCount,
        };
      })
      .filter((u) => u.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return successResponse({
      recommendedActivities: scoredActivities,
      recommendedUsers: scoredUsers,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to get recommendations');
  }
};

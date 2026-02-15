import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse, encodeGeohash } from '../../layers/common/nodejs/utils';
import { v4 as uuidv4 } from 'uuid';
import type { Activity } from '../../types';
// import { checkActivityCreationLimit } from '../common/usageLimits'; // temporarily disabled for testing

const TABLE_NAME = process.env.TABLE_NAME!;

interface CreateActivityInput {
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

/**
 * Create activity
 * POST /activities
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Cognito Authorizer puts user info in claims
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      console.error('User ID not found in authorizer claims');
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const input: CreateActivityInput = JSON.parse(event.body || '{}');

    // Validate input
    if (!input.title || !input.description || !input.category || !input.location || !input.dateTime) {
      return errorResponse(400, 'INVALID_INPUT', 'Missing required fields');
    }

    // Validate future date
    if (new Date(input.dateTime) <= new Date()) {
      return errorResponse(400, 'INVALID_DATE', 'Activity date must be in the future');
    }

    // Get user profile for nickname
    const userResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      })
    );

    if (!userResult.Item) {
      return errorResponse(404, 'USER_NOT_FOUND', 'User profile not found');
    }

    // Check usage limits - temporarily disabled for testing
    // const subscriptionPlan = (userResult.Item.subscriptionPlan as 'free' | 'premium') || 'free';
    // const usageCheck = await checkActivityCreationLimit(
    //   ddbDocClient,
    //   TABLE_NAME,
    //   userId,
    //   subscriptionPlan
    // );

    // if (!usageCheck.allowed) {
    //   return errorResponse(
    //     403,
    //     'USAGE_LIMIT_EXCEEDED',
    //     `アクティビティ作成の上限に達しました。今月の作成数: ${usageCheck.current}/${usageCheck.limit}。プレミアムプランにアップグレードすると無制限に作成できます。`
    //   );
    // }

    const activityId = uuidv4();
    const now = new Date().toISOString();
    const geohash = encodeGeohash(input.location.latitude, input.location.longitude, 7);

    const activity: Activity = {
      activityId,
      hostUserId: userId,
      hostNickname: userResult.Item.nickname,
      title: input.title,
      description: input.description,
      category: input.category as any,
      location: input.location,
      dateTime: input.dateTime,
      duration: input.duration,
      maxParticipants: input.maxParticipants,
      currentParticipants: 0,
      participants: [],
      status: 'upcoming',
      imageUrl: input.imageUrl,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    // Store activity in DynamoDB
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
          GSI1PK: `CATEGORY#${input.category}`,
          GSI1SK: input.dateTime,
          GSI2PK: `LOCATION#${geohash}`,
          GSI2SK: input.dateTime,
          Type: 'Activity',
          ...activity,
          geohash,
        },
      })
    );

    // Store user activity index for usage tracking
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `ACTIVITY#${activityId}`,
          GSI1PK: `USERACTIVITIES#${userId}`,
          GSI1SK: now,
          Type: 'UserActivity',
          activityId,
          createdAt: now,
        },
      })
    );

    return successResponse(activity);
  } catch (error) {
    console.error('Create activity error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create activity');
  }
};

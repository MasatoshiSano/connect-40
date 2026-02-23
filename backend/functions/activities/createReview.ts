import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * Create a review for an activity
 * POST /activities/:id/reviews
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const activityId = event.pathParameters?.id;
    if (!activityId) {
      return errorResponse(400, 'INVALID_INPUT', 'Activity ID is required');
    }

    const input = JSON.parse(event.body || '{}');
    const { rating, comment } = input as { rating: number; comment: string };

    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return errorResponse(400, 'INVALID_INPUT', 'Rating must be an integer between 1 and 5');
    }

    if (!comment || comment.trim().length === 0) {
      return errorResponse(400, 'INVALID_INPUT', 'Comment is required');
    }

    if (comment.length > 500) {
      return errorResponse(400, 'INVALID_INPUT', 'Comment must be 500 characters or less');
    }

    // Get activity to verify it exists and is completed
    const activityResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
        },
      })
    );

    if (!activityResult.Item) {
      return errorResponse(404, 'NOT_FOUND', 'Activity not found');
    }

    const activity = activityResult.Item;

    // Verify user was a participant
    const participants = activity.participants as string[];
    const isHost = activity.hostUserId === userId;
    if (!participants.includes(userId) && !isHost) {
      return errorResponse(403, 'FORBIDDEN', 'Only participants can review this activity');
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

    const nickname = (userResult.Item?.nickname as string) || 'ユーザー';

    const reviewId = uuidv4();
    const now = new Date().toISOString();
    const timestamp = Date.now();

    const review = {
      reviewId,
      activityId,
      userId,
      nickname,
      rating,
      comment: comment.trim(),
      createdAt: now,
    };

    // Store review
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `ACTIVITY#${activityId}`,
          SK: `REVIEW#${timestamp}#${reviewId}`,
          Type: 'Review',
          ...review,
        },
      })
    );

    return successResponse(review);
  } catch (error) {
    console.error('Create review error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create review');
  }
};

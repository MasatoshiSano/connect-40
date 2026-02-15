import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * Join an activity
 * POST /activities/:id/join
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

    // Get activity
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

    // Validate
    if (activity.hostUserId === userId) {
      return errorResponse(400, 'INVALID_ACTION', 'Host cannot join their own activity');
    }

    if (activity.participants.includes(userId)) {
      return errorResponse(400, 'ALREADY_JOINED', 'Already joined this activity');
    }

    if (activity.currentParticipants >= activity.maxParticipants) {
      return errorResponse(400, 'ACTIVITY_FULL', 'Activity is full');
    }

    if (activity.status !== 'upcoming') {
      return errorResponse(400, 'INVALID_STATUS', 'Cannot join non-upcoming activity');
    }

    const now = new Date().toISOString();

    // Update activity participants
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
        },
        UpdateExpression: 'ADD currentParticipants :inc SET participants = list_append(participants, :userId), updatedAt = :now',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':userId': [userId],
          ':now': now,
        },
      })
    );

    // Create participant record for easier querying
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `ACTIVITY#${activityId}`,
          Type: 'Participation',
          activityId,
          userId,
          joinedAt: now,
        },
      })
    );

    return successResponse({ message: 'Successfully joined activity' });
  } catch (error) {
    console.error('Join activity error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to join activity');
  }
};

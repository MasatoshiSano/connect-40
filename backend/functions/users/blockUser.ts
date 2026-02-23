import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse, getCurrentTimestamp } from '../../layers/common/nodejs/utils';

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * Block a user
 * POST /users/{userId}/block
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const targetUserId = event.pathParameters?.userId;
    if (!targetUserId) {
      return errorResponse(400, 'BAD_REQUEST', 'Target user ID is required');
    }

    if (userId === targetUserId) {
      return errorResponse(400, 'BAD_REQUEST', 'Cannot block yourself');
    }

    // Verify target user exists
    const targetUser = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${targetUserId}`,
          SK: 'PROFILE',
        },
      })
    );

    if (!targetUser.Item) {
      return errorResponse(404, 'USER_NOT_FOUND', 'Target user not found');
    }

    const now = getCurrentTimestamp();

    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `BLOCK#${targetUserId}`,
          Type: 'BLOCK',
          blockerUserId: userId,
          blockedUserId: targetUserId,
          createdAt: now,
        },
      })
    );

    return successResponse({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Failed to block user'
    );
  }
};

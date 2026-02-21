import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * Mark all messages in a chat room as read for the current user
 * POST /chat/rooms/{chatRoomId}/read
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const chatRoomId = event.pathParameters?.chatRoomId;
    if (!chatRoomId) {
      return errorResponse(400, 'INVALID_INPUT', 'chatRoomId is required');
    }

    const now = new Date().toISOString();

    // Update the user's participation record with lastReadAt
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `CHATROOM#${chatRoomId}`,
        },
        UpdateExpression: 'SET lastReadAt = :now',
        ExpressionAttributeValues: {
          ':now': now,
        },
        ConditionExpression: 'attribute_exists(PK)',
      })
    );

    return successResponse({ lastReadAt: now });
  } catch (error: unknown) {
    // If participation record doesn't exist, ignore (user may not be a participant)
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return successResponse({ lastReadAt: new Date().toISOString() });
    }
    console.error('Mark room read error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to mark room as read');
  }
};

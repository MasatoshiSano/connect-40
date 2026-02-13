import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '/opt/nodejs/dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '/opt/nodejs/utils';

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * Get user's chat rooms
 * GET /chat/rooms
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    // Query user's chat participations
    const result = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'CHATROOM#',
        },
      })
    );

    const chatRooms = result.Items || [];

    return successResponse({ chatRooms, count: chatRooms.length });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve chat rooms');
  }
};

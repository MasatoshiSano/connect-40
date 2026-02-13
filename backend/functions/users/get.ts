import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '/opt/nodejs/dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '/opt/nodejs/utils';
import type { User } from '../../../types';

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * Get current user profile
 * GET /users/me
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get user ID from authorizer context
    const userId = event.requestContext.authorizer?.userId;

    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    // Get user from DynamoDB
    const result = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      })
    );

    if (!result.Item) {
      return errorResponse(404, 'USER_NOT_FOUND', 'User profile not found');
    }

    // Extract user data (remove DynamoDB keys)
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, Type, geohash, ...user } = result.Item;

    return successResponse(user as User);
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Failed to retrieve user profile'
    );
  }
};

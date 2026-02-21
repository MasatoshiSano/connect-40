import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import type { User } from '../../types';

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
    const userId = event.requestContext.authorizer?.claims?.sub;

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

    // Daily credit grant for free plan users
    const profile = result.Item;
    if (profile.membershipTier === 'free') {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = profile.lastCreditDate as string | undefined;

      if (lastDate !== today) {
        try {
          await ddbDocClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
            UpdateExpression: 'ADD chatCredits :credits SET lastCreditDate = :today',
            ExpressionAttributeValues: {
              ':credits': 3,
              ':today': today,
            },
          }));
          profile.chatCredits = ((profile.chatCredits as number) || 0) + 3;
          profile.lastCreditDate = today;
        } catch {
          // Ignore errors
        }
      }
    }

    // Extract user data (remove DynamoDB keys)
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, Type, geohash, ...user } = profile;

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

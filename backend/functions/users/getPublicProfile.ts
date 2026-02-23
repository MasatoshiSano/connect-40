import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * Get public profile for a specific user
 * GET /users/{userId}/profile
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const requesterId = event.requestContext.authorizer?.claims?.sub;
    if (!requesterId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const targetUserId = event.pathParameters?.userId;
    if (!targetUserId) {
      return errorResponse(400, 'BAD_REQUEST', 'User ID is required');
    }

    // Check if requester has blocked this user or vice versa
    const result = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${targetUserId}`,
          SK: 'PROFILE',
        },
      })
    );

    if (!result.Item) {
      return errorResponse(404, 'USER_NOT_FOUND', 'User profile not found');
    }

    // Return only public fields
    const publicProfile = {
      userId: result.Item.userId,
      nickname: result.Item.nickname,
      age: result.Item.age,
      bio: result.Item.bio || '',
      interests: result.Item.interests || [],
      profilePhoto: result.Item.profilePhoto || '',
      verificationStatus: result.Item.verificationStatus || 'pending',
      createdAt: result.Item.createdAt,
    };

    return successResponse(publicProfile);
  } catch (error) {
    console.error('Get public profile error:', error);
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Failed to retrieve user profile'
    );
  }
};

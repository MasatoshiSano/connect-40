import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import type { User } from '../../types';

const TABLE_NAME = process.env.TABLE_NAME!;

interface UpdateUserInput {
  nickname?: string;
  age?: number;
  bio?: string;
  interests?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  profilePhoto?: string;
}

/**
 * Update current user profile
 * PUT /users/me
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

    // Parse request body
    const input: UpdateUserInput = JSON.parse(event.body || '{}');

    if (Object.keys(input).length === 0) {
      return errorResponse(400, 'INVALID_INPUT', 'No fields to update');
    }

    // Validate nickname if provided
    if (input.nickname !== undefined && (typeof input.nickname !== 'string' || input.nickname.length < 1 || input.nickname.length > 50)) {
      return errorResponse(400, 'INVALID_INPUT', 'Nickname must be 1-50 characters');
    }

    // Validate bio if provided
    if (input.bio !== undefined && (typeof input.bio !== 'string' || input.bio.length > 1000)) {
      return errorResponse(400, 'INVALID_INPUT', 'Bio must be 1000 characters or less');
    }

    // Validate age if provided
    if (input.age !== undefined && (typeof input.age !== 'number' || input.age < 35 || input.age > 49)) {
      return errorResponse(400, 'INVALID_AGE', 'Age must be between 35 and 49');
    }

    // Validate interests if provided
    if (input.interests !== undefined && (!Array.isArray(input.interests) || input.interests.length < 3 || input.interests.length > 10)) {
      return errorResponse(400, 'INVALID_INTERESTS', 'Must select 3-10 interests');
    }

    // Validate location if provided
    if (input.location !== undefined) {
      if (typeof input.location.latitude !== 'number' || typeof input.location.longitude !== 'number' ||
          input.location.latitude < -90 || input.location.latitude > 90 ||
          input.location.longitude < -180 || input.location.longitude > 180) {
        return errorResponse(400, 'INVALID_INPUT', 'Invalid location coordinates');
      }
    }

    const now = new Date().toISOString();

    // Build update expression
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionAttributeValues: Record<string, unknown> = {
      ':updatedAt': now,
    };
    const expressionAttributeNames: Record<string, string> = {};

    if (input.nickname !== undefined) {
      updateExpressions.push('nickname = :nickname');
      expressionAttributeValues[':nickname'] = input.nickname;
    }

    if (input.age !== undefined) {
      updateExpressions.push('age = :age');
      expressionAttributeValues[':age'] = input.age;
    }

    if (input.bio !== undefined) {
      updateExpressions.push('bio = :bio');
      expressionAttributeValues[':bio'] = input.bio;
    }

    if (input.interests !== undefined) {
      updateExpressions.push('interests = :interests');
      expressionAttributeValues[':interests'] = input.interests;
    }

    if (input.profilePhoto !== undefined) {
      updateExpressions.push('profilePhoto = :profilePhoto');
      expressionAttributeValues[':profilePhoto'] = input.profilePhoto;
    }

    // Handle location update (requires geohash recalculation)
    if (input.location !== undefined) {
      const { encodeGeohash } = await import('../../layers/common/nodejs/utils');
      const geohash = encodeGeohash(input.location.latitude, input.location.longitude, 7);

      updateExpressions.push('#location = :location', 'geohash = :geohash', 'GSI2PK = :GSI2PK');
      expressionAttributeNames['#location'] = 'location';
      expressionAttributeValues[':location'] = input.location;
      expressionAttributeValues[':geohash'] = geohash;
      expressionAttributeValues[':GSI2PK'] = `LOCATION#${geohash}`;
    }

    // Update user in DynamoDB
    const result = await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ...(Object.keys(expressionAttributeNames).length > 0 && {
          ExpressionAttributeNames: expressionAttributeNames,
        }),
        ReturnValues: 'ALL_NEW',
      })
    );

    // Extract user data (remove DynamoDB keys)
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, Type, geohash, ...user } = result.Attributes!;

    return successResponse(user as User);
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Failed to update user profile'
    );
  }
};

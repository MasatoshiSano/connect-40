import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '../../types';

function isAdmin(claims: Record<string, string>): boolean {
  const groups = claims['cognito:groups'];
  if (!groups) return false;
  const groupList = Array.isArray(groups) ? groups : groups.split(',').map((g) => g.trim());
  return groupList.includes('admin');
}

const TABLE_NAME = process.env.TABLE_NAME!;

interface CreateUserInput {
  nickname: string;
  age: number;
  bio: string;
  interests: string[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  profilePhoto: string; // S3 URL after upload
}

/**
 * Create user profile
 * POST /users
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get user ID from authorizer context
    const userId = event.requestContext.authorizer?.claims?.sub;
    const email = event.requestContext.authorizer?.claims?.email;

    if (!userId || !email) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    // Parse request body
    const input: CreateUserInput = JSON.parse(event.body || '{}');

    // Validate input
    if (!input.nickname || !input.age || !input.bio || !input.interests || !input.location) {
      return errorResponse(400, 'INVALID_INPUT', 'Missing required fields');
    }

    // Validate string lengths to prevent abuse
    if (typeof input.nickname !== 'string' || input.nickname.length < 1 || input.nickname.length > 50) {
      return errorResponse(400, 'INVALID_INPUT', 'Nickname must be 1-50 characters');
    }

    if (typeof input.bio !== 'string' || input.bio.length > 1000) {
      return errorResponse(400, 'INVALID_INPUT', 'Bio must be 1000 characters or less');
    }

    const claims = (event.requestContext.authorizer?.claims ?? {}) as Record<string, string>;
    if (!isAdmin(claims) && (typeof input.age !== 'number' || input.age < 35 || input.age > 49)) {
      return errorResponse(400, 'INVALID_AGE', 'Age must be between 35 and 49');
    }

    if (!Array.isArray(input.interests) || input.interests.length < 3 || input.interests.length > 10) {
      return errorResponse(400, 'INVALID_INTERESTS', 'Must select 3-10 interests');
    }

    // Validate location coordinates
    if (typeof input.location.latitude !== 'number' || typeof input.location.longitude !== 'number' ||
        input.location.latitude < -90 || input.location.latitude > 90 ||
        input.location.longitude < -180 || input.location.longitude > 180) {
      return errorResponse(400, 'INVALID_INPUT', 'Invalid location coordinates');
    }

    // Calculate geohash for location indexing
    const { encodeGeohash } = await import('../../layers/common/nodejs/utils');
    const geohash = encodeGeohash(input.location.latitude, input.location.longitude, 7);

    const now = new Date().toISOString();

    // Create user object
    const user: User = {
      userId,
      email,
      nickname: input.nickname,
      age: input.age,
      bio: input.bio,
      location: input.location,
      profilePhoto: input.profilePhoto,
      interests: input.interests,
      verificationStatus: 'pending',
      membershipTier: 'free',
      createdAt: now,
      updatedAt: now,
    };

    // Store in DynamoDB
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
          GSI1PK: 'USERS',
          GSI1SK: now,
          GSI2PK: `LOCATION#${geohash}`,
          GSI2SK: now,
          Type: 'User',
          ...user,
          geohash,
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    );

    return successResponse(user);
  } catch (error: unknown) {
    console.error('Create user error:', error);

    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return errorResponse(409, 'USER_EXISTS', 'User profile already exists');
    }

    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Failed to create user profile'
    );
  }
};

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME!;
const BUCKET_NAME = process.env.BUCKET_NAME!;
const s3Client = new S3Client({ region: process.env.AWS_REGION });

interface UploadPhotoInput {
  fileName: string;
  contentType: string;
}

/**
 * Upload photo to activity gallery
 * POST /activities/{id}/photos
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

    const input: UploadPhotoInput = JSON.parse(event.body || '{}');
    if (!input.fileName || !input.contentType) {
      return errorResponse(400, 'INVALID_INPUT', 'fileName and contentType are required');
    }

    if (!input.contentType.startsWith('image/')) {
      return errorResponse(400, 'INVALID_INPUT', 'Only image files are allowed');
    }

    // Verify activity exists
    const activityResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `ACTIVITY#${activityId}`, SK: 'METADATA' },
      })
    );

    if (!activityResult.Item) {
      return errorResponse(404, 'NOT_FOUND', 'Activity not found');
    }

    // Verify user is a participant or host
    const activity = activityResult.Item;
    const isParticipant = (activity.participants as string[]).includes(userId);
    const isHost = activity.hostUserId === userId;
    if (!isParticipant && !isHost) {
      return errorResponse(403, 'FORBIDDEN', 'Only participants can upload photos');
    }

    // Get user nickname
    const userResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
      })
    );
    const nickname = userResult.Item?.nickname || 'Unknown';

    // Generate S3 key and presigned URL
    const photoId = uuidv4();
    const fileExtension = input.fileName.split('.').pop();
    const s3Key = `activities/${activityId}/photos/${photoId}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: input.contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const photoUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    const now = new Date().toISOString();

    // Store photo metadata in DynamoDB
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `ACTIVITY#${activityId}`,
          SK: `PHOTO#${now}#${photoId}`,
          Type: 'Photo',
          photoId,
          activityId,
          userId,
          nickname,
          photoUrl,
          createdAt: now,
        },
      })
    );

    return successResponse({
      photoId,
      presignedUrl,
      photoUrl,
      expiresIn: 300,
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to upload photo');
  }
};

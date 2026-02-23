import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';

const TABLE_NAME = process.env.TABLE_NAME!;

interface PhotoItem {
  photoId: string;
  activityId: string;
  userId: string;
  nickname: string;
  photoUrl: string;
  createdAt: string;
}

/**
 * Get photos for an activity
 * GET /activities/{id}/photos
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

    // Query all photos for the activity
    const result = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `ACTIVITY#${activityId}`,
          ':sk': 'PHOTO#',
        },
        ScanIndexForward: false, // newest first
      })
    );

    const photos: PhotoItem[] = (result.Items || []).map((item) => ({
      photoId: item.photoId as string,
      activityId: item.activityId as string,
      userId: item.userId as string,
      nickname: item.nickname as string,
      photoUrl: item.photoUrl as string,
      createdAt: item.createdAt as string,
    }));

    return successResponse({ photos, count: photos.length });
  } catch (error) {
    console.error('Get photos error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to get photos');
  }
};

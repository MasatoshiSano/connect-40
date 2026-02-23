import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import type { Review } from '../../types';

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * Get reviews for an activity
 * GET /activities/:id/reviews
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const activityId = event.pathParameters?.id;
    if (!activityId) {
      return errorResponse(400, 'INVALID_INPUT', 'Activity ID is required');
    }

    const result = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `ACTIVITY#${activityId}`,
          ':sk': 'REVIEW#',
        },
        ScanIndexForward: false, // newest first
      })
    );

    const reviews: Review[] = (result.Items || []).map((item) => ({
      reviewId: item.reviewId as string,
      activityId: item.activityId as string,
      userId: item.userId as string,
      nickname: item.nickname as string,
      rating: item.rating as number,
      comment: item.comment as string,
      createdAt: item.createdAt as string,
    }));

    return successResponse({ reviews, count: reviews.length });
  } catch (error) {
    console.error('Get reviews error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve reviews');
  }
};

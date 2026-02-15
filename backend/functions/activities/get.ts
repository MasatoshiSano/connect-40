import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import type { Activity } from '../../types';

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * Get single activity by ID
 * GET /activities/:id
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
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
        },
      })
    );

    if (!result.Item) {
      return errorResponse(404, 'NOT_FOUND', 'Activity not found');
    }

    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, Type, geohash, ...activity } = result.Item;

    return successResponse(activity as Activity);
  } catch (error) {
    console.error('Get activity error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve activity');
  }
};

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import type { Activity } from '../../types';

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * List activities with optional filters
 * GET /activities?category=sports&limit=20
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const category = event.queryStringParameters?.category;
    const rawLimit = parseInt(event.queryStringParameters?.limit || '20');
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 100);

    let result;

    if (category) {
      // Query by category using GSI1
      result = await ddbDocClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `CATEGORY#${category}`,
          },
          Limit: limit,
          ScanIndexForward: true, // Sort by date ascending
        })
      );
    } else {
      // Try GSI2 query first (ACTIVITIES partition) for efficient listing
      result = await ddbDocClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'GSI2',
          KeyConditionExpression: 'GSI2PK = :pk',
          ExpressionAttributeValues: {
            ':pk': 'ACTIVITIES',
          },
          Limit: limit,
          ScanIndexForward: false,
        })
      );

      // Fallback to scan if GSI2 is not populated for this pattern
      if (!result.Items || result.Items.length === 0) {
        result = await ddbDocClient.send(
          new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'begins_with(PK, :prefix)',
            ExpressionAttributeValues: {
              ':prefix': 'ACTIVITY#',
            },
            Limit: limit,
          })
        );
      }
    }

    const activities = (result.Items || []).map((item) => {
      const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, Type, geohash, ...activity } = item;
      return activity as Activity;
    });

    return successResponse({ activities, count: activities.length });
  } catch (error) {
    console.error('List activities error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve activities');
  }
};

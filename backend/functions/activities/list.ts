import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import type { Activity } from '../../types';

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
const calcDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * List activities with optional filters
 * GET /activities?category=sports&limit=20&radius=5&latitude=35.6&longitude=139.7
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const category = event.queryStringParameters?.category;
    const rawLimit = parseInt(event.queryStringParameters?.limit || '20');
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 100);

    // Parse optional radius filter parameters
    const radiusParam = event.queryStringParameters?.radius;
    const latParam = event.queryStringParameters?.latitude;
    const lonParam = event.queryStringParameters?.longitude;

    const radiusKm = radiusParam ? parseFloat(radiusParam) : undefined;
    const filterLat = latParam ? parseFloat(latParam) : undefined;
    const filterLon = lonParam ? parseFloat(lonParam) : undefined;
    const hasLocationFilter =
      radiusKm !== undefined &&
      !isNaN(radiusKm) &&
      filterLat !== undefined &&
      !isNaN(filterLat) &&
      filterLon !== undefined &&
      !isNaN(filterLon);

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

    const allActivities = (result.Items || []).map((item) => {
      const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, Type, geohash, ...activity } = item;
      return activity as Activity;
    });

    // Apply radius filter if location parameters are provided
    const activities = hasLocationFilter
      ? allActivities.filter((activity) => {
          if (!activity.location) return false;
          const distance = calcDistanceKm(
            filterLat,
            filterLon,
            activity.location.latitude,
            activity.location.longitude
          );
          return distance <= radiusKm;
        })
      : allActivities;

    return successResponse({ activities, count: activities.length });
  } catch (error) {
    console.error('List activities error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve activities');
  }
};

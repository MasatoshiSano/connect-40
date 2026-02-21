import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';

const TABLE_NAME = process.env.TABLE_NAME!;

const ALLOWED_FIELDS = [
  'title',
  'description',
  'category',
  'location',
  'dateTime',
  'duration',
  'maxParticipants',
  'entryFee',
  'recurrence',
  'imageUrl',
  'tags',
  'status',
] as const;

/**
 * Update activity
 * PUT /activities/:id
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

    const input = JSON.parse(event.body || '{}');

    // Get current activity
    const activityResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
        },
      })
    );

    if (!activityResult.Item) {
      return errorResponse(404, 'NOT_FOUND', 'Activity not found');
    }

    const activity = activityResult.Item;

    // Only host can edit
    if (activity.hostUserId !== userId) {
      return errorResponse(403, 'FORBIDDEN', 'Only the host can edit this activity');
    }

    // Build update expression
    const expressionParts: string[] = [];
    const expressionValues: Record<string, unknown> = {};
    const expressionNames: Record<string, string> = {};

    for (const field of ALLOWED_FIELDS) {
      if (input[field] !== undefined) {
        expressionParts.push(`#${field} = :${field}`);
        expressionNames[`#${field}`] = field;
        expressionValues[`:${field}`] = input[field];
      }
    }

    if (expressionParts.length === 0) {
      return errorResponse(400, 'INVALID_INPUT', 'No fields to update');
    }

    // Always update updatedAt
    expressionParts.push('#updatedAt = :updatedAt');
    expressionNames['#updatedAt'] = 'updatedAt';
    expressionValues[':updatedAt'] = new Date().toISOString();

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
        },
        UpdateExpression: `SET ${expressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    // Fetch updated activity (clean response)
    const updatedResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
        },
      })
    );

    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, Type, geohash, ...updatedActivity } =
      updatedResult.Item!;

    return successResponse(updatedActivity);
  } catch (error) {
    console.error('Update activity error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to update activity');
  }
};

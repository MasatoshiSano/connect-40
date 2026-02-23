import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse, generateId, getCurrentTimestamp } from '../../layers/common/nodejs/utils';

const TABLE_NAME = process.env.TABLE_NAME!;

interface ReportBody {
  reportedUserId: string;
  reason: string;
}

/**
 * Report a user
 * POST /reports
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const body = JSON.parse(event.body || '{}') as ReportBody;
    const { reportedUserId, reason } = body;

    if (!reportedUserId || !reason) {
      return errorResponse(400, 'BAD_REQUEST', 'reportedUserId and reason are required');
    }

    if (userId === reportedUserId) {
      return errorResponse(400, 'BAD_REQUEST', 'Cannot report yourself');
    }

    if (reason.length > 1000) {
      return errorResponse(400, 'BAD_REQUEST', 'Reason must be 1000 characters or less');
    }

    const reportId = generateId();
    const now = getCurrentTimestamp();

    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `REPORT#${reportId}`,
          SK: 'METADATA',
          Type: 'REPORT',
          reportId,
          reporterUserId: userId,
          reportedUserId,
          reason,
          status: 'pending',
          createdAt: now,
        },
      })
    );

    return successResponse({ message: 'Report submitted successfully', reportId });
  } catch (error) {
    console.error('Report user error:', error);
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Failed to submit report'
    );
  }
};

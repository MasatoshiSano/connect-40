import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

/**
 * POST /verification/reject
 * Body: { targetUserId: string, reviewNote?: string }
 * Admin only
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const adminUserId = event.requestContext.authorizer?.claims?.sub;
    if (!adminUserId || !ADMIN_USER_IDS.includes(adminUserId)) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const body = JSON.parse(event.body || '{}') as { targetUserId?: string; reviewNote?: string };
    const { targetUserId, reviewNote } = body;
    if (!targetUserId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'targetUserId is required' }) };
    }

    const now = new Date().toISOString();

    await Promise.all([
      ddb.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${targetUserId}`, SK: 'VERIFICATION' },
        UpdateExpression: 'SET paymentStatus = :status, reviewedAt = :now, reviewNote = :note',
        ExpressionAttributeValues: {
          ':status': 'rejected',
          ':now': now,
          ':note': reviewNote ?? '',
        },
      })),
      ddb.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${targetUserId}`, SK: 'PROFILE' },
        UpdateExpression: 'SET verificationStatus = :status, updatedAt = :now',
        ExpressionAttributeValues: { ':status': 'rejected', ':now': now },
      })),
    ]);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ data: { success: true } }),
    };
  } catch (error) {
    console.error('Error rejecting verification:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

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
 * POST /verification/approve
 * Body: { targetUserId: string }
 * Admin only
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const adminUserId = event.requestContext.authorizer?.claims?.sub;
    if (!adminUserId || !ADMIN_USER_IDS.includes(adminUserId)) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const body = JSON.parse(event.body || '{}') as { targetUserId?: string };
    const { targetUserId } = body;
    if (!targetUserId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'targetUserId is required' }) };
    }

    const now = new Date().toISOString();

    // VERIFICATION レコード更新（存在確認 + pending 状態のみ承認可能）
    await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${targetUserId}`, SK: 'VERIFICATION' },
      UpdateExpression: 'SET paymentStatus = :status, reviewedAt = :now',
      ConditionExpression: 'attribute_exists(PK) AND paymentStatus = :pending',
      ExpressionAttributeValues: { ':status': 'approved', ':now': now, ':pending': 'pending' },
    }));

    // USER PROFILE の verificationStatus 更新（存在確認付き）
    await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${targetUserId}`, SK: 'PROFILE' },
      UpdateExpression: 'SET verificationStatus = :status, updatedAt = :now',
      ConditionExpression: 'attribute_exists(PK)',
      ExpressionAttributeValues: { ':status': 'approved', ':now': now },
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ data: { success: true } }),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Verification record not found or not in pending status' }) };
    }
    console.error('Error approving verification:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

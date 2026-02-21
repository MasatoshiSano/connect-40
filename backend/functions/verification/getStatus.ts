import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET',
};

/**
 * GET /verification/status
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const result = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'VERIFICATION' },
    }));

    if (!result.Item) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ data: { status: 'unverified' } }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        data: {
          status: result.Item.paymentStatus as string,
          submittedAt: result.Item.submittedAt as string | undefined,
          reviewedAt: result.Item.reviewedAt as string | undefined,
          reviewNote: result.Item.reviewNote as string | undefined,
        },
      }),
    };
  } catch (error) {
    console.error('Error getting verification status:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

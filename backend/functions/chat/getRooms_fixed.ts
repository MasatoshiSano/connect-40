import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

/**
 * Get user's chat rooms
 * GET /chat/rooms
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        }),
      };
    }

    // Query user's chat participations
    const result = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'CHATROOM#',
        },
      })
    );

    const chatRooms = result.Items || [];

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        data: {
          rooms: chatRooms,
          count: chatRooms.length,
        },
      }),
    };
  } catch (error) {
    console.error('Get chat rooms error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve chat rooms',
        },
      }),
    };
  }
};

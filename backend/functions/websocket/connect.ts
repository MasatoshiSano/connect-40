import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const userId = event.requestContext.authorizer?.userId;

  if (!userId) {
    console.error('No userId in authorizer context');
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const now = new Date().toISOString();

  try {
    // Store connection in DynamoDB
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `CONNECTION#${connectionId}`,
          SK: 'METADATA',
          Type: 'Connection',
          connectionId,
          userId,
          connectedAt: now,
          ttl: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        },
      })
    );

    // Also create a user-to-connection mapping
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `CONNECTION#${connectionId}`,
          Type: 'UserConnection',
          connectionId,
          connectedAt: now,
          ttl: Math.floor(Date.now() / 1000) + 86400,
        },
      })
    );

    console.log(`Connection established: ${connectionId} for user: ${userId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connected' }),
    };
  } catch (error) {
    console.error('Error storing connection:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to connect' }),
    };
  }
};

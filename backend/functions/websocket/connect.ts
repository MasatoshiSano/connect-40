import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;
const USER_POOL_ID = process.env.USER_POOL_ID!;
const CLIENT_ID = process.env.CLIENT_ID!;

// Create verifier for Cognito JWT tokens
const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'id',
  clientId: CLIENT_ID,
});

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;

  // Extract token from query string
  const queryStringParameters = (event as Record<string, unknown>).queryStringParameters as Record<string, string> | undefined;
  const token = queryStringParameters?.token;

  if (!token) {
    console.error('No token in query parameters');
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized: No token provided' }),
    };
  }

  let userId: string;
  try {
    // Verify the JWT token
    const payload = await verifier.verify(token);
    userId = payload.sub;
    console.log(`Token verified for user: ${userId}`);
  } catch (error) {
    console.error('Token verification failed:', error);
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized: Invalid token' }),
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

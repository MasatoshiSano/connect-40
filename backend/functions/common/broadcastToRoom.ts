import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

interface BroadcastMessage {
  type: string;
  data: Record<string, string | number | boolean | null>;
}

export const broadcastToRoom = async (
  tableName: string,
  wsEndpoint: string,
  chatRoomId: string,
  message: BroadcastMessage
): Promise<void> => {
  // Get chat room to find participants
  const roomResult = await ddbDocClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `CHATROOM#${chatRoomId}`,
        SK: 'METADATA',
      },
    })
  );

  if (!roomResult.Item) return;

  const participantIds = roomResult.Item.participantIds as string[];
  const apiGatewayClient = new ApiGatewayManagementApiClient({
    endpoint: wsEndpoint,
  });

  // Get all connections for participants
  const connections: string[] = [];
  for (const participantId of participantIds) {
    const userConnections = await ddbDocClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${participantId}`,
          ':sk': 'CONNECTION#',
        },
      })
    );

    if (userConnections.Items) {
      connections.push(...userConnections.Items.map((item) => item.connectionId as string));
    }
  }

  // Broadcast to all connections
  const messageData = JSON.stringify(message);
  await Promise.allSettled(
    connections.map(async (connId) => {
      try {
        await apiGatewayClient.send(
          new PostToConnectionCommand({
            ConnectionId: connId,
            Data: Buffer.from(messageData),
          })
        );
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 410) {
          await ddbDocClient.send(
            new DeleteCommand({
              TableName: tableName,
              Key: {
                PK: `CONNECTION#${connId}`,
                SK: 'METADATA',
              },
            })
          );
        }
      }
    })
  );
};

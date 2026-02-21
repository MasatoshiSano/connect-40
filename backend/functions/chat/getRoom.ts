import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

function isAdmin(claims: Record<string, string>): boolean {
  const groups = claims['cognito:groups'];
  if (!groups) return false;
  const groupList = Array.isArray(groups) ? groups : groups.split(',').map((g) => g.trim());
  return groupList.includes('admin');
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = event.requestContext.authorizer?.claims?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      }),
    };
  }

  const chatRoomId = event.pathParameters?.chatRoomId;

  if (!chatRoomId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        error: {
          code: 'INVALID_REQUEST',
          message: 'chatRoomId is required',
        },
      }),
    };
  }

  try {
    // Get chat room metadata
    const roomResult = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `CHATROOM#${chatRoomId}`,
          ':sk': 'METADATA',
        },
      })
    );

    if (!roomResult.Items || roomResult.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        body: JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: 'Chat room not found',
          },
        }),
      };
    }

    const chatRoom = roomResult.Items[0];

    // Verify the requesting user is a participant (admin bypasses this)
    const claims = (event.requestContext.authorizer?.claims ?? {}) as Record<string, string>;
    const roomParticipantIds = chatRoom.participantIds as string[];
    if (!isAdmin(claims) && !roomParticipantIds.includes(userId)) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        body: JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message: 'Not a participant of this chat room',
          },
        }),
      };
    }

    // Get recent messages (last 50)
    const messagesResult = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `CHATROOM#${chatRoomId}`,
          ':sk': 'MESSAGE#',
        },
        ScanIndexForward: false, // Newest first
        Limit: 50,
      })
    );

    const messages = (messagesResult.Items || [])
      .map((item) => ({
        messageId: item.messageId,
        senderId: item.senderId,
        content: item.content,
        messageType: (item.messageType as string) || 'user',
        readBy: item.readBy || [],
        createdAt: item.createdAt,
        timestamp: item.timestamp,
      }))
      .reverse(); // Oldest first for display

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        data: {
          chatRoomId: chatRoom.chatRoomId,
          name: chatRoom.name,
          participantIds: chatRoom.participantIds,
          type: chatRoom.type,
          activityId: chatRoom.activityId,
          lastMessageAt: chatRoom.lastMessageAt,
          createdAt: chatRoom.createdAt,
          messages,
        },
      }),
    };
  } catch (error) {
    console.error('Error getting chat room:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get chat room',
        },
      }),
    };
  }
};

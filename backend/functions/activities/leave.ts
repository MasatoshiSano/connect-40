import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { GetCommand, UpdateCommand, DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME!;

const createSystemMessage = async (
  chatRoomId: string,
  content: string
): Promise<void> => {
  const messageId = uuidv4();
  const timestamp = Date.now();
  const now = new Date().toISOString();

  await ddbDocClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `CHATROOM#${chatRoomId}`,
        SK: `MESSAGE#${timestamp}#${messageId}`,
        Type: 'Message',
        messageId,
        chatRoomId,
        senderId: 'system',
        content,
        messageType: 'system',
        readBy: [],
        createdAt: now,
        timestamp,
      },
    })
  );

  await ddbDocClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `CHATROOM#${chatRoomId}`,
        SK: 'LASTMESSAGE',
        lastMessageAt: now,
        lastMessage: content.substring(0, 100),
      },
    })
  );
};

/**
 * Leave an activity
 * POST /activities/:id/leave
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

    // Get activity
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

    if (activity.hostUserId === userId) {
      return errorResponse(400, 'INVALID_ACTION', 'Host cannot leave their own activity');
    }

    const participantIndex = (activity.participants as string[]).indexOf(userId);
    if (participantIndex === -1) {
      return errorResponse(400, 'NOT_PARTICIPANT', 'Not a participant of this activity');
    }

    const now = new Date().toISOString();

    // Remove user from activity participants
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
        },
        UpdateExpression: `ADD currentParticipants :dec REMOVE participants[${participantIndex}] SET updatedAt = :now`,
        ExpressionAttributeValues: {
          ':dec': -1,
          ':now': now,
        },
      })
    );

    // Delete participant record
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `ACTIVITY#${activityId}`,
        },
      })
    );

    // --- Group Chat Removal ---

    // Get user's nickname
    const userResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      })
    );
    const nickname = (userResult.Item?.nickname as string) || 'ユーザー';

    // Find chat room linked to activity
    const chatRoomQuery = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `ACTIVITY#${activityId}`,
          ':sk': 'CHATROOM#',
        },
      })
    );

    if (chatRoomQuery.Items && chatRoomQuery.Items.length > 0) {
      const chatRoomId = chatRoomQuery.Items[0].chatRoomId as string;

      // Get current room metadata to find user index in participantIds
      const roomResult = await ddbDocClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `CHATROOM#${chatRoomId}`,
            SK: 'METADATA',
          },
        })
      );

      if (roomResult.Item) {
        const chatParticipantIndex = (roomResult.Item.participantIds as string[]).indexOf(userId);

        if (chatParticipantIndex !== -1) {
          // Remove user from chat room participantIds
          await ddbDocClient.send(
            new UpdateCommand({
              TableName: TABLE_NAME,
              Key: {
                PK: `CHATROOM#${chatRoomId}`,
                SK: 'METADATA',
              },
              UpdateExpression: `REMOVE participantIds[${chatParticipantIndex}]`,
            })
          );
        }
      }

      // Delete user's chat participation record
      await ddbDocClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: `CHATROOM#${chatRoomId}`,
          },
        })
      );

      // Post system message
      await createSystemMessage(chatRoomId, `${nickname}さんが退出しました`);
    }

    return successResponse({ message: 'Successfully left activity' });
  } catch (error) {
    console.error('Leave activity error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to leave activity');
  }
};

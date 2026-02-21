import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { GetCommand, UpdateCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
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

  // Update last message
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
 * Join an activity
 * POST /activities/:id/join
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

    // Validate
    if (activity.hostUserId === userId) {
      return errorResponse(400, 'INVALID_ACTION', 'Host cannot join their own activity');
    }

    if ((activity.participants as string[]).includes(userId)) {
      return errorResponse(400, 'ALREADY_JOINED', 'Already joined this activity');
    }

    if ((activity.currentParticipants as number) >= (activity.maxParticipants as number)) {
      return errorResponse(400, 'ACTIVITY_FULL', 'Activity is full');
    }

    if (activity.status !== 'upcoming') {
      return errorResponse(400, 'INVALID_STATUS', 'Cannot join non-upcoming activity');
    }

    const now = new Date().toISOString();

    // Update activity participants
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
        },
        UpdateExpression: 'ADD currentParticipants :inc SET participants = list_append(participants, :userId), updatedAt = :now',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':userId': [userId],
          ':now': now,
        },
      })
    );

    // Create participant record
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `ACTIVITY#${activityId}`,
          Type: 'Participation',
          activityId,
          userId,
          joinedAt: now,
        },
      })
    );

    // --- Group Chat Integration ---

    // Get user's nickname for system message
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

    // Check if activity already has a chat room
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

    let chatRoomId: string;

    if (chatRoomQuery.Items && chatRoomQuery.Items.length > 0) {
      // Chat room exists — add user to it
      chatRoomId = chatRoomQuery.Items[0].chatRoomId as string;

      // Add user to participantIds
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `CHATROOM#${chatRoomId}`,
            SK: 'METADATA',
          },
          UpdateExpression: 'SET participantIds = list_append(participantIds, :userId)',
          ExpressionAttributeValues: {
            ':userId': [userId],
          },
        })
      );

      // Create chat participation record
      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${userId}`,
            SK: `CHATROOM#${chatRoomId}`,
            GSI1PK: `USERROOMS#${userId}`,
            GSI1SK: now,
            Type: 'ChatParticipation',
            chatRoomId,
            participantId: userId,
            joinedAt: now,
          },
        })
      );

      // Post system message
      await createSystemMessage(chatRoomId, `${nickname}さんが参加しました`);
    } else {
      // No chat room yet — create one
      chatRoomId = uuidv4();

      const participantIds = [activity.hostUserId as string, userId];

      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `CHATROOM#${chatRoomId}`,
            SK: 'METADATA',
            Type: 'ChatRoom',
            chatRoomId,
            name: activity.title as string,
            participantIds,
            type: 'group',
            activityId,
            lastMessageAt: now,
            createdAt: now,
          },
        })
      );

      // Create activity-to-chatroom lookup record
      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `ACTIVITY#${activityId}`,
            SK: `CHATROOM#${chatRoomId}`,
            Type: 'ActivityChatRoom',
            chatRoomId,
            activityId,
            createdAt: now,
          },
        })
      );

      // Create participation records for each participant
      for (const participantId of participantIds) {
        await ddbDocClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              PK: `USER#${participantId}`,
              SK: `CHATROOM#${chatRoomId}`,
              GSI1PK: `USERROOMS#${participantId}`,
              GSI1SK: now,
              Type: 'ChatParticipation',
              chatRoomId,
              participantId,
              joinedAt: now,
            },
          })
        );
      }

      // Post system messages
      await createSystemMessage(chatRoomId, 'グループチャットが作成されました');
      await createSystemMessage(chatRoomId, `${nickname}さんが参加しました`);
    }

    // Grant +20 chatCredits for free plan users
    try {
      await ddbDocClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        UpdateExpression: 'ADD chatCredits :credits',
        ConditionExpression: 'membershipTier = :free',
        ExpressionAttributeValues: {
          ':credits': 20,
          ':free': 'free',
        },
      }));
    } catch {
      // ConditionalCheckFailedException etc. ignored
    }

    return successResponse({
      message: 'Successfully joined activity',
      chatRoomId,
    });
  } catch (error) {
    console.error('Join activity error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to join activity');
  }
};

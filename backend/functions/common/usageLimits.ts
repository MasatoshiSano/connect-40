import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

export interface UsageLimits {
  maxActivitiesPerMonth: number;
  maxChatRooms: number;
}

export const USAGE_LIMITS: Record<'free' | 'premium', UsageLimits> = {
  free: {
    maxActivitiesPerMonth: 5,
    maxChatRooms: 3,
  },
  premium: {
    maxActivitiesPerMonth: -1, // unlimited
    maxChatRooms: -1, // unlimited
  },
};

export async function checkActivityCreationLimit(
  ddbDocClient: DynamoDBDocumentClient,
  tableName: string,
  userId: string,
  subscriptionPlan: 'free' | 'premium'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = USAGE_LIMITS[subscriptionPlan];

  // Premium users have unlimited access
  if (limits.maxActivitiesPerMonth === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  // Get current month's activities created by user
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK >= :startDate',
      ExpressionAttributeValues: {
        ':pk': `USERACTIVITIES#${userId}`,
        ':startDate': startOfMonth,
      },
    })
  );

  const currentCount = result.Count || 0;
  const allowed = currentCount < limits.maxActivitiesPerMonth;

  return {
    allowed,
    current: currentCount,
    limit: limits.maxActivitiesPerMonth,
  };
}

export async function checkChatRoomLimit(
  ddbDocClient: DynamoDBDocumentClient,
  tableName: string,
  userId: string,
  subscriptionPlan: 'free' | 'premium'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = USAGE_LIMITS[subscriptionPlan];

  // Premium users have unlimited access
  if (limits.maxChatRooms === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  // Get user's chat rooms
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USERROOMS#${userId}`,
      },
    })
  );

  const currentCount = result.Count || 0;
  const allowed = currentCount < limits.maxChatRooms;

  return {
    allowed,
    current: currentCount,
    limit: limits.maxChatRooms,
  };
}

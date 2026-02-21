import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { ddbDocClient, GetCommand } from '../../layers/common/nodejs/dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const TABLE_NAME = process.env.TABLE_NAME!;
const FRONTEND_URL = process.env.FRONTEND_URL!;

/**
 * POST /activities/{id}/join-checkout
 * 有料アクティビティの Stripe Checkout セッション作成
 * Body: { email: string }
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const activityId = event.pathParameters?.id;
    if (!activityId) {
      return errorResponse(400, 'INVALID_INPUT', 'Activity ID required');
    }

    // アクティビティ取得
    const activityResult = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `ACTIVITY#${activityId}`, SK: 'METADATA' },
    }));

    if (!activityResult.Item) {
      return errorResponse(404, 'NOT_FOUND', 'Activity not found');
    }

    const rawEntryFee = activityResult.Item.entryFee;
    const entryFee = typeof rawEntryFee === 'number' && Number.isFinite(rawEntryFee) ? rawEntryFee : 0;
    if (entryFee <= 0) {
      return errorResponse(400, 'INVALID_INPUT', 'This activity is free. Use the regular join endpoint.');
    }

    // 定員チェック（課金前に満員を弾く）
    const rawCurrent = activityResult.Item.currentParticipants;
    const currentParticipants = typeof rawCurrent === 'number' && Number.isFinite(rawCurrent) ? rawCurrent : 0;
    const rawMax = activityResult.Item.maxParticipants;
    const maxParticipants = typeof rawMax === 'number' && Number.isFinite(rawMax) ? rawMax : undefined;
    if (maxParticipants !== undefined && currentParticipants >= maxParticipants) {
      return errorResponse(409, 'ACTIVITY_FULL', 'このアクティビティは満員です');
    }

    // すでに参加しているか確認
    const rawParticipants = activityResult.Item.participants;
    const participants = Array.isArray(rawParticipants)
      ? rawParticipants.filter((p): p is string => typeof p === 'string')
      : [];
    if (participants.includes(userId)) {
      return errorResponse(409, 'ALREADY_JOINED', 'Already joined this activity');
    }

    const body = JSON.parse(event.body || '{}') as { email?: string };
    const { email } = body;
    if (!email) {
      return errorResponse(400, 'INVALID_INPUT', 'email is required');
    }

    const rawTitle = activityResult.Item.title;
    const title = typeof rawTitle === 'string' ? rawTitle : activityId;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: entryFee,
          product_data: {
            name: title,
            description: `${title} への参加費`,
          },
        },
        quantity: 1,
      }],
      success_url: `${FRONTEND_URL}/activities/${activityId}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/activities/${activityId}`,
      metadata: {
        type: 'activity_join',
        activityId,
        userId,
      },
      customer_email: email,
    });

    return successResponse({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating activity join checkout:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Internal server error');
  }
};

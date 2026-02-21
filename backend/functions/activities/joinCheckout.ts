import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;
const FRONTEND_URL = process.env.FRONTEND_URL!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

/**
 * POST /activities/{id}/join-checkout
 * 有料アクティビティの Stripe Checkout セッション作成
 * Body: { email: string }
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const activityId = event.pathParameters?.id;
    if (!activityId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Activity ID required' }) };
    }

    // アクティビティ取得
    const activityResult = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `ACTIVITY#${activityId}`, SK: 'METADATA' },
    }));

    if (!activityResult.Item) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Activity not found' }) };
    }

    const entryFee = activityResult.Item.entryFee as number | undefined;
    if (!entryFee || entryFee <= 0) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'This activity is free. Use the regular join endpoint.' }) };
    }

    // すでに参加しているか確認
    const participants = activityResult.Item.participants as string[] | undefined ?? [];
    if (participants.includes(userId)) {
      return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: 'Already joined this activity' }) };
    }

    const body = JSON.parse(event.body || '{}') as { email?: string };
    const { email } = body;
    if (!email) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'email is required' }) };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: entryFee,
          product_data: {
            name: activityResult.Item.title as string,
            description: `${activityResult.Item.title as string} への参加費`,
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

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('Error creating activity join checkout:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;
const FRONTEND_URL = process.env.FRONTEND_URL!;
const VERIFICATION_PRICE_YEN = 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

/**
 * POST /verification/checkout
 * 本人確認の支払いセッションを作成する
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const body = JSON.parse(event.body || '{}') as { documentUrl?: string; email?: string };
    const { documentUrl, email } = body;

    if (!documentUrl || !email) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'documentUrl and email are required' }) };
    }

    // すでに承認済みならエラー
    const existing = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'VERIFICATION' },
    }));
    if (existing.Item?.paymentStatus === 'approved') {
      return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: 'Already verified' }) };
    }

    // Stripe Checkout セッション作成 (一回限り支払い)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: VERIFICATION_PRICE_YEN,
          product_data: {
            name: '本人確認',
            description: '本人確認審査手数料（一回限り）',
          },
        },
        quantity: 1,
      }],
      success_url: `${FRONTEND_URL}/profile/verification/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/profile/verification`,
      metadata: {
        type: 'verification',
        userId,
        documentUrl,
      },
      customer_email: email,
    });

    // DynamoDB に支払い待ちレコードを保存
    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: 'VERIFICATION',
        documentUrl,
        paymentStatus: 'payment_pending',
        stripeSessionId: session.id,
        submittedAt: new Date().toISOString(),
      },
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('Error creating verification checkout:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to create checkout session' }),
    };
  }
};

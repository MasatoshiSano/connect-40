import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const signature = event.headers['Stripe-Signature'] || event.headers['stripe-signature'];

  if (!signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No signature header' }),
    };
  }

  try {
    // Verify webhook signature
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      signature,
      WEBHOOK_SECRET
    );

    console.log('Processing webhook event:', stripeEvent.type);

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const sessionType = session.metadata?.type;
        if (sessionType === 'verification') {
          await handleVerificationCheckoutCompleted(session);
        } else if (sessionType === 'activity_join') {
          await handleActivityJoinCheckoutCompleted(session);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Webhook error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;

  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update user subscription in DynamoDB
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression:
        'SET subscriptionPlan = :plan, stripeCustomerId = :customerId, stripeSubscriptionId = :subscriptionId, subscriptionStatus = :status, updatedAt = :now',
      ExpressionAttributeValues: {
        ':plan': 'premium',
        ':customerId': customerId,
        ':subscriptionId': subscriptionId,
        ':status': subscription.status,
        ':now': new Date().toISOString(),
      },
    })
  );

  console.log(`Subscription activated for user ${userId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  // Find user by customer ID
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    console.error('Customer deleted');
    return;
  }

  const userId = customer.metadata?.userId;
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  // Update subscription status
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: 'SET subscriptionStatus = :status, updatedAt = :now',
      ExpressionAttributeValues: {
        ':status': subscription.status,
        ':now': new Date().toISOString(),
      },
    })
  );

  console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  // Find user by customer ID
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    console.error('Customer deleted');
    return;
  }

  const userId = customer.metadata?.userId;
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  // Downgrade to free plan
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression:
        'SET subscriptionPlan = :plan, subscriptionStatus = :status, updatedAt = :now',
      ExpressionAttributeValues: {
        ':plan': 'free',
        ':status': 'canceled',
        ':now': new Date().toISOString(),
      },
    })
  );

  console.log(`Subscription canceled for user ${userId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  console.log('Payment succeeded for invoice:', invoice.id);
  // Additional logic if needed (e.g., send confirmation email)
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('Payment failed for invoice:', invoice.id);
  // Additional logic if needed (e.g., send payment failure notification)
}

async function handleActivityJoinCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const { activityId, userId } = session.metadata ?? {};
  if (!activityId || !userId) {
    console.error('Missing activityId or userId in activity_join session metadata');
    return;
  }

  const now = new Date().toISOString();

  // アクティビティ取得
  const activityResult = await ddbDocClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: `ACTIVITY#${activityId}`, SK: 'METADATA' },
  }));

  if (!activityResult.Item) {
    console.error(`Activity ${activityId} not found`);
    return;
  }

  const participants = activityResult.Item.participants as string[] | undefined ?? [];
  if (participants.includes(userId)) {
    console.log(`User ${userId} already joined activity ${activityId} (idempotent)`);
    return;
  }

  // 支払い記録保存 + 参加者追加（並行実行）
  await Promise.all([
    ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `ACTIVITY#${activityId}`,
        SK: `PAYMENT#${userId}`,
        amount: session.amount_total ?? 0,
        stripeSessionId: session.id,
        status: 'paid',
        paidAt: now,
      },
      ConditionExpression: 'attribute_not_exists(PK)',
    })),
    ddbDocClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `ACTIVITY#${activityId}`, SK: 'METADATA' },
      UpdateExpression: 'SET participants = list_append(if_not_exists(participants, :empty), :userIdList), currentParticipants = currentParticipants + :one, updatedAt = :now',
      ConditionExpression: 'currentParticipants < maxParticipants AND not contains(participants, :userId)',
      ExpressionAttributeValues: {
        ':userIdList': [userId],
        ':userId': userId,
        ':one': 1,
        ':now': now,
        ':empty': [] as string[],
      },
    })),
  ]);

  console.log(`User ${userId} successfully joined activity ${activityId} via payment`);
}

async function handleVerificationCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in verification session metadata');
    return;
  }

  const now = new Date().toISOString();

  // VERIFICATION レコードを pending（admin審査待ち）に更新（payment_pending の時のみ、べき等性のため）
  try {
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'VERIFICATION' },
        UpdateExpression: 'SET paymentStatus = :status, paidAt = :now',
        ConditionExpression: 'paymentStatus = :payment_pending',
        ExpressionAttributeValues: {
          ':status': 'pending',
          ':now': now,
          ':payment_pending': 'payment_pending',
        },
      })
    );
  } catch (conditionError) {
    if (conditionError instanceof Error && conditionError.name !== 'ConditionalCheckFailedException') {
      throw conditionError;
    }
    console.log(`Verification already processed for user ${userId} (idempotent)`);
    return;
  }

  // USER PROFILE の verificationStatus も 'pending' に
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
      UpdateExpression: 'SET verificationStatus = :status, updatedAt = :now',
      ExpressionAttributeValues: {
        ':status': 'pending',
        ':now': now,
      },
    })
  );

  console.log(`Verification payment received for user ${userId}, awaiting admin review`);
}

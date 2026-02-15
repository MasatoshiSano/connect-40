import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface PaymentStackProps extends cdk.StackProps {
  userPoolId: string;
  userPoolArn: string;
  restApi: apigateway.RestApi;
  authorizer: apigateway.CognitoUserPoolsAuthorizer;
  tableName: string;
  tableArn: string;
  frontendUrl: string;
}

export class PaymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PaymentStackProps) {
    super(scope, id, props);

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'PaymentLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB access
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
        ],
        resources: [props.tableArn, `${props.tableArn}/index/*`],
      })
    );

    // Common environment variables
    const environment = {
      TABLE_NAME: props.tableName,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      FRONTEND_URL: props.frontendUrl,
    };

    // Create Checkout Session Lambda
    const createCheckoutSessionFunction = new lambda.Function(
      this,
      'CreateCheckoutSessionFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'createCheckoutSession.handler',
        code: lambda.Code.fromAsset('../backend/functions/payment'),
        role: lambdaRole,
        environment,
        timeout: cdk.Duration.seconds(30),
      }
    );

    // Stripe Webhook Lambda
    const webhookFunction = new lambda.Function(this, 'WebhookFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'webhook.handler',
      code: lambda.Code.fromAsset('../backend/functions/payment'),
      role: lambdaRole,
      environment,
      timeout: cdk.Duration.seconds(30),
    });

    // Create Portal Session Lambda
    const createPortalSessionFunction = new lambda.Function(
      this,
      'CreatePortalSessionFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'createPortalSession.handler',
        code: lambda.Code.fromAsset('../backend/functions/payment'),
        role: lambdaRole,
        environment,
        timeout: cdk.Duration.seconds(30),
      }
    );

    // Add routes to REST API
    const paymentResource = props.restApi.root.addResource('payment');

    // POST /payment/checkout
    const checkoutResource = paymentResource.addResource('checkout');
    checkoutResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createCheckoutSessionFunction),
      {
        authorizer: props.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // POST /payment/webhook (no auth required - Stripe will send signature)
    const webhookResource = paymentResource.addResource('webhook');
    webhookResource.addMethod('POST', new apigateway.LambdaIntegration(webhookFunction));

    // POST /payment/portal
    const portalResource = paymentResource.addResource('portal');
    portalResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createPortalSessionFunction),
      {
        authorizer: props.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'WebhookUrl', {
      value: `${props.restApi.url}payment/webhook`,
      description: 'Stripe Webhook URL (configure in Stripe Dashboard)',
    });
  }
}

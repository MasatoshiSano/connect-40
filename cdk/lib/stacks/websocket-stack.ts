import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export interface WebSocketStackProps extends cdk.StackProps {
  envName: string;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  table: dynamodb.Table;
}

export class WebSocketStack extends cdk.Stack {
  public readonly webSocketApi: apigatewayv2.CfnApi;
  public readonly webSocketEndpoint: string;
  public readonly functions: lambda.Function[] = [];

  constructor(scope: Construct, id: string, props: WebSocketStackProps) {
    super(scope, id, props);

    // WebSocket API Gateway
    this.webSocketApi = new apigatewayv2.CfnApi(this, 'WebSocketApi', {
      name: `Connect40-WebSocket-${props.envName}`,
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.action',
    });

    // Lambda execution role with DynamoDB and API Gateway permissions
    const lambdaRole = new iam.Role(this, 'WebSocketLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    props.table.grantReadWriteData(lambdaRole);

    // Grant API Gateway management permissions for posting to connections
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['execute-api:ManageConnections'],
        resources: [
          `arn:aws:execute-api:${this.region}:${this.account}:${this.webSocketApi.ref}/*`,
        ],
      })
    );

    // Connect Handler
    const connectFunction = new lambda.Function(this, 'ConnectFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'connect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../backend/functions/websocket')),
      role: lambdaRole,
      environment: {
        TABLE_NAME: props.table.tableName,
        USER_POOL_ID: props.userPool.userPoolId,
        CLIENT_ID: props.userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.seconds(30),
    });
    this.functions.push(connectFunction);

    // Disconnect Handler
    const disconnectFunction = new lambda.Function(this, 'DisconnectFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'disconnect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../backend/functions/websocket')),
      role: lambdaRole,
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });
    this.functions.push(disconnectFunction);

    // SendMessage Handler
    const sendMessageFunction = new lambda.Function(this, 'SendMessageFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'sendMessage.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../backend/functions/websocket')),
      role: lambdaRole,
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });
    this.functions.push(sendMessageFunction);

    // Default Handler
    const defaultFunction = new lambda.Function(this, 'DefaultFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'default.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../backend/functions/websocket')),
      role: lambdaRole,
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });
    this.functions.push(defaultFunction);

    // Grant Lambda permissions to be invoked by API Gateway
    connectFunction.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));
    disconnectFunction.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));
    sendMessageFunction.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));
    defaultFunction.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));

    // Create integrations
    const connectIntegration = new apigatewayv2.CfnIntegration(this, 'ConnectIntegration', {
      apiId: this.webSocketApi.ref,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${connectFunction.functionArn}/invocations`,
    });

    const disconnectIntegration = new apigatewayv2.CfnIntegration(this, 'DisconnectIntegration', {
      apiId: this.webSocketApi.ref,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${disconnectFunction.functionArn}/invocations`,
    });

    const sendMessageIntegration = new apigatewayv2.CfnIntegration(this, 'SendMessageIntegration', {
      apiId: this.webSocketApi.ref,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${sendMessageFunction.functionArn}/invocations`,
    });

    const defaultIntegration = new apigatewayv2.CfnIntegration(this, 'DefaultIntegration', {
      apiId: this.webSocketApi.ref,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${defaultFunction.functionArn}/invocations`,
    });

    // Create routes
    const connectRoute = new apigatewayv2.CfnRoute(this, 'ConnectRoute', {
      apiId: this.webSocketApi.ref,
      routeKey: '$connect',
      target: `integrations/${connectIntegration.ref}`,
    });

    const disconnectRoute = new apigatewayv2.CfnRoute(this, 'DisconnectRoute', {
      apiId: this.webSocketApi.ref,
      routeKey: '$disconnect',
      target: `integrations/${disconnectIntegration.ref}`,
    });

    const sendMessageRoute = new apigatewayv2.CfnRoute(this, 'SendMessageRoute', {
      apiId: this.webSocketApi.ref,
      routeKey: 'sendMessage',
      target: `integrations/${sendMessageIntegration.ref}`,
    });

    const defaultRoute = new apigatewayv2.CfnRoute(this, 'DefaultRoute', {
      apiId: this.webSocketApi.ref,
      routeKey: '$default',
      target: `integrations/${defaultIntegration.ref}`,
    });

    // Create deployment
    const deployment = new apigatewayv2.CfnDeployment(this, 'WebSocketDeployment', {
      apiId: this.webSocketApi.ref,
    });

    // Ensure routes are created before deployment
    deployment.addDependency(connectRoute);
    deployment.addDependency(disconnectRoute);
    deployment.addDependency(sendMessageRoute);
    deployment.addDependency(defaultRoute);

    // Create stage
    const stage = new apigatewayv2.CfnStage(this, 'WebSocketStage', {
      apiId: this.webSocketApi.ref,
      stageName: props.envName,
      deploymentId: deployment.ref,
      defaultRouteSettings: {
        throttlingBurstLimit: 500,
        throttlingRateLimit: 1000,
      },
    });

    this.webSocketEndpoint = `wss://${this.webSocketApi.ref}.execute-api.${this.region}.amazonaws.com/${props.envName}`;

    // Outputs
    new cdk.CfnOutput(this, 'WebSocketEndpoint', {
      value: this.webSocketEndpoint,
      exportName: `Connect40-WebSocketEndpoint-${props.envName}`,
    });
  }
}

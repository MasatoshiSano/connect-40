import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  envName: string;
  userPool: cognito.UserPool;
  table: dynamodb.Table;
  bucket: s3.Bucket;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly apiEndpoint: string;
  public readonly functions: lambda.Function[] = [];

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // REST API Gateway
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `Connect40-Api-${props.envName}`,
      description: 'Connect40 REST API',
      deployOptions: {
        stageName: props.envName,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: props.envName !== 'prod',
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // TODO: Restrict to frontend domain
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });

    this.apiEndpoint = this.api.url;

    // Lambda Layer for common code
    const commonLayer = new lambda.LayerVersion(this, 'CommonLayer', {
      code: lambda.Code.fromAsset('../backend/layers/common'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Common utilities and DynamoDB client',
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [props.userPool],
    });

    // User management Lambda functions
    const createUserFunction = new lambda.Function(this, 'CreateUserFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'create.handler',
      code: lambda.Code.fromAsset('../backend/functions/users'),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucket.bucketName,
      },
      layers: [commonLayer],
      timeout: cdk.Duration.seconds(10),
    });

    const getUserFunction = new lambda.Function(this, 'GetUserFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'get.handler',
      code: lambda.Code.fromAsset('../backend/functions/users'),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucket.bucketName,
      },
      layers: [commonLayer],
      timeout: cdk.Duration.seconds(10),
    });

    const updateUserFunction = new lambda.Function(this, 'UpdateUserFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'update.handler',
      code: lambda.Code.fromAsset('../backend/functions/users'),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucket.bucketName,
      },
      layers: [commonLayer],
      timeout: cdk.Duration.seconds(10),
    });

    // Grant permissions
    props.table.grantReadWriteData(createUserFunction);
    props.table.grantReadWriteData(getUserFunction);
    props.table.grantReadWriteData(updateUserFunction);
    props.bucket.grantReadWrite(createUserFunction);
    props.bucket.grantReadWrite(updateUserFunction);

    this.functions.push(createUserFunction, getUserFunction, updateUserFunction);

    // API Routes
    const users = this.api.root.addResource('users');

    // POST /users - Create user profile
    users.addMethod('POST', new apigateway.LambdaIntegration(createUserFunction), {
      authorizer,
    });

    const userMe = users.addResource('me');

    // GET /users/me - Get current user profile
    userMe.addMethod('GET', new apigateway.LambdaIntegration(getUserFunction), {
      authorizer,
    });

    // PUT /users/me - Update current user profile
    userMe.addMethod('PUT', new apigateway.LambdaIntegration(updateUserFunction), {
      authorizer,
    });

    // Activity management Lambda functions
    const createActivityFunction = new lambda.Function(this, 'CreateActivityFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'create.handler',
      code: lambda.Code.fromAsset('../backend/functions/activities'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      layers: [commonLayer],
      timeout: cdk.Duration.seconds(10),
    });

    const listActivitiesFunction = new lambda.Function(this, 'ListActivitiesFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'list.handler',
      code: lambda.Code.fromAsset('../backend/functions/activities'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      layers: [commonLayer],
      timeout: cdk.Duration.seconds(10),
    });

    const getActivityFunction = new lambda.Function(this, 'GetActivityFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'get.handler',
      code: lambda.Code.fromAsset('../backend/functions/activities'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      layers: [commonLayer],
      timeout: cdk.Duration.seconds(10),
    });

    const joinActivityFunction = new lambda.Function(this, 'JoinActivityFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'join.handler',
      code: lambda.Code.fromAsset('../backend/functions/activities'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      layers: [commonLayer],
      timeout: cdk.Duration.seconds(10),
    });

    // Grant permissions
    props.table.grantReadWriteData(createActivityFunction);
    props.table.grantReadWriteData(listActivitiesFunction);
    props.table.grantReadWriteData(getActivityFunction);
    props.table.grantReadWriteData(joinActivityFunction);

    this.functions.push(
      createActivityFunction,
      listActivitiesFunction,
      getActivityFunction,
      joinActivityFunction
    );

    // Activity API Routes
    const activities = this.api.root.addResource('activities');

    // POST /activities - Create activity
    activities.addMethod('POST', new apigateway.LambdaIntegration(createActivityFunction), {
      authorizer,
    });

    // GET /activities - List activities
    activities.addMethod('GET', new apigateway.LambdaIntegration(listActivitiesFunction), {
      authorizer,
    });

    // GET /activities/{id} - Get activity
    const activityById = activities.addResource('{id}');
    activityById.addMethod('GET', new apigateway.LambdaIntegration(getActivityFunction), {
      authorizer,
    });

    // POST /activities/{id}/join - Join activity
    const activityJoin = activityById.addResource('join');
    activityJoin.addMethod('POST', new apigateway.LambdaIntegration(joinActivityFunction), {
      authorizer,
    });

    // Chat management Lambda functions
    const createChatRoomFunction = new lambda.Function(this, 'CreateChatRoomFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'createRoom.handler',
      code: lambda.Code.fromAsset('../backend/functions/chat'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      layers: [commonLayer],
      timeout: cdk.Duration.seconds(10),
    });

    const getChatRoomsFunction = new lambda.Function(this, 'GetChatRoomsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'getRooms.handler',
      code: lambda.Code.fromAsset('../backend/functions/chat'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      layers: [commonLayer],
      timeout: cdk.Duration.seconds(10),
    });

    // Grant permissions
    props.table.grantReadWriteData(createChatRoomFunction);
    props.table.grantReadWriteData(getChatRoomsFunction);

    this.functions.push(createChatRoomFunction, getChatRoomsFunction);

    // Chat API Routes
    const chat = this.api.root.addResource('chat');
    const chatRooms = chat.addResource('rooms');

    // POST /chat/rooms - Create chat room
    chatRooms.addMethod('POST', new apigateway.LambdaIntegration(createChatRoomFunction), {
      authorizer,
    });

    // GET /chat/rooms - Get user's chat rooms
    chatRooms.addMethod('GET', new apigateway.LambdaIntegration(getChatRoomsFunction), {
      authorizer,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.apiEndpoint,
      exportName: `Connect40-ApiEndpoint-${props.envName}`,
    });
  }
}

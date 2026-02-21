import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
  envName: string;
  userPool: cognito.UserPool;
  table: dynamodb.Table;
  bucket: s3.Bucket;
  webSocketEndpoint?: string;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly apiEndpoint: string;
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;
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
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        allowCredentials: true,
      },
    });

    this.apiEndpoint = this.api.url;

    // Lambda Layer for common code - TEMPORARILY DISABLED
    // TODO: Fix layer structure to match Lambda requirements
    // const commonLayer = new lambda.LayerVersion(this, 'CommonLayer', {
    //   code: lambda.Code.fromAsset(path.join(__dirname, '../../../backend/layers/common')),
    //   compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    //   description: 'Common utilities and DynamoDB client',
    // });

    // Cognito Authorizer
    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [props.userPool],
    });

    // User management Lambda functions
    const createUserFunction = new NodejsFunction(this, 'CreateUserFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/users/create.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucket.bucketName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const getUserFunction = new NodejsFunction(this, 'GetUserFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/users/get.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucket.bucketName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const updateUserFunction = new NodejsFunction(this, 'UpdateUserFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/users/update.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucket.bucketName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const getPublicProfileFunction = new NodejsFunction(this, 'GetPublicProfileFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/users/getPublicProfile.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const blockUserFunction = new NodejsFunction(this, 'BlockUserFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/users/blockUser.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const reportUserFunction = new NodejsFunction(this, 'ReportUserFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/users/reportUser.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    // Grant permissions
    props.table.grantReadWriteData(createUserFunction);
    props.table.grantReadWriteData(getUserFunction);
    props.table.grantReadWriteData(updateUserFunction);
    props.table.grantReadData(getPublicProfileFunction);
    props.table.grantReadWriteData(blockUserFunction);
    props.table.grantReadWriteData(reportUserFunction);
    props.bucket.grantReadWrite(createUserFunction);
    props.bucket.grantReadWrite(updateUserFunction);

    this.functions.push(
      createUserFunction,
      getUserFunction,
      updateUserFunction,
      getPublicProfileFunction,
      blockUserFunction,
      reportUserFunction
    );

    // API Routes
    const users = this.api.root.addResource('users');

    // POST /users - Create user profile
    users.addMethod('POST', new apigateway.LambdaIntegration(createUserFunction), {
      authorizer: this.authorizer,
    });

    const userMe = users.addResource('me');

    // GET /users/me - Get current user profile
    userMe.addMethod('GET', new apigateway.LambdaIntegration(getUserFunction), {
      authorizer: this.authorizer,
    });

    // PUT /users/me - Update current user profile
    userMe.addMethod('PUT', new apigateway.LambdaIntegration(updateUserFunction), {
      authorizer: this.authorizer,
    });

    // GET /users/{userId}/profile - Get public profile
    const userById = users.addResource('{userId}');
    const userProfile = userById.addResource('profile');
    userProfile.addMethod('GET', new apigateway.LambdaIntegration(getPublicProfileFunction), {
      authorizer: this.authorizer,
    });

    // POST /users/{userId}/block - Block a user
    const userBlock = userById.addResource('block');
    userBlock.addMethod('POST', new apigateway.LambdaIntegration(blockUserFunction), {
      authorizer: this.authorizer,
    });

    // POST /reports - Report a user
    const reports = this.api.root.addResource('reports');
    reports.addMethod('POST', new apigateway.LambdaIntegration(reportUserFunction), {
      authorizer: this.authorizer,
    });

    // User Discovery Lambda function
    const discoverUsersFunction = new NodejsFunction(this, 'DiscoverUsersFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/users/discover.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(15),
    });

    props.table.grantReadData(discoverUsersFunction);
    this.functions.push(discoverUsersFunction);

    // GET /users/discover - Discover users with similar interests
    const userDiscover = users.addResource('discover');
    userDiscover.addMethod('GET', new apigateway.LambdaIntegration(discoverUsersFunction), {
      authorizer: this.authorizer,
    });

    // Activity management Lambda functions
    const createActivityFunction = new NodejsFunction(this, 'CreateActivityFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/activities/create.ts'),
      // handler defaults to 'handler' in the bundled index.js
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const listActivitiesFunction = new NodejsFunction(this, 'ListActivitiesFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/activities/list.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const getActivityFunction = new NodejsFunction(this, 'GetActivityFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/activities/get.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const joinActivityFunction = new NodejsFunction(this, 'JoinActivityFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/activities/join.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
        WEBSOCKET_ENDPOINT: props.webSocketEndpoint || '',
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const leaveActivityFunction = new NodejsFunction(this, 'LeaveActivityFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/activities/leave.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
        WEBSOCKET_ENDPOINT: props.webSocketEndpoint || '',
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    // Grant permissions
    props.table.grantReadWriteData(createActivityFunction);
    props.table.grantReadWriteData(listActivitiesFunction);
    props.table.grantReadWriteData(getActivityFunction);
    props.table.grantReadWriteData(joinActivityFunction);
    props.table.grantReadWriteData(leaveActivityFunction);

    this.functions.push(
      createActivityFunction,
      listActivitiesFunction,
      getActivityFunction,
      joinActivityFunction,
      leaveActivityFunction
    );

    // Activity API Routes
    const activities = this.api.root.addResource('activities');

    // POST /activities - Create activity
    activities.addMethod('POST', new apigateway.LambdaIntegration(createActivityFunction), {
      authorizer: this.authorizer,
    });

    // GET /activities - List activities
    activities.addMethod('GET', new apigateway.LambdaIntegration(listActivitiesFunction), {
      authorizer: this.authorizer,
    });

    // GET /activities/{id} - Get activity
    const activityById = activities.addResource('{id}');
    activityById.addMethod('GET', new apigateway.LambdaIntegration(getActivityFunction), {
      authorizer: this.authorizer,
    });

    // PUT /activities/{id} - Update activity
    const updateActivityFunction = new NodejsFunction(this, 'UpdateActivityFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/activities/update.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });
    props.table.grantReadWriteData(updateActivityFunction);
    this.functions.push(updateActivityFunction);

    activityById.addMethod('PUT', new apigateway.LambdaIntegration(updateActivityFunction), {
      authorizer: this.authorizer,
    });

    // POST /activities/{id}/join - Join activity
    const activityJoin = activityById.addResource('join');
    activityJoin.addMethod('POST', new apigateway.LambdaIntegration(joinActivityFunction), {
      authorizer: this.authorizer,
    });

    // POST /activities/{id}/leave - Leave activity
    const activityLeave = activityById.addResource('leave');
    activityLeave.addMethod('POST', new apigateway.LambdaIntegration(leaveActivityFunction), {
      authorizer: this.authorizer,
    });

    // Activity Reviews
    const createReviewFunction = new NodejsFunction(this, 'CreateReviewFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/activities/createReview.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const getReviewsFunction = new NodejsFunction(this, 'GetReviewsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/activities/getReviews.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    props.table.grantReadWriteData(createReviewFunction);
    props.table.grantReadData(getReviewsFunction);
    this.functions.push(createReviewFunction, getReviewsFunction);

    // /activities/{id}/reviews
    const activityReviews = activityById.addResource('reviews');
    activityReviews.addMethod('POST', new apigateway.LambdaIntegration(createReviewFunction), {
      authorizer: this.authorizer,
    });
    activityReviews.addMethod('GET', new apigateway.LambdaIntegration(getReviewsFunction), {
      authorizer: this.authorizer,
    });

    // Chat management Lambda functions
    const createChatRoomFunction = new NodejsFunction(this, 'CreateChatRoomFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/chat/createRoom.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const getChatRoomsFunction = new NodejsFunction(this, 'GetChatRoomsFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/chat/getRooms.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
        DEPLOY_VERSION: '2',
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const getChatRoomFunction = new NodejsFunction(this, 'GetChatRoomFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/chat/getRoom.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    // Grant permissions
    props.table.grantReadWriteData(createChatRoomFunction);
    props.table.grantReadWriteData(getChatRoomsFunction);
    props.table.grantReadWriteData(getChatRoomFunction);

    this.functions.push(createChatRoomFunction, getChatRoomsFunction, getChatRoomFunction);

    // Chat API Routes
    const chat = this.api.root.addResource('chat');
    const chatRooms = chat.addResource('rooms');

    // POST /chat/rooms - Create chat room
    chatRooms.addMethod('POST', new apigateway.LambdaIntegration(createChatRoomFunction), {
      authorizer: this.authorizer,
    });

    // GET /chat/rooms - Get user's chat rooms
    chatRooms.addMethod('GET', new apigateway.LambdaIntegration(getChatRoomsFunction), {
      authorizer: this.authorizer,
    });

    // GET /chat/rooms/{chatRoomId} - Get chat room details
    const chatRoomDetail = chatRooms.addResource('{chatRoomId}');
    chatRoomDetail.addMethod('GET', new apigateway.LambdaIntegration(getChatRoomFunction), {
      authorizer: this.authorizer,
    });

    // Upload management Lambda function
    const getPresignedUrlFunction = new NodejsFunction(this, 'GetPresignedUrlFunctionV2', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/uploads/getPresignedUrl.ts'),
      environment: {
        UPLOADS_BUCKET_NAME: props.bucket.bucketName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    // Grant S3 write permissions
    props.bucket.grantPut(getPresignedUrlFunction);

    this.functions.push(getPresignedUrlFunction);

    // Upload API Routes
    const uploads = this.api.root.addResource('uploads');
    const presignedUrl = uploads.addResource('presigned-url');

    // POST /uploads/presigned-url - Get presigned URL for upload
    presignedUrl.addMethod('POST', new apigateway.LambdaIntegration(getPresignedUrlFunction), {
      authorizer: this.authorizer,
    });

    // Payment Lambda functions
    const frontendUrl = process.env.FRONTEND_URL || 'https://d2s0k9gtsxu3ev.cloudfront.net';
    const paymentEnvironment = {
      TABLE_NAME: props.table.tableName,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      FRONTEND_URL: frontendUrl,
    };

    const createCheckoutSessionFunction = new NodejsFunction(
      this,
      'CreateCheckoutSessionFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, '../../../backend/functions/payment/createCheckoutSession.ts'),
        environment: paymentEnvironment,
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['@aws-sdk/*'],
          forceDockerBundling: false,
        },
        timeout: cdk.Duration.seconds(30),
      }
    );

    const webhookFunction = new NodejsFunction(this, 'WebhookFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/payment/webhook.ts'),
      environment: paymentEnvironment,
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(30),
    });

    const createPortalSessionFunction = new NodejsFunction(
      this,
      'CreatePortalSessionFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, '../../../backend/functions/payment/createPortalSession.ts'),
        environment: paymentEnvironment,
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['@aws-sdk/*'],
          forceDockerBundling: false,
        },
        timeout: cdk.Duration.seconds(30),
      }
    );

    // Grant permissions
    props.table.grantReadWriteData(createCheckoutSessionFunction);
    props.table.grantReadWriteData(webhookFunction);
    props.table.grantReadData(createPortalSessionFunction);

    this.functions.push(
      createCheckoutSessionFunction,
      webhookFunction,
      createPortalSessionFunction
    );

    // Payment API Routes
    const payment = this.api.root.addResource('payment');

    // POST /payment/checkout
    const checkout = payment.addResource('checkout');
    checkout.addMethod('POST', new apigateway.LambdaIntegration(createCheckoutSessionFunction), {
      authorizer: this.authorizer,
    });

    // POST /payment/webhook (no auth required - Stripe will send signature)
    const webhook = payment.addResource('webhook');
    webhook.addMethod('POST', new apigateway.LambdaIntegration(webhookFunction));

    // POST /payment/portal
    const portal = payment.addResource('portal');
    portal.addMethod('POST', new apigateway.LambdaIntegration(createPortalSessionFunction), {
      authorizer: this.authorizer,
    });

    // Photo Gallery Lambda functions
    const uploadPhotoFunction = new NodejsFunction(this, 'UploadPhotoFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/activities/uploadPhoto.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucket.bucketName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const getPhotosFunction = new NodejsFunction(this, 'GetPhotosFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/activities/getPhotos.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(10),
    });

    // Grant permissions for photo functions
    props.table.grantReadWriteData(uploadPhotoFunction);
    props.table.grantReadData(getPhotosFunction);
    props.bucket.grantReadWrite(uploadPhotoFunction);

    this.functions.push(uploadPhotoFunction, getPhotosFunction);

    // Photo API Routes - POST/GET /activities/{id}/photos
    const activityPhotos = activityById.addResource('photos');
    activityPhotos.addMethod('POST', new apigateway.LambdaIntegration(uploadPhotoFunction), {
      authorizer: this.authorizer,
    });
    activityPhotos.addMethod('GET', new apigateway.LambdaIntegration(getPhotosFunction), {
      authorizer: this.authorizer,
    });

    // Recommendations Lambda function
    const getRecommendationsFunction = new NodejsFunction(this, 'GetRecommendationsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/recommendations/get.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(30),
    });

    props.table.grantReadData(getRecommendationsFunction);
    this.functions.push(getRecommendationsFunction);

    // Recommendations API Route - GET /recommendations
    const recommendations = this.api.root.addResource('recommendations');
    recommendations.addMethod('GET', new apigateway.LambdaIntegration(getRecommendationsFunction), {
      authorizer: this.authorizer,
    });

    // Verification Lambda functions
    const verificationCheckoutFunction = new NodejsFunction(this, 'VerificationCheckout', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/verification/createCheckout.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
        FRONTEND_URL: frontendUrl,
      },
      bundling: { minify: true, sourceMap: true, externalModules: ['@aws-sdk/*'], forceDockerBundling: false },
      timeout: cdk.Duration.seconds(30),
    });

    const getVerificationStatusFunction = new NodejsFunction(this, 'GetVerificationStatus', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/verification/getStatus.ts'),
      environment: { TABLE_NAME: props.table.tableName },
      bundling: { minify: true, sourceMap: true, externalModules: ['@aws-sdk/*'], forceDockerBundling: false },
      timeout: cdk.Duration.seconds(10),
    });

    const approveVerificationFunction = new NodejsFunction(this, 'ApproveVerification', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/verification/approve.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
        ADMIN_USER_IDS: process.env.ADMIN_USER_IDS || '',
      },
      bundling: { minify: true, sourceMap: true, externalModules: ['@aws-sdk/*'], forceDockerBundling: false },
      timeout: cdk.Duration.seconds(10),
    });

    const rejectVerificationFunction = new NodejsFunction(this, 'RejectVerification', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/functions/verification/reject.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
        ADMIN_USER_IDS: process.env.ADMIN_USER_IDS || '',
      },
      bundling: { minify: true, sourceMap: true, externalModules: ['@aws-sdk/*'], forceDockerBundling: false },
      timeout: cdk.Duration.seconds(10),
    });

    props.table.grantReadWriteData(verificationCheckoutFunction);
    props.table.grantReadData(getVerificationStatusFunction);
    props.table.grantReadWriteData(approveVerificationFunction);
    props.table.grantReadWriteData(rejectVerificationFunction);

    this.functions.push(
      verificationCheckoutFunction,
      getVerificationStatusFunction,
      approveVerificationFunction,
      rejectVerificationFunction,
    );

    // Verification API Routes
    const verification = this.api.root.addResource('verification');

    const verificationCheckoutResource = verification.addResource('checkout');
    verificationCheckoutResource.addMethod('POST', new apigateway.LambdaIntegration(verificationCheckoutFunction), {
      authorizer: this.authorizer,
    });

    const verificationStatusResource = verification.addResource('status');
    verificationStatusResource.addMethod('GET', new apigateway.LambdaIntegration(getVerificationStatusFunction), {
      authorizer: this.authorizer,
    });

    const verificationApproveResource = verification.addResource('approve');
    verificationApproveResource.addMethod('POST', new apigateway.LambdaIntegration(approveVerificationFunction), {
      authorizer: this.authorizer,
    });

    const verificationRejectResource = verification.addResource('reject');
    verificationRejectResource.addMethod('POST', new apigateway.LambdaIntegration(rejectVerificationFunction), {
      authorizer: this.authorizer,
    });

    // Add CORS headers to all gateway responses (including errors)
    this.api.addGatewayResponse('Default4XX', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': `'*'`,
        'Access-Control-Allow-Headers': `'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'`,
        'Access-Control-Allow-Methods': `'GET,POST,PUT,DELETE,OPTIONS'`,
      },
    });

    this.api.addGatewayResponse('Default5XX', {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': `'*'`,
        'Access-Control-Allow-Headers': `'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'`,
        'Access-Control-Allow-Methods': `'GET,POST,PUT,DELETE,OPTIONS'`,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.apiEndpoint,
      exportName: `Connect40-ApiEndpoint-${props.envName}`,
    });
  }
}

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const path = __importStar(require("path"));
class ApiStack extends cdk.Stack {
    api;
    apiEndpoint;
    authorizer;
    functions = [];
    constructor(scope, id, props) {
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
        const createUserFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'CreateUserFunctionV2', {
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
        const getUserFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetUserFunctionV2', {
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
        const updateUserFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'UpdateUserFunctionV2', {
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
        const getPublicProfileFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetPublicProfileFunction', {
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
        const blockUserFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'BlockUserFunction', {
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
        const reportUserFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'ReportUserFunction', {
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
        this.functions.push(createUserFunction, getUserFunction, updateUserFunction, getPublicProfileFunction, blockUserFunction, reportUserFunction);
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
        const discoverUsersFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'DiscoverUsersFunction', {
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
        const createActivityFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'CreateActivityFunctionV2', {
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
        const listActivitiesFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'ListActivitiesFunctionV2', {
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
        const getActivityFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetActivityFunctionV2', {
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
        const joinActivityFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'JoinActivityFunctionV2', {
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
        const leaveActivityFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'LeaveActivityFunctionV2', {
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
        this.functions.push(createActivityFunction, listActivitiesFunction, getActivityFunction, joinActivityFunction, leaveActivityFunction);
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
        const updateActivityFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'UpdateActivityFunctionV2', {
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
        const createReviewFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'CreateReviewFunction', {
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
        const getReviewsFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetReviewsFunction', {
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
        const createChatRoomFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'CreateChatRoomFunctionV2', {
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
        const getChatRoomsFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetChatRoomsFunctionV2', {
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
        const getChatRoomFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetChatRoomFunctionV2', {
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
        const markRoomReadFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'MarkRoomReadFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: path.join(__dirname, '../../../backend/functions/chat/markRoomRead.ts'),
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
        props.table.grantReadWriteData(markRoomReadFunction);
        this.functions.push(createChatRoomFunction, getChatRoomsFunction, getChatRoomFunction, markRoomReadFunction);
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
        // POST /chat/rooms/{chatRoomId}/read - Mark room as read
        const chatRoomRead = chatRoomDetail.addResource('read');
        chatRoomRead.addMethod('POST', new apigateway.LambdaIntegration(markRoomReadFunction), {
            authorizer: this.authorizer,
        });
        // Upload management Lambda function
        const getPresignedUrlFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetPresignedUrlFunctionV2', {
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
        const createCheckoutSessionFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'CreateCheckoutSessionFunction', {
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
        });
        const webhookFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'WebhookFunction', {
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
        const createPortalSessionFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'CreatePortalSessionFunction', {
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
        });
        // Grant permissions
        props.table.grantReadWriteData(createCheckoutSessionFunction);
        props.table.grantReadWriteData(webhookFunction);
        props.table.grantReadData(createPortalSessionFunction);
        this.functions.push(createCheckoutSessionFunction, webhookFunction, createPortalSessionFunction);
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
        const uploadPhotoFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'UploadPhotoFunction', {
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
        const getPhotosFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetPhotosFunction', {
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
        const getRecommendationsFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetRecommendationsFunction', {
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
        // Activity Join Checkout Lambda function
        const joinActivityCheckoutFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'JoinActivityCheckoutFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: path.join(__dirname, '../../../backend/functions/activities/joinCheckout.ts'),
            environment: {
                TABLE_NAME: props.table.tableName,
                STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
                FRONTEND_URL: frontendUrl,
            },
            bundling: { minify: true, sourceMap: true, externalModules: ['@aws-sdk/*'], forceDockerBundling: false },
            timeout: cdk.Duration.seconds(30),
        });
        props.table.grantReadWriteData(joinActivityCheckoutFunction);
        this.functions.push(joinActivityCheckoutFunction);
        // POST /activities/{id}/join-checkout
        const activityJoinCheckout = activityById.addResource('join-checkout');
        activityJoinCheckout.addMethod('POST', new apigateway.LambdaIntegration(joinActivityCheckoutFunction), {
            authorizer: this.authorizer,
        });
        // Verification Lambda functions
        const verificationCheckoutFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'VerificationCheckout', {
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
        const getVerificationStatusFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetVerificationStatus', {
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: path.join(__dirname, '../../../backend/functions/verification/getStatus.ts'),
            environment: { TABLE_NAME: props.table.tableName },
            bundling: { minify: true, sourceMap: true, externalModules: ['@aws-sdk/*'], forceDockerBundling: false },
            timeout: cdk.Duration.seconds(10),
        });
        const approveVerificationFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'ApproveVerification', {
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: path.join(__dirname, '../../../backend/functions/verification/approve.ts'),
            environment: {
                TABLE_NAME: props.table.tableName,
                ADMIN_USER_IDS: process.env.ADMIN_USER_IDS || '',
            },
            bundling: { minify: true, sourceMap: true, externalModules: ['@aws-sdk/*'], forceDockerBundling: false },
            timeout: cdk.Duration.seconds(10),
        });
        const rejectVerificationFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'RejectVerification', {
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
        this.functions.push(verificationCheckoutFunction, getVerificationStatusFunction, approveVerificationFunction, rejectVerificationFunction);
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
        // AI Text Refinement Lambda function
        const refineTextFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'RefineTextFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: path.join(__dirname, '../../../backend/functions/ai/refineText.ts'),
            environment: {},
            bundling: {
                minify: true,
                sourceMap: true,
                externalModules: ['@aws-sdk/*'],
                forceDockerBundling: false,
            },
            timeout: cdk.Duration.seconds(30),
        });
        // Grant Bedrock InvokeModel permission
        refineTextFunction.addToRolePolicy(new iam.PolicyStatement({
            actions: ['bedrock:InvokeModel'],
            resources: [
                'arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0',
                'arn:aws:bedrock:*:*:inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0',
                'arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
            ],
        }));
        this.functions.push(refineTextFunction);
        // AI API Routes - POST /ai/refine
        const ai = this.api.root.addResource('ai');
        const aiRefine = ai.addResource('refine');
        aiRefine.addMethod('POST', new apigateway.LambdaIntegration(refineTextFunction), {
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
exports.ApiStack = ApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFDekQsK0RBQWlEO0FBQ2pELHFFQUErRDtBQUcvRCx5REFBMkM7QUFHM0MsMkNBQTZCO0FBVTdCLE1BQWEsUUFBUyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3JCLEdBQUcsQ0FBcUI7SUFDeEIsV0FBVyxDQUFTO0lBQ3BCLFVBQVUsQ0FBd0M7SUFDbEQsU0FBUyxHQUFzQixFQUFFLENBQUM7SUFFbEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFvQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixtQkFBbUI7UUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUM3QyxXQUFXLEVBQUUsaUJBQWlCLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDN0MsV0FBVyxFQUFFLG9CQUFvQjtZQUNqQyxhQUFhLEVBQUU7Z0JBQ2IsU0FBUyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUN4QixjQUFjLEVBQUUsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJO2dCQUNoRCxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsT0FBTyxLQUFLLE1BQU07Z0JBQzFDLGNBQWMsRUFBRSxJQUFJO2FBQ3JCO1lBQ0QsMkJBQTJCLEVBQUU7Z0JBQzNCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxvQ0FBb0M7Z0JBQy9FLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pDLFlBQVksRUFBRTtvQkFDWixjQUFjO29CQUNkLGVB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ckQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBNzFCRCw0QkE2MUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgTm9kZWpzRnVuY3Rpb24gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLW5vZGVqcyc7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFwaVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGVudk5hbWU6IHN0cmluZztcbiAgdXNlclBvb2w6IGNvZ25pdG8uVXNlclBvb2w7XG4gIHRhYmxlOiBkeW5hbW9kYi5UYWJsZTtcbiAgYnVja2V0OiBzMy5CdWNrZXQ7XG4gIHdlYlNvY2tldEVuZHBvaW50Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQXBpU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XG4gIHB1YmxpYyByZWFkb25seSBhcGlFbmRwb2ludDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgYXV0aG9yaXplcjogYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcjtcbiAgcHVibGljIHJlYWRvbmx5IGZ1bmN0aW9uczogbGFtYmRhLkZ1bmN0aW9uW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQXBpU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gUkVTVCBBUEkgR2F0ZXdheVxuICAgIHRoaXMuYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnQXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6IGBDb25uZWN0NDAtQXBpLSR7cHJvcHMuZW52TmFtZX1gLFxuICAgICAgZGVzY3JpcHRpb246ICdDb25uZWN0NDAgUkVTVCBBUEknLFxuICAgICAgZGVwbG95T3B0aW9uczoge1xuICAgICAgICBzdGFnZU5hbWU6IHByb3BzLmVudk5hbWUsXG4gICAgICAgIHRyYWNpbmdFbmFibGVkOiB0cnVlLFxuICAgICAgICBsb2dnaW5nTGV2ZWw6IGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLklORk8sXG4gICAgICAgIGRhdGFUcmFjZUVuYWJsZWQ6IHByb3BzLmVudk5hbWUgIT09ICdwcm9kJyxcbiAgICAgICAgbWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICB9LFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLCAvLyBUT0RPOiBSZXN0cmljdCB0byBmcm9udGVuZCBkb21haW5cbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICAgIGFsbG93SGVhZGVyczogW1xuICAgICAgICAgICdDb250ZW50LVR5cGUnLFxuICAgICAgICAgICdBdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAnWC1BbXotRGF0ZScsXG4gICAgICAgICAgJ1gtQXBpLUtleScsXG4gICAgICAgICAgJ1gtQW16LVNlY3VyaXR5LVRva2VuJyxcbiAgICAgICAgICAnWC1BbXotVXNlci1BZ2VudCcsXG4gICAgICAgIF0sXG4gICAgICAgIGFsbG93Q3JlZGVudGlhbHM6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hcGlFbmRwb2ludCA9IHRoaXMuYXBpLnVybDtcblxuICAgIC8vIExhbWJkYSBMYXllciBmb3IgY29tbW9uIGNvZGUgLSBURU1QT1JBUklMWSBESVNBQkxFRFxuICAgIC8vIFRPRE86IEZpeCBsYXllciBzdHJ1Y3R1cmUgdG8gbWF0Y2ggTGFtYmRhIHJlcXVpcmVtZW50c1xuICAgIC8vIGNvbnN0IGNvbW1vbkxheWVyID0gbmV3IGxhbWJkYS5MYXllclZlcnNpb24odGhpcywgJ0NvbW1vbkxheWVyJywge1xuICAgIC8vICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2xheWVycy9jb21tb24nKSksXG4gICAgLy8gICBjb21wYXRpYmxlUnVudGltZXM6IFtsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWF0sXG4gICAgLy8gICBkZXNjcmlwdGlvbjogJ0NvbW1vbiB1dGlsaXRpZXMgYW5kIER5bmFtb0RCIGNsaWVudCcsXG4gICAgLy8gfSk7XG5cbiAgICAvLyBDb2duaXRvIEF1dGhvcml6ZXJcbiAgICB0aGlzLmF1dGhvcml6ZXIgPSBuZXcgYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcih0aGlzLCAnQXV0aG9yaXplcicsIHtcbiAgICAgIGNvZ25pdG9Vc2VyUG9vbHM6IFtwcm9wcy51c2VyUG9vbF0sXG4gICAgfSk7XG5cbiAgICAvLyBVc2VyIG1hbmFnZW1lbnQgTGFtYmRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IGNyZWF0ZVVzZXJGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnQ3JlYXRlVXNlckZ1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdXNlcnMvY3JlYXRlLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEJVQ0tFVF9OQU1FOiBwcm9wcy5idWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZ2V0VXNlckZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRVc2VyRnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy91c2Vycy9nZXQudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQlVDS0VUX05BTUU6IHByb3BzLmJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCB1cGRhdGVVc2VyRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1VwZGF0ZVVzZXJGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VzZXJzL3VwZGF0ZS50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgICBCVUNLRVRfTkFNRTogcHJvcHMuYnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdldFB1YmxpY1Byb2ZpbGVGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnR2V0UHVibGljUHJvZmlsZUZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VzZXJzL2dldFB1YmxpY1Byb2ZpbGUudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYmxvY2tVc2VyRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0Jsb2NrVXNlckZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VzZXJzL2Jsb2NrVXNlci50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCByZXBvcnRVc2VyRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1JlcG9ydFVzZXJGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy91c2Vycy9yZXBvcnRVc2VyLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNyZWF0ZVVzZXJGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGdldFVzZXJGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHVwZGF0ZVVzZXJGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkRGF0YShnZXRQdWJsaWNQcm9maWxlRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShibG9ja1VzZXJGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHJlcG9ydFVzZXJGdW5jdGlvbik7XG4gICAgcHJvcHMuYnVja2V0LmdyYW50UmVhZFdyaXRlKGNyZWF0ZVVzZXJGdW5jdGlvbik7XG4gICAgcHJvcHMuYnVja2V0LmdyYW50UmVhZFdyaXRlKHVwZGF0ZVVzZXJGdW5jdGlvbik7XG5cbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKFxuICAgICAgY3JlYXRlVXNlckZ1bmN0aW9uLFxuICAgICAgZ2V0VXNlckZ1bmN0aW9uLFxuICAgICAgdXBkYXRlVXNlckZ1bmN0aW9uLFxuICAgICAgZ2V0UHVibGljUHJvZmlsZUZ1bmN0aW9uLFxuICAgICAgYmxvY2tVc2VyRnVuY3Rpb24sXG4gICAgICByZXBvcnRVc2VyRnVuY3Rpb25cbiAgICApO1xuXG4gICAgLy8gQVBJIFJvdXRlc1xuICAgIGNvbnN0IHVzZXJzID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgndXNlcnMnKTtcblxuICAgIC8vIFBPU1QgL3VzZXJzIC0gQ3JlYXRlIHVzZXIgcHJvZmlsZVxuICAgIHVzZXJzLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZVVzZXJGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJNZSA9IHVzZXJzLmFkZFJlc291cmNlKCdtZScpO1xuXG4gICAgLy8gR0VUIC91c2Vycy9tZSAtIEdldCBjdXJyZW50IHVzZXIgcHJvZmlsZVxuICAgIHVzZXJNZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldFVzZXJGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFBVVCAvdXNlcnMvbWUgLSBVcGRhdGUgY3VycmVudCB1c2VyIHByb2ZpbGVcbiAgICB1c2VyTWUuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih1cGRhdGVVc2VyRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBHRVQgL3VzZXJzL3t1c2VySWR9L3Byb2ZpbGUgLSBHZXQgcHVibGljIHByb2ZpbGVcbiAgICBjb25zdCB1c2VyQnlJZCA9IHVzZXJzLmFkZFJlc291cmNlKCd7dXNlcklkfScpO1xuICAgIGNvbnN0IHVzZXJQcm9maWxlID0gdXNlckJ5SWQuYWRkUmVzb3VyY2UoJ3Byb2ZpbGUnKTtcbiAgICB1c2VyUHJvZmlsZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldFB1YmxpY1Byb2ZpbGVGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFBPU1QgL3VzZXJzL3t1c2VySWR9L2Jsb2NrIC0gQmxvY2sgYSB1c2VyXG4gICAgY29uc3QgdXNlckJsb2NrID0gdXNlckJ5SWQuYWRkUmVzb3VyY2UoJ2Jsb2NrJyk7XG4gICAgdXNlckJsb2NrLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGJsb2NrVXNlckZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUE9TVCAvcmVwb3J0cyAtIFJlcG9ydCBhIHVzZXJcbiAgICBjb25zdCByZXBvcnRzID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgncmVwb3J0cycpO1xuICAgIHJlcG9ydHMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocmVwb3J0VXNlckZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gVXNlciBEaXNjb3ZlcnkgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgZGlzY292ZXJVc2Vyc0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdEaXNjb3ZlclVzZXJzRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdXNlcnMvZGlzY292ZXIudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTUpLFxuICAgIH0pO1xuXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkRGF0YShkaXNjb3ZlclVzZXJzRnVuY3Rpb24pO1xuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2goZGlzY292ZXJVc2Vyc0Z1bmN0aW9uKTtcblxuICAgIC8vIEdFVCAvdXNlcnMvZGlzY292ZXIgLSBEaXNjb3ZlciB1c2VycyB3aXRoIHNpbWlsYXIgaW50ZXJlc3RzXG4gICAgY29uc3QgdXNlckRpc2NvdmVyID0gdXNlcnMuYWRkUmVzb3VyY2UoJ2Rpc2NvdmVyJyk7XG4gICAgdXNlckRpc2NvdmVyLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZGlzY292ZXJVc2Vyc0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gQWN0aXZpdHkgbWFuYWdlbWVudCBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgY3JlYXRlQWN0aXZpdHlGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnQ3JlYXRlQWN0aXZpdHlGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMvY3JlYXRlLnRzJyksXG4gICAgICAvLyBoYW5kbGVyIGRlZmF1bHRzIHRvICdoYW5kbGVyJyBpbiB0aGUgYnVuZGxlZCBpbmRleC5qc1xuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0QWN0aXZpdGllc0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdMaXN0QWN0aXZpdGllc0Z1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvYWN0aXZpdGllcy9saXN0LnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdldEFjdGl2aXR5RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldEFjdGl2aXR5RnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2dldC50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBqb2luQWN0aXZpdHlGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnSm9pbkFjdGl2aXR5RnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2pvaW4udHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgV0VCU09DS0VUX0VORFBPSU5UOiBwcm9wcy53ZWJTb2NrZXRFbmRwb2ludCB8fCAnJyxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbGVhdmVBY3Rpdml0eUZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdMZWF2ZUFjdGl2aXR5RnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2xlYXZlLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFdFQlNPQ0tFVF9FTkRQT0lOVDogcHJvcHMud2ViU29ja2V0RW5kcG9pbnQgfHwgJycsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNyZWF0ZUFjdGl2aXR5RnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsaXN0QWN0aXZpdGllc0Z1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZ2V0QWN0aXZpdHlGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGpvaW5BY3Rpdml0eUZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEobGVhdmVBY3Rpdml0eUZ1bmN0aW9uKTtcblxuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2goXG4gICAgICBjcmVhdGVBY3Rpdml0eUZ1bmN0aW9uLFxuICAgICAgbGlzdEFjdGl2aXRpZXNGdW5jdGlvbixcbiAgICAgIGdldEFjdGl2aXR5RnVuY3Rpb24sXG4gICAgICBqb2luQWN0aXZpdHlGdW5jdGlvbixcbiAgICAgIGxlYXZlQWN0aXZpdHlGdW5jdGlvblxuICAgICk7XG5cbiAgICAvLyBBY3Rpdml0eSBBUEkgUm91dGVzXG4gICAgY29uc3QgYWN0aXZpdGllcyA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2FjdGl2aXRpZXMnKTtcblxuICAgIC8vIFBPU1QgL2FjdGl2aXRpZXMgLSBDcmVhdGUgYWN0aXZpdHlcbiAgICBhY3Rpdml0aWVzLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUFjdGl2aXR5RnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBHRVQgL2FjdGl2aXRpZXMgLSBMaXN0IGFjdGl2aXRpZXNcbiAgICBhY3Rpdml0aWVzLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGlzdEFjdGl2aXRpZXNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIEdFVCAvYWN0aXZpdGllcy97aWR9IC0gR2V0IGFjdGl2aXR5XG4gICAgY29uc3QgYWN0aXZpdHlCeUlkID0gYWN0aXZpdGllcy5hZGRSZXNvdXJjZSgne2lkfScpO1xuICAgIGFjdGl2aXR5QnlJZC5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldEFjdGl2aXR5RnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBQVVQgL2FjdGl2aXRpZXMve2lkfSAtIFVwZGF0ZSBhY3Rpdml0eVxuICAgIGNvbnN0IHVwZGF0ZUFjdGl2aXR5RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1VwZGF0ZUFjdGl2aXR5RnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL3VwZGF0ZS50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHVwZGF0ZUFjdGl2aXR5RnVuY3Rpb24pO1xuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2godXBkYXRlQWN0aXZpdHlGdW5jdGlvbik7XG5cbiAgICBhY3Rpdml0eUJ5SWQuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih1cGRhdGVBY3Rpdml0eUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUE9TVCAvYWN0aXZpdGllcy97aWR9L2pvaW4gLSBKb2luIGFjdGl2aXR5XG4gICAgY29uc3QgYWN0aXZpdHlKb2luID0gYWN0aXZpdHlCeUlkLmFkZFJlc291cmNlKCdqb2luJyk7XG4gICAgYWN0aXZpdHlKb2luLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGpvaW5BY3Rpdml0eUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUE9TVCAvYWN0aXZpdGllcy97aWR9L2xlYXZlIC0gTGVhdmUgYWN0aXZpdHlcbiAgICBjb25zdCBhY3Rpdml0eUxlYXZlID0gYWN0aXZpdHlCeUlkLmFkZFJlc291cmNlKCdsZWF2ZScpO1xuICAgIGFjdGl2aXR5TGVhdmUuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGVhdmVBY3Rpdml0eUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gQWN0aXZpdHkgUmV2aWV3c1xuICAgIGNvbnN0IGNyZWF0ZVJldmlld0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdDcmVhdGVSZXZpZXdGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2NyZWF0ZVJldmlldy50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRSZXZpZXdzRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldFJldmlld3NGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2dldFJldmlld3MudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNyZWF0ZVJldmlld0Z1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWREYXRhKGdldFJldmlld3NGdW5jdGlvbik7XG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChjcmVhdGVSZXZpZXdGdW5jdGlvbiwgZ2V0UmV2aWV3c0Z1bmN0aW9uKTtcblxuICAgIC8vIC9hY3Rpdml0aWVzL3tpZH0vcmV2aWV3c1xuICAgIGNvbnN0IGFjdGl2aXR5UmV2aWV3cyA9IGFjdGl2aXR5QnlJZC5hZGRSZXNvdXJjZSgncmV2aWV3cycpO1xuICAgIGFjdGl2aXR5UmV2aWV3cy5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihjcmVhdGVSZXZpZXdGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcbiAgICBhY3Rpdml0eVJldmlld3MuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRSZXZpZXdzRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBDaGF0IG1hbmFnZW1lbnQgTGFtYmRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IGNyZWF0ZUNoYXRSb29tRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0NyZWF0ZUNoYXRSb29tRnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9jaGF0L2NyZWF0ZVJvb20udHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZ2V0Q2hhdFJvb21zRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldENoYXRSb29tc0Z1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvY2hhdC9nZXRSb29tcy50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgICBERVBMT1lfVkVSU0lPTjogJzInLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRDaGF0Um9vbUZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRDaGF0Um9vbUZ1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvY2hhdC9nZXRSb29tLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG1hcmtSb29tUmVhZEZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdNYXJrUm9vbVJlYWRGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9jaGF0L21hcmtSb29tUmVhZC50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9uc1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShjcmVhdGVDaGF0Um9vbUZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZ2V0Q2hhdFJvb21zRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShnZXRDaGF0Um9vbUZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEobWFya1Jvb21SZWFkRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChjcmVhdGVDaGF0Um9vbUZ1bmN0aW9uLCBnZXRDaGF0Um9vbXNGdW5jdGlvbiwgZ2V0Q2hhdFJvb21GdW5jdGlvbiwgbWFya1Jvb21SZWFkRnVuY3Rpb24pO1xuXG4gICAgLy8gQ2hhdCBBUEkgUm91dGVzXG4gICAgY29uc3QgY2hhdCA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2NoYXQnKTtcbiAgICBjb25zdCBjaGF0Um9vbXMgPSBjaGF0LmFkZFJlc291cmNlKCdyb29tcycpO1xuXG4gICAgLy8gUE9TVCAvY2hhdC9yb29tcyAtIENyZWF0ZSBjaGF0IHJvb21cbiAgICBjaGF0Um9vbXMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oY3JlYXRlQ2hhdFJvb21GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIEdFVCAvY2hhdC9yb29tcyAtIEdldCB1c2VyJ3MgY2hhdCByb29tc1xuICAgIGNoYXRSb29tcy5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldENoYXRSb29tc0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gR0VUIC9jaGF0L3Jvb21zL3tjaGF0Um9vbUlkfSAtIEdldCBjaGF0IHJvb20gZGV0YWlsc1xuICAgIGNvbnN0IGNoYXRSb29tRGV0YWlsID0gY2hhdFJvb21zLmFkZFJlc291cmNlKCd7Y2hhdFJvb21JZH0nKTtcbiAgICBjaGF0Um9vbURldGFpbC5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldENoYXRSb29tRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBQT1NUIC9jaGF0L3Jvb21zL3tjaGF0Um9vbUlkfS9yZWFkIC0gTWFyayByb29tIGFzIHJlYWRcbiAgICBjb25zdCBjaGF0Um9vbVJlYWQgPSBjaGF0Um9vbURldGFpbC5hZGRSZXNvdXJjZSgncmVhZCcpO1xuICAgIGNoYXRSb29tUmVhZC5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihtYXJrUm9vbVJlYWRGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFVwbG9hZCBtYW5hZ2VtZW50IExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGdldFByZXNpZ25lZFVybEZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRQcmVzaWduZWRVcmxGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VwbG9hZHMvZ2V0UHJlc2lnbmVkVXJsLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBVUExPQURTX0JVQ0tFVF9OQU1FOiBwcm9wcy5idWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgUzMgd3JpdGUgcGVybWlzc2lvbnNcbiAgICBwcm9wcy5idWNrZXQuZ3JhbnRQdXQoZ2V0UHJlc2lnbmVkVXJsRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChnZXRQcmVzaWduZWRVcmxGdW5jdGlvbik7XG5cbiAgICAvLyBVcGxvYWQgQVBJIFJvdXRlc1xuICAgIGNvbnN0IHVwbG9hZHMgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCd1cGxvYWRzJyk7XG4gICAgY29uc3QgcHJlc2lnbmVkVXJsID0gdXBsb2Fkcy5hZGRSZXNvdXJjZSgncHJlc2lnbmVkLXVybCcpO1xuXG4gICAgLy8gUE9TVCAvdXBsb2Fkcy9wcmVzaWduZWQtdXJsIC0gR2V0IHByZXNpZ25lZCBVUkwgZm9yIHVwbG9hZFxuICAgIHByZXNpZ25lZFVybC5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRQcmVzaWduZWRVcmxGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFBheW1lbnQgTGFtYmRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IGZyb250ZW5kVXJsID0gcHJvY2Vzcy5lbnYuRlJPTlRFTkRfVVJMIHx8ICdodHRwczovL2QyczBrOWd0c3h1M2V2LmNsb3VkZnJvbnQubmV0JztcbiAgICBjb25zdCBwYXltZW50RW52aXJvbm1lbnQgPSB7XG4gICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICBTVFJJUEVfU0VDUkVUX0tFWTogcHJvY2Vzcy5lbnYuU1RSSVBFX1NFQ1JFVF9LRVkgfHwgJycsXG4gICAgICBTVFJJUEVfV0VCSE9PS19TRUNSRVQ6IHByb2Nlc3MuZW52LlNUUklQRV9XRUJIT09LX1NFQ1JFVCB8fCAnJyxcbiAgICAgIEZST05URU5EX1VSTDogZnJvbnRlbmRVcmwsXG4gICAgfTtcblxuICAgIGNvbnN0IGNyZWF0ZUNoZWNrb3V0U2Vzc2lvbkZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgICdDcmVhdGVDaGVja291dFNlc3Npb25GdW5jdGlvbicsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3BheW1lbnQvY3JlYXRlQ2hlY2tvdXRTZXNzaW9uLnRzJyksXG4gICAgICAgIGVudmlyb25tZW50OiBwYXltZW50RW52aXJvbm1lbnQsXG4gICAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IHdlYmhvb2tGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnV2ViaG9va0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3BheW1lbnQvd2ViaG9vay50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHBheW1lbnRFbnZpcm9ubWVudCxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBjcmVhdGVQb3J0YWxTZXNzaW9uRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24oXG4gICAgICB0aGlzLFxuICAgICAgJ0NyZWF0ZVBvcnRhbFNlc3Npb25GdW5jdGlvbicsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3BheW1lbnQvY3JlYXRlUG9ydGFsU2Vzc2lvbi50cycpLFxuICAgICAgICBlbnZpcm9ubWVudDogcGF5bWVudEVudmlyb25tZW50LFxuICAgICAgICBidW5kbGluZzoge1xuICAgICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9uc1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShjcmVhdGVDaGVja291dFNlc3Npb25GdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHdlYmhvb2tGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkRGF0YShjcmVhdGVQb3J0YWxTZXNzaW9uRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChcbiAgICAgIGNyZWF0ZUNoZWNrb3V0U2Vzc2lvbkZ1bmN0aW9uLFxuICAgICAgd2ViaG9va0Z1bmN0aW9uLFxuICAgICAgY3JlYXRlUG9ydGFsU2Vzc2lvbkZ1bmN0aW9uXG4gICAgKTtcblxuICAgIC8vIFBheW1lbnQgQVBJIFJvdXRlc1xuICAgIGNvbnN0IHBheW1lbnQgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdwYXltZW50Jyk7XG5cbiAgICAvLyBQT1NUIC9wYXltZW50L2NoZWNrb3V0XG4gICAgY29uc3QgY2hlY2tvdXQgPSBwYXltZW50LmFkZFJlc291cmNlKCdjaGVja291dCcpO1xuICAgIGNoZWNrb3V0LmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUNoZWNrb3V0U2Vzc2lvbkZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUE9TVCAvcGF5bWVudC93ZWJob29rIChubyBhdXRoIHJlcXVpcmVkIC0gU3RyaXBlIHdpbGwgc2VuZCBzaWduYXR1cmUpXG4gICAgY29uc3Qgd2ViaG9vayA9IHBheW1lbnQuYWRkUmVzb3VyY2UoJ3dlYmhvb2snKTtcbiAgICB3ZWJob29rLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHdlYmhvb2tGdW5jdGlvbikpO1xuXG4gICAgLy8gUE9TVCAvcGF5bWVudC9wb3J0YWxcbiAgICBjb25zdCBwb3J0YWwgPSBwYXltZW50LmFkZFJlc291cmNlKCdwb3J0YWwnKTtcbiAgICBwb3J0YWwuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oY3JlYXRlUG9ydGFsU2Vzc2lvbkZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUGhvdG8gR2FsbGVyeSBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgdXBsb2FkUGhvdG9GdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnVXBsb2FkUGhvdG9GdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL3VwbG9hZFBob3RvLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEJVQ0tFVF9OQU1FOiBwcm9wcy5idWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZ2V0UGhvdG9zRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldFBob3Rvc0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMvZ2V0UGhvdG9zLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zIGZvciBwaG90byBmdW5jdGlvbnNcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEodXBsb2FkUGhvdG9GdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkRGF0YShnZXRQaG90b3NGdW5jdGlvbik7XG4gICAgcHJvcHMuYnVja2V0LmdyYW50UmVhZFdyaXRlKHVwbG9hZFBob3RvRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaCh1cGxvYWRQaG90b0Z1bmN0aW9uLCBnZXRQaG90b3NGdW5jdGlvbik7XG5cbiAgICAvLyBQaG90byBBUEkgUm91dGVzIC0gUE9TVC9HRVQgL2FjdGl2aXRpZXMve2lkfS9waG90b3NcbiAgICBjb25zdCBhY3Rpdml0eVBob3RvcyA9IGFjdGl2aXR5QnlJZC5hZGRSZXNvdXJjZSgncGhvdG9zJyk7XG4gICAgYWN0aXZpdHlQaG90b3MuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odXBsb2FkUGhvdG9GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcbiAgICBhY3Rpdml0eVBob3Rvcy5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldFBob3Rvc0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUmVjb21tZW5kYXRpb25zIExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGdldFJlY29tbWVuZGF0aW9uc0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRSZWNvbW1lbmRhdGlvbnNGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9yZWNvbW1lbmRhdGlvbnMvZ2V0LnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KTtcblxuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZERhdGEoZ2V0UmVjb21tZW5kYXRpb25zRnVuY3Rpb24pO1xuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2goZ2V0UmVjb21tZW5kYXRpb25zRnVuY3Rpb24pO1xuXG4gICAgLy8gUmVjb21tZW5kYXRpb25zIEFQSSBSb3V0ZSAtIEdFVCAvcmVjb21tZW5kYXRpb25zXG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgncmVjb21tZW5kYXRpb25zJyk7XG4gICAgcmVjb21tZW5kYXRpb25zLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0UmVjb21tZW5kYXRpb25zRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBBY3Rpdml0eSBKb2luIENoZWNrb3V0IExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGpvaW5BY3Rpdml0eUNoZWNrb3V0RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0pvaW5BY3Rpdml0eUNoZWNrb3V0RnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvYWN0aXZpdGllcy9qb2luQ2hlY2tvdXQudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgU1RSSVBFX1NFQ1JFVF9LRVk6IHByb2Nlc3MuZW52LlNUUklQRV9TRUNSRVRfS0VZIHx8ICcnLFxuICAgICAgICBGUk9OVEVORF9VUkw6IGZyb250ZW5kVXJsLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7IG1pbmlmeTogdHJ1ZSwgc291cmNlTWFwOiB0cnVlLCBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLCBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgIH0pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShqb2luQWN0aXZpdHlDaGVja291dEZ1bmN0aW9uKTtcbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKGpvaW5BY3Rpdml0eUNoZWNrb3V0RnVuY3Rpb24pO1xuXG4gICAgLy8gUE9TVCAvYWN0aXZpdGllcy97aWR9L2pvaW4tY2hlY2tvdXRcbiAgICBjb25zdCBhY3Rpdml0eUpvaW5DaGVja291dCA9IGFjdGl2aXR5QnlJZC5hZGRSZXNvdXJjZSgnam9pbi1jaGVja291dCcpO1xuICAgIGFjdGl2aXR5Sm9pbkNoZWNrb3V0LmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGpvaW5BY3Rpdml0eUNoZWNrb3V0RnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBWZXJpZmljYXRpb24gTGFtYmRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IHZlcmlmaWNhdGlvbkNoZWNrb3V0RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1ZlcmlmaWNhdGlvbkNoZWNrb3V0Jywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3ZlcmlmaWNhdGlvbi9jcmVhdGVDaGVja291dC50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgICBTVFJJUEVfU0VDUkVUX0tFWTogcHJvY2Vzcy5lbnYuU1RSSVBFX1NFQ1JFVF9LRVkgfHwgJycsXG4gICAgICAgIEZST05URU5EX1VSTDogZnJvbnRlbmRVcmwsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHsgbWluaWZ5OiB0cnVlLCBzb3VyY2VNYXA6IHRydWUsIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRWZXJpZmljYXRpb25TdGF0dXNGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnR2V0VmVyaWZpY2F0aW9uU3RhdHVzJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3ZlcmlmaWNhdGlvbi9nZXRTdGF0dXMudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7IFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSB9LFxuICAgICAgYnVuZGxpbmc6IHsgbWluaWZ5OiB0cnVlLCBzb3VyY2VNYXA6IHRydWUsIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBhcHByb3ZlVmVyaWZpY2F0aW9uRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0FwcHJvdmVWZXJpZmljYXRpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdmVyaWZpY2F0aW9uL2FwcHJvdmUudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQURNSU5fVVNFUl9JRFM6IHByb2Nlc3MuZW52LkFETUlOX1VTRVJfSURTIHx8ICcnLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7IG1pbmlmeTogdHJ1ZSwgc291cmNlTWFwOiB0cnVlLCBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLCBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcmVqZWN0VmVyaWZpY2F0aW9uRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1JlamVjdFZlcmlmaWNhdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy92ZXJpZmljYXRpb24vcmVqZWN0LnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEFETUlOX1VTRVJfSURTOiBwcm9jZXNzLmVudi5BRE1JTl9VU0VSX0lEUyB8fCAnJyxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzogeyBtaW5pZnk6IHRydWUsIHNvdXJjZU1hcDogdHJ1ZSwgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSwgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh2ZXJpZmljYXRpb25DaGVja291dEZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWREYXRhKGdldFZlcmlmaWNhdGlvblN0YXR1c0Z1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYXBwcm92ZVZlcmlmaWNhdGlvbkZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEocmVqZWN0VmVyaWZpY2F0aW9uRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChcbiAgICAgIHZlcmlmaWNhdGlvbkNoZWNrb3V0RnVuY3Rpb24sXG4gICAgICBnZXRWZXJpZmljYXRpb25TdGF0dXNGdW5jdGlvbixcbiAgICAgIGFwcHJvdmVWZXJpZmljYXRpb25GdW5jdGlvbixcbiAgICAgIHJlamVjdFZlcmlmaWNhdGlvbkZ1bmN0aW9uLFxuICAgICk7XG5cbiAgICAvLyBWZXJpZmljYXRpb24gQVBJIFJvdXRlc1xuICAgIGNvbnN0IHZlcmlmaWNhdGlvbiA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3ZlcmlmaWNhdGlvbicpO1xuXG4gICAgY29uc3QgdmVyaWZpY2F0aW9uQ2hlY2tvdXRSZXNvdXJjZSA9IHZlcmlmaWNhdGlvbi5hZGRSZXNvdXJjZSgnY2hlY2tvdXQnKTtcbiAgICB2ZXJpZmljYXRpb25DaGVja291dFJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHZlcmlmaWNhdGlvbkNoZWNrb3V0RnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICBjb25zdCB2ZXJpZmljYXRpb25TdGF0dXNSZXNvdXJjZSA9IHZlcmlmaWNhdGlvbi5hZGRSZXNvdXJjZSgnc3RhdHVzJyk7XG4gICAgdmVyaWZpY2F0aW9uU3RhdHVzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRWZXJpZmljYXRpb25TdGF0dXNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IHZlcmlmaWNhdGlvbkFwcHJvdmVSZXNvdXJjZSA9IHZlcmlmaWNhdGlvbi5hZGRSZXNvdXJjZSgnYXBwcm92ZScpO1xuICAgIHZlcmlmaWNhdGlvbkFwcHJvdmVSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihhcHByb3ZlVmVyaWZpY2F0aW9uRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICBjb25zdCB2ZXJpZmljYXRpb25SZWplY3RSZXNvdXJjZSA9IHZlcmlmaWNhdGlvbi5hZGRSZXNvdXJjZSgncmVqZWN0Jyk7XG4gICAgdmVyaWZpY2F0aW9uUmVqZWN0UmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocmVqZWN0VmVyaWZpY2F0aW9uRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBBSSBUZXh0IFJlZmluZW1lbnQgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgcmVmaW5lVGV4dEZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdSZWZpbmVUZXh0RnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvYWkvcmVmaW5lVGV4dC50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHt9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IEJlZHJvY2sgSW52b2tlTW9kZWwgcGVybWlzc2lvblxuICAgIHJlZmluZVRleHRGdW5jdGlvbi5hZGRUb1JvbGVQb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFsnYmVkcm9jazpJbnZva2VNb2RlbCddLFxuICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAnYXJuOmF3czpiZWRyb2NrOio6OmZvdW5kYXRpb24tbW9kZWwvYW50aHJvcGljLmNsYXVkZS1oYWlrdS00LTUtMjAyNTEwMDEtdjE6MCcsXG4gICAgICAgICAgJ2Fybjphd3M6YmVkcm9jazoqOio6aW5mZXJlbmNlLXByb2ZpbGUvdXMuYW50aHJvcGljLmNsYXVkZS1oYWlrdS00LTUtMjAyNTEwMDEtdjE6MCcsXG4gICAgICAgIF0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKHJlZmluZVRleHRGdW5jdGlvbik7XG5cbiAgICAvLyBBSSBBUEkgUm91dGVzIC0gUE9TVCAvYWkvcmVmaW5lXG4gICAgY29uc3QgYWkgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdhaScpO1xuICAgIGNvbnN0IGFpUmVmaW5lID0gYWkuYWRkUmVzb3VyY2UoJ3JlZmluZScpO1xuICAgIGFpUmVmaW5lLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHJlZmluZVRleHRGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIEFkZCBDT1JTIGhlYWRlcnMgdG8gYWxsIGdhdGV3YXkgcmVzcG9uc2VzIChpbmNsdWRpbmcgZXJyb3JzKVxuICAgIHRoaXMuYXBpLmFkZEdhdGV3YXlSZXNwb25zZSgnRGVmYXVsdDRYWCcsIHtcbiAgICAgIHR5cGU6IGFwaWdhdGV3YXkuUmVzcG9uc2VUeXBlLkRFRkFVTFRfNFhYLFxuICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiBgJyonYCxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiBgJ0NvbnRlbnQtVHlwZSxBdXRob3JpemF0aW9uLFgtQW16LURhdGUsWC1BcGktS2V5LFgtQW16LVNlY3VyaXR5LVRva2VuJ2AsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogYCdHRVQsUE9TVCxQVVQsREVMRVRFLE9QVElPTlMnYCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFwaS5hZGRHYXRld2F5UmVzcG9uc2UoJ0RlZmF1bHQ1WFgnLCB7XG4gICAgICB0eXBlOiBhcGlnYXRld2F5LlJlc3BvbnNlVHlwZS5ERUZBVUxUXzVYWCxcbiAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogYCcqJ2AsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogYCdDb250ZW50LVR5cGUsQXV0aG9yaXphdGlvbixYLUFtei1EYXRlLFgtQXBpLUtleSxYLUFtei1TZWN1cml0eS1Ub2tlbidgLFxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6IGAnR0VULFBPU1QsUFVULERFTEVURSxPUFRJT05TJ2AsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcGlFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFwaUVuZHBvaW50LFxuICAgICAgZXhwb3J0TmFtZTogYENvbm5lY3Q0MC1BcGlFbmRwb2ludC0ke3Byb3BzLmVudk5hbWV9YCxcbiAgICB9KTtcbiAgfVxufVxuIl19
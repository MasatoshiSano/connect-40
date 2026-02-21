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
            resources: ['arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0'],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFDekQsK0RBQWlEO0FBQ2pELHFFQUErRDtBQUcvRCx5REFBMkM7QUFHM0MsMkNBQTZCO0FBVTdCLE1BQWEsUUFBUyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3JCLEdBQUcsQ0FBcUI7SUFDeEIsV0FBVyxDQUFTO0lBQ3BCLFVBQVUsQ0FBd0M7SUFDbEQsU0FBUyxHQUFzQixFQUFFLENBQUM7SUFFbEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFvQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixtQkFBbUI7UUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUM3QyxXQUFXLEVBQUUsaUJBQWlCLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDN0MsV0FBVyxFQUFFLG9CQUFvQjtZQUNqQyxhQUFhLEVBQUU7Z0JBQ2IsU0FBUyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUN4QixjQUFjLEVBQUUsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJO2dCQUNoRCxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsT0FBTyxLQUFLLE1BQU07Z0JBQzFDLGNBQWMsRUFBRSxJQUFJO2FBQ3JCO1lBQ0QsMkJBQTJCLEVBQUU7Z0JBQzNCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxvQ0FBb0M7Z0JBQy9FLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pDLFlBQVksRUFBRTtvQkFDWixjQUFjO29CQUNkLGVB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SztnQkFDcEMsOEJBQThCLEVBQUUsd0VBQXdFO2dCQUN4Ryw4QkFBOEIsRUFBRSwrQkFBK0I7YUFDaEU7U0FDRixDQUFDLENBQUM7UUFFSCxVQUFVO1FBQ1YsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDckMsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQ3ZCLFVBQVUsRUFBRSx5QkFBeUIsS0FBSyxDQUFDLE9BQU8sRUFBRTtTQUNyRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFwMEJELDRCQW8wQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBOb2RlanNGdW5jdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtbm9kZWpzJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBpU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgZW52TmFtZTogc3RyaW5nO1xuICB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcbiAgdGFibGU6IGR5bmFtb2RiLlRhYmxlO1xuICBidWNrZXQ6IHMzLkJ1Y2tldDtcbiAgd2ViU29ja2V0RW5kcG9pbnQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBBcGlTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBhcGk6IGFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgcHVibGljIHJlYWRvbmx5IGFwaUVuZHBvaW50OiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBhdXRob3JpemVyOiBhcGlnYXRld2F5LkNvZ25pdG9Vc2VyUG9vbHNBdXRob3JpemVyO1xuICBwdWJsaWMgcmVhZG9ubHkgZnVuY3Rpb25zOiBsYW1iZGEuRnVuY3Rpb25bXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBBcGlTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBSRVNUIEFQSSBHYXRld2F5XG4gICAgdGhpcy5hcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdBcGknLCB7XG4gICAgICByZXN0QXBpTmFtZTogYENvbm5lY3Q0MC1BcGktJHtwcm9wcy5lbnZOYW1lfWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nvbm5lY3Q0MCBSRVNUIEFQSScsXG4gICAgICBkZXBsb3lPcHRpb25zOiB7XG4gICAgICAgIHN0YWdlTmFtZTogcHJvcHMuZW52TmFtZSxcbiAgICAgICAgdHJhY2luZ0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIGxvZ2dpbmdMZXZlbDogYXBpZ2F0ZXdheS5NZXRob2RMb2dnaW5nTGV2ZWwuSU5GTyxcbiAgICAgICAgZGF0YVRyYWNlRW5hYmxlZDogcHJvcHMuZW52TmFtZSAhPT0gJ3Byb2QnLFxuICAgICAgICBtZXRyaWNzRW5hYmxlZDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsIC8vIFRPRE86IFJlc3RyaWN0IHRvIGZyb250ZW5kIGRvbWFpblxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZScsXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nLFxuICAgICAgICAgICdYLUFtei1EYXRlJyxcbiAgICAgICAgICAnWC1BcGktS2V5JyxcbiAgICAgICAgICAnWC1BbXotU2VjdXJpdHktVG9rZW4nLFxuICAgICAgICAgICdYLUFtei1Vc2VyLUFnZW50JyxcbiAgICAgICAgXSxcbiAgICAgICAgYWxsb3dDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFwaUVuZHBvaW50ID0gdGhpcy5hcGkudXJsO1xuXG4gICAgLy8gTGFtYmRhIExheWVyIGZvciBjb21tb24gY29kZSAtIFRFTVBPUkFSSUxZIERJU0FCTEVEXG4gICAgLy8gVE9ETzogRml4IGxheWVyIHN0cnVjdHVyZSB0byBtYXRjaCBMYW1iZGEgcmVxdWlyZW1lbnRzXG4gICAgLy8gY29uc3QgY29tbW9uTGF5ZXIgPSBuZXcgbGFtYmRhLkxheWVyVmVyc2lvbih0aGlzLCAnQ29tbW9uTGF5ZXInLCB7XG4gICAgLy8gICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvbGF5ZXJzL2NvbW1vbicpKSxcbiAgICAvLyAgIGNvbXBhdGlibGVSdW50aW1lczogW2xhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YXSxcbiAgICAvLyAgIGRlc2NyaXB0aW9uOiAnQ29tbW9uIHV0aWxpdGllcyBhbmQgRHluYW1vREIgY2xpZW50JyxcbiAgICAvLyB9KTtcblxuICAgIC8vIENvZ25pdG8gQXV0aG9yaXplclxuICAgIHRoaXMuYXV0aG9yaXplciA9IG5ldyBhcGlnYXRld2F5LkNvZ25pdG9Vc2VyUG9vbHNBdXRob3JpemVyKHRoaXMsICdBdXRob3JpemVyJywge1xuICAgICAgY29nbml0b1VzZXJQb29sczogW3Byb3BzLnVzZXJQb29sXSxcbiAgICB9KTtcblxuICAgIC8vIFVzZXIgbWFuYWdlbWVudCBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgY3JlYXRlVXNlckZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdDcmVhdGVVc2VyRnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy91c2Vycy9jcmVhdGUudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQlVDS0VUX05BTUU6IHByb3BzLmJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRVc2VyRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldFVzZXJGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VzZXJzL2dldC50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgICBCVUNLRVRfTkFNRTogcHJvcHMuYnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHVwZGF0ZVVzZXJGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnVXBkYXRlVXNlckZ1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdXNlcnMvdXBkYXRlLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEJVQ0tFVF9OQU1FOiBwcm9wcy5idWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZ2V0UHVibGljUHJvZmlsZUZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRQdWJsaWNQcm9maWxlRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdXNlcnMvZ2V0UHVibGljUHJvZmlsZS50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBibG9ja1VzZXJGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnQmxvY2tVc2VyRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdXNlcnMvYmxvY2tVc2VyLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlcG9ydFVzZXJGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnUmVwb3J0VXNlckZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VzZXJzL3JlcG9ydFVzZXIudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnNcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3JlYXRlVXNlckZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZ2V0VXNlckZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEodXBkYXRlVXNlckZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWREYXRhKGdldFB1YmxpY1Byb2ZpbGVGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGJsb2NrVXNlckZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEocmVwb3J0VXNlckZ1bmN0aW9uKTtcbiAgICBwcm9wcy5idWNrZXQuZ3JhbnRSZWFkV3JpdGUoY3JlYXRlVXNlckZ1bmN0aW9uKTtcbiAgICBwcm9wcy5idWNrZXQuZ3JhbnRSZWFkV3JpdGUodXBkYXRlVXNlckZ1bmN0aW9uKTtcblxuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2goXG4gICAgICBjcmVhdGVVc2VyRnVuY3Rpb24sXG4gICAgICBnZXRVc2VyRnVuY3Rpb24sXG4gICAgICB1cGRhdGVVc2VyRnVuY3Rpb24sXG4gICAgICBnZXRQdWJsaWNQcm9maWxlRnVuY3Rpb24sXG4gICAgICBibG9ja1VzZXJGdW5jdGlvbixcbiAgICAgIHJlcG9ydFVzZXJGdW5jdGlvblxuICAgICk7XG5cbiAgICAvLyBBUEkgUm91dGVzXG4gICAgY29uc3QgdXNlcnMgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCd1c2VycycpO1xuXG4gICAgLy8gUE9TVCAvdXNlcnMgLSBDcmVhdGUgdXNlciBwcm9maWxlXG4gICAgdXNlcnMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oY3JlYXRlVXNlckZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdXNlck1lID0gdXNlcnMuYWRkUmVzb3VyY2UoJ21lJyk7XG5cbiAgICAvLyBHRVQgL3VzZXJzL21lIC0gR2V0IGN1cnJlbnQgdXNlciBwcm9maWxlXG4gICAgdXNlck1lLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0VXNlckZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUFVUIC91c2Vycy9tZSAtIFVwZGF0ZSBjdXJyZW50IHVzZXIgcHJvZmlsZVxuICAgIHVzZXJNZS5hZGRNZXRob2QoJ1BVVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHVwZGF0ZVVzZXJGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIEdFVCAvdXNlcnMve3VzZXJJZH0vcHJvZmlsZSAtIEdldCBwdWJsaWMgcHJvZmlsZVxuICAgIGNvbnN0IHVzZXJCeUlkID0gdXNlcnMuYWRkUmVzb3VyY2UoJ3t1c2VySWR9Jyk7XG4gICAgY29uc3QgdXNlclByb2ZpbGUgPSB1c2VyQnlJZC5hZGRSZXNvdXJjZSgncHJvZmlsZScpO1xuICAgIHVzZXJQcm9maWxlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0UHVibGljUHJvZmlsZUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUE9TVCAvdXNlcnMve3VzZXJJZH0vYmxvY2sgLSBCbG9jayBhIHVzZXJcbiAgICBjb25zdCB1c2VyQmxvY2sgPSB1c2VyQnlJZC5hZGRSZXNvdXJjZSgnYmxvY2snKTtcbiAgICB1c2VyQmxvY2suYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYmxvY2tVc2VyRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBQT1NUIC9yZXBvcnRzIC0gUmVwb3J0IGEgdXNlclxuICAgIGNvbnN0IHJlcG9ydHMgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdyZXBvcnRzJyk7XG4gICAgcmVwb3J0cy5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihyZXBvcnRVc2VyRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBVc2VyIERpc2NvdmVyeSBMYW1iZGEgZnVuY3Rpb25cbiAgICBjb25zdCBkaXNjb3ZlclVzZXJzRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0Rpc2NvdmVyVXNlcnNGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy91c2Vycy9kaXNjb3Zlci50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxNSksXG4gICAgfSk7XG5cbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWREYXRhKGRpc2NvdmVyVXNlcnNGdW5jdGlvbik7XG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChkaXNjb3ZlclVzZXJzRnVuY3Rpb24pO1xuXG4gICAgLy8gR0VUIC91c2Vycy9kaXNjb3ZlciAtIERpc2NvdmVyIHVzZXJzIHdpdGggc2ltaWxhciBpbnRlcmVzdHNcbiAgICBjb25zdCB1c2VyRGlzY292ZXIgPSB1c2Vycy5hZGRSZXNvdXJjZSgnZGlzY292ZXInKTtcbiAgICB1c2VyRGlzY292ZXIuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihkaXNjb3ZlclVzZXJzRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBBY3Rpdml0eSBtYW5hZ2VtZW50IExhbWJkYSBmdW5jdGlvbnNcbiAgICBjb25zdCBjcmVhdGVBY3Rpdml0eUZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdDcmVhdGVBY3Rpdml0eUZ1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvYWN0aXZpdGllcy9jcmVhdGUudHMnKSxcbiAgICAgIC8vIGhhbmRsZXIgZGVmYXVsdHMgdG8gJ2hhbmRsZXInIGluIHRoZSBidW5kbGVkIGluZGV4LmpzXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGxpc3RBY3Rpdml0aWVzRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0xpc3RBY3Rpdml0aWVzRnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2xpc3QudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZ2V0QWN0aXZpdHlGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnR2V0QWN0aXZpdHlGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMvZ2V0LnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGpvaW5BY3Rpdml0eUZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdKb2luQWN0aXZpdHlGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMvam9pbi50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgICBXRUJTT0NLRVRfRU5EUE9JTlQ6IHByb3BzLndlYlNvY2tldEVuZHBvaW50IHx8ICcnLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBsZWF2ZUFjdGl2aXR5RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0xlYXZlQWN0aXZpdHlGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMvbGVhdmUudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgV0VCU09DS0VUX0VORFBPSU5UOiBwcm9wcy53ZWJTb2NrZXRFbmRwb2ludCB8fCAnJyxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnNcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3JlYXRlQWN0aXZpdHlGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGxpc3RBY3Rpdml0aWVzRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShnZXRBY3Rpdml0eUZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoam9pbkFjdGl2aXR5RnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsZWF2ZUFjdGl2aXR5RnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChcbiAgICAgIGNyZWF0ZUFjdGl2aXR5RnVuY3Rpb24sXG4gICAgICBsaXN0QWN0aXZpdGllc0Z1bmN0aW9uLFxuICAgICAgZ2V0QWN0aXZpdHlGdW5jdGlvbixcbiAgICAgIGpvaW5BY3Rpdml0eUZ1bmN0aW9uLFxuICAgICAgbGVhdmVBY3Rpdml0eUZ1bmN0aW9uXG4gICAgKTtcblxuICAgIC8vIEFjdGl2aXR5IEFQSSBSb3V0ZXNcbiAgICBjb25zdCBhY3Rpdml0aWVzID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnYWN0aXZpdGllcycpO1xuXG4gICAgLy8gUE9TVCAvYWN0aXZpdGllcyAtIENyZWF0ZSBhY3Rpdml0eVxuICAgIGFjdGl2aXRpZXMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oY3JlYXRlQWN0aXZpdHlGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIEdFVCAvYWN0aXZpdGllcyAtIExpc3QgYWN0aXZpdGllc1xuICAgIGFjdGl2aXRpZXMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsaXN0QWN0aXZpdGllc0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gR0VUIC9hY3Rpdml0aWVzL3tpZH0gLSBHZXQgYWN0aXZpdHlcbiAgICBjb25zdCBhY3Rpdml0eUJ5SWQgPSBhY3Rpdml0aWVzLmFkZFJlc291cmNlKCd7aWR9Jyk7XG4gICAgYWN0aXZpdHlCeUlkLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0QWN0aXZpdHlGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFBVVCAvYWN0aXZpdGllcy97aWR9IC0gVXBkYXRlIGFjdGl2aXR5XG4gICAgY29uc3QgdXBkYXRlQWN0aXZpdHlGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnVXBkYXRlQWN0aXZpdHlGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMvdXBkYXRlLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEodXBkYXRlQWN0aXZpdHlGdW5jdGlvbik7XG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaCh1cGRhdGVBY3Rpdml0eUZ1bmN0aW9uKTtcblxuICAgIGFjdGl2aXR5QnlJZC5hZGRNZXRob2QoJ1BVVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHVwZGF0ZUFjdGl2aXR5RnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBQT1NUIC9hY3Rpdml0aWVzL3tpZH0vam9pbiAtIEpvaW4gYWN0aXZpdHlcbiAgICBjb25zdCBhY3Rpdml0eUpvaW4gPSBhY3Rpdml0eUJ5SWQuYWRkUmVzb3VyY2UoJ2pvaW4nKTtcbiAgICBhY3Rpdml0eUpvaW4uYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oam9pbkFjdGl2aXR5RnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBQT1NUIC9hY3Rpdml0aWVzL3tpZH0vbGVhdmUgLSBMZWF2ZSBhY3Rpdml0eVxuICAgIGNvbnN0IGFjdGl2aXR5TGVhdmUgPSBhY3Rpdml0eUJ5SWQuYWRkUmVzb3VyY2UoJ2xlYXZlJyk7XG4gICAgYWN0aXZpdHlMZWF2ZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsZWF2ZUFjdGl2aXR5RnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBBY3Rpdml0eSBSZXZpZXdzXG4gICAgY29uc3QgY3JlYXRlUmV2aWV3RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0NyZWF0ZVJldmlld0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMvY3JlYXRlUmV2aWV3LnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdldFJldmlld3NGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnR2V0UmV2aWV3c0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMvZ2V0UmV2aWV3cy50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3JlYXRlUmV2aWV3RnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZERhdGEoZ2V0UmV2aWV3c0Z1bmN0aW9uKTtcbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKGNyZWF0ZVJldmlld0Z1bmN0aW9uLCBnZXRSZXZpZXdzRnVuY3Rpb24pO1xuXG4gICAgLy8gL2FjdGl2aXRpZXMve2lkfS9yZXZpZXdzXG4gICAgY29uc3QgYWN0aXZpdHlSZXZpZXdzID0gYWN0aXZpdHlCeUlkLmFkZFJlc291cmNlKCdyZXZpZXdzJyk7XG4gICAgYWN0aXZpdHlSZXZpZXdzLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZVJldmlld0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuICAgIGFjdGl2aXR5UmV2aWV3cy5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldFJldmlld3NGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIENoYXQgbWFuYWdlbWVudCBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgY3JlYXRlQ2hhdFJvb21GdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnQ3JlYXRlQ2hhdFJvb21GdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2NoYXQvY3JlYXRlUm9vbS50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRDaGF0Um9vbXNGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnR2V0Q2hhdFJvb21zRnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9jaGF0L2dldFJvb21zLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIERFUExPWV9WRVJTSU9OOiAnMicsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdldENoYXRSb29tRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldENoYXRSb29tRnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9jaGF0L2dldFJvb20udHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnNcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3JlYXRlQ2hhdFJvb21GdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGdldENoYXRSb29tc0Z1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZ2V0Q2hhdFJvb21GdW5jdGlvbik7XG5cbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKGNyZWF0ZUNoYXRSb29tRnVuY3Rpb24sIGdldENoYXRSb29tc0Z1bmN0aW9uLCBnZXRDaGF0Um9vbUZ1bmN0aW9uKTtcblxuICAgIC8vIENoYXQgQVBJIFJvdXRlc1xuICAgIGNvbnN0IGNoYXQgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdjaGF0Jyk7XG4gICAgY29uc3QgY2hhdFJvb21zID0gY2hhdC5hZGRSZXNvdXJjZSgncm9vbXMnKTtcblxuICAgIC8vIFBPU1QgL2NoYXQvcm9vbXMgLSBDcmVhdGUgY2hhdCByb29tXG4gICAgY2hhdFJvb21zLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUNoYXRSb29tRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBHRVQgL2NoYXQvcm9vbXMgLSBHZXQgdXNlcidzIGNoYXQgcm9vbXNcbiAgICBjaGF0Um9vbXMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRDaGF0Um9vbXNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIEdFVCAvY2hhdC9yb29tcy97Y2hhdFJvb21JZH0gLSBHZXQgY2hhdCByb29tIGRldGFpbHNcbiAgICBjb25zdCBjaGF0Um9vbURldGFpbCA9IGNoYXRSb29tcy5hZGRSZXNvdXJjZSgne2NoYXRSb29tSWR9Jyk7XG4gICAgY2hhdFJvb21EZXRhaWwuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRDaGF0Um9vbUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gVXBsb2FkIG1hbmFnZW1lbnQgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgZ2V0UHJlc2lnbmVkVXJsRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldFByZXNpZ25lZFVybEZ1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdXBsb2Fkcy9nZXRQcmVzaWduZWRVcmwudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFVQTE9BRFNfQlVDS0VUX05BTUU6IHByb3BzLmJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBTMyB3cml0ZSBwZXJtaXNzaW9uc1xuICAgIHByb3BzLmJ1Y2tldC5ncmFudFB1dChnZXRQcmVzaWduZWRVcmxGdW5jdGlvbik7XG5cbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKGdldFByZXNpZ25lZFVybEZ1bmN0aW9uKTtcblxuICAgIC8vIFVwbG9hZCBBUEkgUm91dGVzXG4gICAgY29uc3QgdXBsb2FkcyA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3VwbG9hZHMnKTtcbiAgICBjb25zdCBwcmVzaWduZWRVcmwgPSB1cGxvYWRzLmFkZFJlc291cmNlKCdwcmVzaWduZWQtdXJsJyk7XG5cbiAgICAvLyBQT1NUIC91cGxvYWRzL3ByZXNpZ25lZC11cmwgLSBHZXQgcHJlc2lnbmVkIFVSTCBmb3IgdXBsb2FkXG4gICAgcHJlc2lnbmVkVXJsLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldFByZXNpZ25lZFVybEZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUGF5bWVudCBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgZnJvbnRlbmRVcmwgPSBwcm9jZXNzLmVudi5GUk9OVEVORF9VUkwgfHwgJ2h0dHBzOi8vZDJzMGs5Z3RzeHUzZXYuY2xvdWRmcm9udC5uZXQnO1xuICAgIGNvbnN0IHBheW1lbnRFbnZpcm9ubWVudCA9IHtcbiAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIFNUUklQRV9TRUNSRVRfS0VZOiBwcm9jZXNzLmVudi5TVFJJUEVfU0VDUkVUX0tFWSB8fCAnJyxcbiAgICAgIFNUUklQRV9XRUJIT09LX1NFQ1JFVDogcHJvY2Vzcy5lbnYuU1RSSVBFX1dFQkhPT0tfU0VDUkVUIHx8ICcnLFxuICAgICAgRlJPTlRFTkRfVVJMOiBmcm9udGVuZFVybCxcbiAgICB9O1xuXG4gICAgY29uc3QgY3JlYXRlQ2hlY2tvdXRTZXNzaW9uRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24oXG4gICAgICB0aGlzLFxuICAgICAgJ0NyZWF0ZUNoZWNrb3V0U2Vzc2lvbkZ1bmN0aW9uJyxcbiAgICAgIHtcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvcGF5bWVudC9jcmVhdGVDaGVja291dFNlc3Npb24udHMnKSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHBheW1lbnRFbnZpcm9ubWVudCxcbiAgICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgY29uc3Qgd2ViaG9va0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdXZWJob29rRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvcGF5bWVudC93ZWJob29rLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDogcGF5bWVudEVudmlyb25tZW50LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNyZWF0ZVBvcnRhbFNlc3Npb25GdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICAnQ3JlYXRlUG9ydGFsU2Vzc2lvbkZ1bmN0aW9uJyxcbiAgICAgIHtcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvcGF5bWVudC9jcmVhdGVQb3J0YWxTZXNzaW9uLnRzJyksXG4gICAgICAgIGVudmlyb25tZW50OiBwYXltZW50RW52aXJvbm1lbnQsXG4gICAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNyZWF0ZUNoZWNrb3V0U2Vzc2lvbkZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEod2ViaG9va0Z1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWREYXRhKGNyZWF0ZVBvcnRhbFNlc3Npb25GdW5jdGlvbik7XG5cbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKFxuICAgICAgY3JlYXRlQ2hlY2tvdXRTZXNzaW9uRnVuY3Rpb24sXG4gICAgICB3ZWJob29rRnVuY3Rpb24sXG4gICAgICBjcmVhdGVQb3J0YWxTZXNzaW9uRnVuY3Rpb25cbiAgICApO1xuXG4gICAgLy8gUGF5bWVudCBBUEkgUm91dGVzXG4gICAgY29uc3QgcGF5bWVudCA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3BheW1lbnQnKTtcblxuICAgIC8vIFBPU1QgL3BheW1lbnQvY2hlY2tvdXRcbiAgICBjb25zdCBjaGVja291dCA9IHBheW1lbnQuYWRkUmVzb3VyY2UoJ2NoZWNrb3V0Jyk7XG4gICAgY2hlY2tvdXQuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oY3JlYXRlQ2hlY2tvdXRTZXNzaW9uRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBQT1NUIC9wYXltZW50L3dlYmhvb2sgKG5vIGF1dGggcmVxdWlyZWQgLSBTdHJpcGUgd2lsbCBzZW5kIHNpZ25hdHVyZSlcbiAgICBjb25zdCB3ZWJob29rID0gcGF5bWVudC5hZGRSZXNvdXJjZSgnd2ViaG9vaycpO1xuICAgIHdlYmhvb2suYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24od2ViaG9va0Z1bmN0aW9uKSk7XG5cbiAgICAvLyBQT1NUIC9wYXltZW50L3BvcnRhbFxuICAgIGNvbnN0IHBvcnRhbCA9IHBheW1lbnQuYWRkUmVzb3VyY2UoJ3BvcnRhbCcpO1xuICAgIHBvcnRhbC5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihjcmVhdGVQb3J0YWxTZXNzaW9uRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBQaG90byBHYWxsZXJ5IExhbWJkYSBmdW5jdGlvbnNcbiAgICBjb25zdCB1cGxvYWRQaG90b0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdVcGxvYWRQaG90b0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMvdXBsb2FkUGhvdG8udHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQlVDS0VUX05BTUU6IHByb3BzLmJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRQaG90b3NGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnR2V0UGhvdG9zRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvYWN0aXZpdGllcy9nZXRQaG90b3MudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnMgZm9yIHBob3RvIGZ1bmN0aW9uc1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh1cGxvYWRQaG90b0Z1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWREYXRhKGdldFBob3Rvc0Z1bmN0aW9uKTtcbiAgICBwcm9wcy5idWNrZXQuZ3JhbnRSZWFkV3JpdGUodXBsb2FkUGhvdG9GdW5jdGlvbik7XG5cbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKHVwbG9hZFBob3RvRnVuY3Rpb24sIGdldFBob3Rvc0Z1bmN0aW9uKTtcblxuICAgIC8vIFBob3RvIEFQSSBSb3V0ZXMgLSBQT1NUL0dFVCAvYWN0aXZpdGllcy97aWR9L3Bob3Rvc1xuICAgIGNvbnN0IGFjdGl2aXR5UGhvdG9zID0gYWN0aXZpdHlCeUlkLmFkZFJlc291cmNlKCdwaG90b3MnKTtcbiAgICBhY3Rpdml0eVBob3Rvcy5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih1cGxvYWRQaG90b0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuICAgIGFjdGl2aXR5UGhvdG9zLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0UGhvdG9zRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBSZWNvbW1lbmRhdGlvbnMgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgZ2V0UmVjb21tZW5kYXRpb25zRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldFJlY29tbWVuZGF0aW9uc0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3JlY29tbWVuZGF0aW9ucy9nZXQudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgIH0pO1xuXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkRGF0YShnZXRSZWNvbW1lbmRhdGlvbnNGdW5jdGlvbik7XG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChnZXRSZWNvbW1lbmRhdGlvbnNGdW5jdGlvbik7XG5cbiAgICAvLyBSZWNvbW1lbmRhdGlvbnMgQVBJIFJvdXRlIC0gR0VUIC9yZWNvbW1lbmRhdGlvbnNcbiAgICBjb25zdCByZWNvbW1lbmRhdGlvbnMgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdyZWNvbW1lbmRhdGlvbnMnKTtcbiAgICByZWNvbW1lbmRhdGlvbnMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRSZWNvbW1lbmRhdGlvbnNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIEFjdGl2aXR5IEpvaW4gQ2hlY2tvdXQgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3Qgam9pbkFjdGl2aXR5Q2hlY2tvdXRGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnSm9pbkFjdGl2aXR5Q2hlY2tvdXRGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2pvaW5DaGVja291dC50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgICBTVFJJUEVfU0VDUkVUX0tFWTogcHJvY2Vzcy5lbnYuU1RSSVBFX1NFQ1JFVF9LRVkgfHwgJycsXG4gICAgICAgIEZST05URU5EX1VSTDogZnJvbnRlbmRVcmwsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHsgbWluaWZ5OiB0cnVlLCBzb3VyY2VNYXA6IHRydWUsIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGpvaW5BY3Rpdml0eUNoZWNrb3V0RnVuY3Rpb24pO1xuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2goam9pbkFjdGl2aXR5Q2hlY2tvdXRGdW5jdGlvbik7XG5cbiAgICAvLyBQT1NUIC9hY3Rpdml0aWVzL3tpZH0vam9pbi1jaGVja291dFxuICAgIGNvbnN0IGFjdGl2aXR5Sm9pbkNoZWNrb3V0ID0gYWN0aXZpdHlCeUlkLmFkZFJlc291cmNlKCdqb2luLWNoZWNrb3V0Jyk7XG4gICAgYWN0aXZpdHlKb2luQ2hlY2tvdXQuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oam9pbkFjdGl2aXR5Q2hlY2tvdXRGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFZlcmlmaWNhdGlvbiBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgdmVyaWZpY2F0aW9uQ2hlY2tvdXRGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnVmVyaWZpY2F0aW9uQ2hlY2tvdXQnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdmVyaWZpY2F0aW9uL2NyZWF0ZUNoZWNrb3V0LnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFNUUklQRV9TRUNSRVRfS0VZOiBwcm9jZXNzLmVudi5TVFJJUEVfU0VDUkVUX0tFWSB8fCAnJyxcbiAgICAgICAgRlJPTlRFTkRfVVJMOiBmcm9udGVuZFVybCxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzogeyBtaW5pZnk6IHRydWUsIHNvdXJjZU1hcDogdHJ1ZSwgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSwgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdldFZlcmlmaWNhdGlvblN0YXR1c0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRWZXJpZmljYXRpb25TdGF0dXMnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdmVyaWZpY2F0aW9uL2dldFN0YXR1cy50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHsgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lIH0sXG4gICAgICBidW5kbGluZzogeyBtaW5pZnk6IHRydWUsIHNvdXJjZU1hcDogdHJ1ZSwgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSwgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFwcHJvdmVWZXJpZmljYXRpb25GdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnQXBwcm92ZVZlcmlmaWNhdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy92ZXJpZmljYXRpb24vYXBwcm92ZS50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgICBBRE1JTl9VU0VSX0lEUzogcHJvY2Vzcy5lbnYuQURNSU5fVVNFUl9JRFMgfHwgJycsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHsgbWluaWZ5OiB0cnVlLCBzb3VyY2VNYXA6IHRydWUsIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCByZWplY3RWZXJpZmljYXRpb25GdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnUmVqZWN0VmVyaWZpY2F0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3ZlcmlmaWNhdGlvbi9yZWplY3QudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQURNSU5fVVNFUl9JRFM6IHByb2Nlc3MuZW52LkFETUlOX1VTRVJfSURTIHx8ICcnLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7IG1pbmlmeTogdHJ1ZSwgc291cmNlTWFwOiB0cnVlLCBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLCBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHZlcmlmaWNhdGlvbkNoZWNrb3V0RnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZERhdGEoZ2V0VmVyaWZpY2F0aW9uU3RhdHVzRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShhcHByb3ZlVmVyaWZpY2F0aW9uRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShyZWplY3RWZXJpZmljYXRpb25GdW5jdGlvbik7XG5cbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKFxuICAgICAgdmVyaWZpY2F0aW9uQ2hlY2tvdXRGdW5jdGlvbixcbiAgICAgIGdldFZlcmlmaWNhdGlvblN0YXR1c0Z1bmN0aW9uLFxuICAgICAgYXBwcm92ZVZlcmlmaWNhdGlvbkZ1bmN0aW9uLFxuICAgICAgcmVqZWN0VmVyaWZpY2F0aW9uRnVuY3Rpb24sXG4gICAgKTtcblxuICAgIC8vIFZlcmlmaWNhdGlvbiBBUEkgUm91dGVzXG4gICAgY29uc3QgdmVyaWZpY2F0aW9uID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgndmVyaWZpY2F0aW9uJyk7XG5cbiAgICBjb25zdCB2ZXJpZmljYXRpb25DaGVja291dFJlc291cmNlID0gdmVyaWZpY2F0aW9uLmFkZFJlc291cmNlKCdjaGVja291dCcpO1xuICAgIHZlcmlmaWNhdGlvbkNoZWNrb3V0UmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odmVyaWZpY2F0aW9uQ2hlY2tvdXRGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IHZlcmlmaWNhdGlvblN0YXR1c1Jlc291cmNlID0gdmVyaWZpY2F0aW9uLmFkZFJlc291cmNlKCdzdGF0dXMnKTtcbiAgICB2ZXJpZmljYXRpb25TdGF0dXNSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldFZlcmlmaWNhdGlvblN0YXR1c0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdmVyaWZpY2F0aW9uQXBwcm92ZVJlc291cmNlID0gdmVyaWZpY2F0aW9uLmFkZFJlc291cmNlKCdhcHByb3ZlJyk7XG4gICAgdmVyaWZpY2F0aW9uQXBwcm92ZVJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGFwcHJvdmVWZXJpZmljYXRpb25GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IHZlcmlmaWNhdGlvblJlamVjdFJlc291cmNlID0gdmVyaWZpY2F0aW9uLmFkZFJlc291cmNlKCdyZWplY3QnKTtcbiAgICB2ZXJpZmljYXRpb25SZWplY3RSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihyZWplY3RWZXJpZmljYXRpb25GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIEFJIFRleHQgUmVmaW5lbWVudCBMYW1iZGEgZnVuY3Rpb25cbiAgICBjb25zdCByZWZpbmVUZXh0RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1JlZmluZVRleHRGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9haS9yZWZpbmVUZXh0LnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge30sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgQmVkcm9jayBJbnZva2VNb2RlbCBwZXJtaXNzaW9uXG4gICAgcmVmaW5lVGV4dEZ1bmN0aW9uLmFkZFRvUm9sZVBvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgYWN0aW9uczogWydiZWRyb2NrOkludm9rZU1vZGVsJ10sXG4gICAgICAgIHJlc291cmNlczogWydhcm46YXdzOmJlZHJvY2s6dXMtZWFzdC0xOjpmb3VuZGF0aW9uLW1vZGVsL2FudGhyb3BpYy5jbGF1ZGUtaGFpa3UtNC01LTIwMjUxMDAxLXYxOjAnXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2gocmVmaW5lVGV4dEZ1bmN0aW9uKTtcblxuICAgIC8vIEFJIEFQSSBSb3V0ZXMgLSBQT1NUIC9haS9yZWZpbmVcbiAgICBjb25zdCBhaSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2FpJyk7XG4gICAgY29uc3QgYWlSZWZpbmUgPSBhaS5hZGRSZXNvdXJjZSgncmVmaW5lJyk7XG4gICAgYWlSZWZpbmUuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocmVmaW5lVGV4dEZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIENPUlMgaGVhZGVycyB0byBhbGwgZ2F0ZXdheSByZXNwb25zZXMgKGluY2x1ZGluZyBlcnJvcnMpXG4gICAgdGhpcy5hcGkuYWRkR2F0ZXdheVJlc3BvbnNlKCdEZWZhdWx0NFhYJywge1xuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5SZXNwb25zZVR5cGUuREVGQVVMVF80WFgsXG4gICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6IGAnKidgLFxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6IGAnQ29udGVudC1UeXBlLEF1dGhvcml6YXRpb24sWC1BbXotRGF0ZSxYLUFwaS1LZXksWC1BbXotU2VjdXJpdHktVG9rZW4nYCxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiBgJ0dFVCxQT1NULFBVVCxERUxFVEUsT1BUSU9OUydgLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYXBpLmFkZEdhdGV3YXlSZXNwb25zZSgnRGVmYXVsdDVYWCcsIHtcbiAgICAgIHR5cGU6IGFwaWdhdGV3YXkuUmVzcG9uc2VUeXBlLkRFRkFVTFRfNVhYLFxuICAgICAgcmVzcG9uc2VIZWFkZXJzOiB7XG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiBgJyonYCxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiBgJ0NvbnRlbnQtVHlwZSxBdXRob3JpemF0aW9uLFgtQW16LURhdGUsWC1BcGktS2V5LFgtQW16LVNlY3VyaXR5LVRva2VuJ2AsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogYCdHRVQsUE9TVCxQVVQsREVMRVRFLE9QVElPTlMnYCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaUVuZHBvaW50Jywge1xuICAgICAgdmFsdWU6IHRoaXMuYXBpRW5kcG9pbnQsXG4gICAgICBleHBvcnROYW1lOiBgQ29ubmVjdDQwLUFwaUVuZHBvaW50LSR7cHJvcHMuZW52TmFtZX1gLFxuICAgIH0pO1xuICB9XG59XG4iXX0=
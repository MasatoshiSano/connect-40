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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFDekQsK0RBQWlEO0FBQ2pELHFFQUErRDtBQUsvRCwyQ0FBNkI7QUFVN0IsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckIsR0FBRyxDQUFxQjtJQUN4QixXQUFXLENBQVM7SUFDcEIsVUFBVSxDQUF3QztJQUNsRCxTQUFTLEdBQXNCLEVBQUUsQ0FBQztJQUVsRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQW9CO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLG1CQUFtQjtRQUNuQixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQzdDLFdBQVcsRUFBRSxpQkFBaUIsS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUM3QyxXQUFXLEVBQUUsb0JBQW9CO1lBQ2pDLGFBQWEsRUFBRTtnQkFDYixTQUFTLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3hCLGNBQWMsRUFBRSxJQUFJO2dCQUNwQixZQUFZLEVBQUUsVUFBVSxDQUFDLGtCQUFrQixDQUFDLElBQUk7Z0JBQ2hELGdCQUFnQixFQUFFLEtBQUssQ0FBQyxPQUFPLEtBQUssTUFBTTtnQkFDMUMsY0FBYyxFQUFFLElBQUk7YUFDckI7WUFDRCwyQkFBMkIsRUFBRTtnQkFDM0IsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLG9DQUFvQztnQkFDL0UsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVztnQkFDekMsWUFBWSxFQUFFO29CQUNaLGNBQWM7b0JBQ2QsZUFBZTtvQkFDZixZQUFZ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QUVILElBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsWUFBWSxFQUFFO1lBQ3hDLElBQUksRUFBRSxVQUFVLENBQUMsWUFBWSxDQUFDLFdBQVc7WUFDekMsZUFBZSxFQUFFO2dCQUNmLDZCQUE2QixFQUFFLEtBQUs7Z0JBQ3BDLDhCQUE4QixFQUFFLHdFQUF3RTtnQkFDeEcsOEJBQThCLEVBQUUsK0JBQStCO2FBQ2hFO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsVUFBVTtRQUNWLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ3JDLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVztZQUN2QixVQUFVLEVBQUUseUJBQXlCLEtBQUssQ0FBQyxPQUFPLEVBQUU7U0FDckQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBaHhCRCw0QkFneEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgTm9kZWpzRnVuY3Rpb24gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLW5vZGVqcyc7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFwaVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGVudk5hbWU6IHN0cmluZztcbiAgdXNlclBvb2w6IGNvZ25pdG8uVXNlclBvb2w7XG4gIHRhYmxlOiBkeW5hbW9kYi5UYWJsZTtcbiAgYnVja2V0OiBzMy5CdWNrZXQ7XG4gIHdlYlNvY2tldEVuZHBvaW50Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQXBpU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XG4gIHB1YmxpYyByZWFkb25seSBhcGlFbmRwb2ludDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgYXV0aG9yaXplcjogYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcjtcbiAgcHVibGljIHJlYWRvbmx5IGZ1bmN0aW9uczogbGFtYmRhLkZ1bmN0aW9uW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQXBpU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gUkVTVCBBUEkgR2F0ZXdheVxuICAgIHRoaXMuYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnQXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6IGBDb25uZWN0NDAtQXBpLSR7cHJvcHMuZW52TmFtZX1gLFxuICAgICAgZGVzY3JpcHRpb246ICdDb25uZWN0NDAgUkVTVCBBUEknLFxuICAgICAgZGVwbG95T3B0aW9uczoge1xuICAgICAgICBzdGFnZU5hbWU6IHByb3BzLmVudk5hbWUsXG4gICAgICAgIHRyYWNpbmdFbmFibGVkOiB0cnVlLFxuICAgICAgICBsb2dnaW5nTGV2ZWw6IGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLklORk8sXG4gICAgICAgIGRhdGFUcmFjZUVuYWJsZWQ6IHByb3BzLmVudk5hbWUgIT09ICdwcm9kJyxcbiAgICAgICAgbWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICB9LFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLCAvLyBUT0RPOiBSZXN0cmljdCB0byBmcm9udGVuZCBkb21haW5cbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICAgIGFsbG93SGVhZGVyczogW1xuICAgICAgICAgICdDb250ZW50LVR5cGUnLFxuICAgICAgICAgICdBdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAnWC1BbXotRGF0ZScsXG4gICAgICAgICAgJ1gtQXBpLUtleScsXG4gICAgICAgICAgJ1gtQW16LVNlY3VyaXR5LVRva2VuJyxcbiAgICAgICAgICAnWC1BbXotVXNlci1BZ2VudCcsXG4gICAgICAgIF0sXG4gICAgICAgIGFsbG93Q3JlZGVudGlhbHM6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hcGlFbmRwb2ludCA9IHRoaXMuYXBpLnVybDtcblxuICAgIC8vIExhbWJkYSBMYXllciBmb3IgY29tbW9uIGNvZGUgLSBURU1QT1JBUklMWSBESVNBQkxFRFxuICAgIC8vIFRPRE86IEZpeCBsYXllciBzdHJ1Y3R1cmUgdG8gbWF0Y2ggTGFtYmRhIHJlcXVpcmVtZW50c1xuICAgIC8vIGNvbnN0IGNvbW1vbkxheWVyID0gbmV3IGxhbWJkYS5MYXllclZlcnNpb24odGhpcywgJ0NvbW1vbkxheWVyJywge1xuICAgIC8vICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2xheWVycy9jb21tb24nKSksXG4gICAgLy8gICBjb21wYXRpYmxlUnVudGltZXM6IFtsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWF0sXG4gICAgLy8gICBkZXNjcmlwdGlvbjogJ0NvbW1vbiB1dGlsaXRpZXMgYW5kIER5bmFtb0RCIGNsaWVudCcsXG4gICAgLy8gfSk7XG5cbiAgICAvLyBDb2duaXRvIEF1dGhvcml6ZXJcbiAgICB0aGlzLmF1dGhvcml6ZXIgPSBuZXcgYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcih0aGlzLCAnQXV0aG9yaXplcicsIHtcbiAgICAgIGNvZ25pdG9Vc2VyUG9vbHM6IFtwcm9wcy51c2VyUG9vbF0sXG4gICAgfSk7XG5cbiAgICAvLyBVc2VyIG1hbmFnZW1lbnQgTGFtYmRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IGNyZWF0ZVVzZXJGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnQ3JlYXRlVXNlckZ1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdXNlcnMvY3JlYXRlLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEJVQ0tFVF9OQU1FOiBwcm9wcy5idWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZ2V0VXNlckZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRVc2VyRnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy91c2Vycy9nZXQudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQlVDS0VUX05BTUU6IHByb3BzLmJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCB1cGRhdGVVc2VyRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1VwZGF0ZVVzZXJGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VzZXJzL3VwZGF0ZS50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgICBCVUNLRVRfTkFNRTogcHJvcHMuYnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdldFB1YmxpY1Byb2ZpbGVGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnR2V0UHVibGljUHJvZmlsZUZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VzZXJzL2dldFB1YmxpY1Byb2ZpbGUudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYmxvY2tVc2VyRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0Jsb2NrVXNlckZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VzZXJzL2Jsb2NrVXNlci50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCByZXBvcnRVc2VyRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1JlcG9ydFVzZXJGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy91c2Vycy9yZXBvcnRVc2VyLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNyZWF0ZVVzZXJGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGdldFVzZXJGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHVwZGF0ZVVzZXJGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkRGF0YShnZXRQdWJsaWNQcm9maWxlRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShibG9ja1VzZXJGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHJlcG9ydFVzZXJGdW5jdGlvbik7XG4gICAgcHJvcHMuYnVja2V0LmdyYW50UmVhZFdyaXRlKGNyZWF0ZVVzZXJGdW5jdGlvbik7XG4gICAgcHJvcHMuYnVja2V0LmdyYW50UmVhZFdyaXRlKHVwZGF0ZVVzZXJGdW5jdGlvbik7XG5cbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKFxuICAgICAgY3JlYXRlVXNlckZ1bmN0aW9uLFxuICAgICAgZ2V0VXNlckZ1bmN0aW9uLFxuICAgICAgdXBkYXRlVXNlckZ1bmN0aW9uLFxuICAgICAgZ2V0UHVibGljUHJvZmlsZUZ1bmN0aW9uLFxuICAgICAgYmxvY2tVc2VyRnVuY3Rpb24sXG4gICAgICByZXBvcnRVc2VyRnVuY3Rpb25cbiAgICApO1xuXG4gICAgLy8gQVBJIFJvdXRlc1xuICAgIGNvbnN0IHVzZXJzID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgndXNlcnMnKTtcblxuICAgIC8vIFBPU1QgL3VzZXJzIC0gQ3JlYXRlIHVzZXIgcHJvZmlsZVxuICAgIHVzZXJzLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZVVzZXJGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJNZSA9IHVzZXJzLmFkZFJlc291cmNlKCdtZScpO1xuXG4gICAgLy8gR0VUIC91c2Vycy9tZSAtIEdldCBjdXJyZW50IHVzZXIgcHJvZmlsZVxuICAgIHVzZXJNZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldFVzZXJGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFBVVCAvdXNlcnMvbWUgLSBVcGRhdGUgY3VycmVudCB1c2VyIHByb2ZpbGVcbiAgICB1c2VyTWUuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih1cGRhdGVVc2VyRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBHRVQgL3VzZXJzL3t1c2VySWR9L3Byb2ZpbGUgLSBHZXQgcHVibGljIHByb2ZpbGVcbiAgICBjb25zdCB1c2VyQnlJZCA9IHVzZXJzLmFkZFJlc291cmNlKCd7dXNlcklkfScpO1xuICAgIGNvbnN0IHVzZXJQcm9maWxlID0gdXNlckJ5SWQuYWRkUmVzb3VyY2UoJ3Byb2ZpbGUnKTtcbiAgICB1c2VyUHJvZmlsZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldFB1YmxpY1Byb2ZpbGVGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFBPU1QgL3VzZXJzL3t1c2VySWR9L2Jsb2NrIC0gQmxvY2sgYSB1c2VyXG4gICAgY29uc3QgdXNlckJsb2NrID0gdXNlckJ5SWQuYWRkUmVzb3VyY2UoJ2Jsb2NrJyk7XG4gICAgdXNlckJsb2NrLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGJsb2NrVXNlckZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUE9TVCAvcmVwb3J0cyAtIFJlcG9ydCBhIHVzZXJcbiAgICBjb25zdCByZXBvcnRzID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgncmVwb3J0cycpO1xuICAgIHJlcG9ydHMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocmVwb3J0VXNlckZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gVXNlciBEaXNjb3ZlcnkgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgZGlzY292ZXJVc2Vyc0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdEaXNjb3ZlclVzZXJzRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdXNlcnMvZGlzY292ZXIudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTUpLFxuICAgIH0pO1xuXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkRGF0YShkaXNjb3ZlclVzZXJzRnVuY3Rpb24pO1xuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2goZGlzY292ZXJVc2Vyc0Z1bmN0aW9uKTtcblxuICAgIC8vIEdFVCAvdXNlcnMvZGlzY292ZXIgLSBEaXNjb3ZlciB1c2VycyB3aXRoIHNpbWlsYXIgaW50ZXJlc3RzXG4gICAgY29uc3QgdXNlckRpc2NvdmVyID0gdXNlcnMuYWRkUmVzb3VyY2UoJ2Rpc2NvdmVyJyk7XG4gICAgdXNlckRpc2NvdmVyLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZGlzY292ZXJVc2Vyc0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gQWN0aXZpdHkgbWFuYWdlbWVudCBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgY3JlYXRlQWN0aXZpdHlGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnQ3JlYXRlQWN0aXZpdHlGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMvY3JlYXRlLnRzJyksXG4gICAgICAvLyBoYW5kbGVyIGRlZmF1bHRzIHRvICdoYW5kbGVyJyBpbiB0aGUgYnVuZGxlZCBpbmRleC5qc1xuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0QWN0aXZpdGllc0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdMaXN0QWN0aXZpdGllc0Z1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvYWN0aXZpdGllcy9saXN0LnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdldEFjdGl2aXR5RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldEFjdGl2aXR5RnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2dldC50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBqb2luQWN0aXZpdHlGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnSm9pbkFjdGl2aXR5RnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2pvaW4udHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgV0VCU09DS0VUX0VORFBPSU5UOiBwcm9wcy53ZWJTb2NrZXRFbmRwb2ludCB8fCAnJyxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbGVhdmVBY3Rpdml0eUZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdMZWF2ZUFjdGl2aXR5RnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2xlYXZlLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFdFQlNPQ0tFVF9FTkRQT0lOVDogcHJvcHMud2ViU29ja2V0RW5kcG9pbnQgfHwgJycsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNyZWF0ZUFjdGl2aXR5RnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsaXN0QWN0aXZpdGllc0Z1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZ2V0QWN0aXZpdHlGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGpvaW5BY3Rpdml0eUZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEobGVhdmVBY3Rpdml0eUZ1bmN0aW9uKTtcblxuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2goXG4gICAgICBjcmVhdGVBY3Rpdml0eUZ1bmN0aW9uLFxuICAgICAgbGlzdEFjdGl2aXRpZXNGdW5jdGlvbixcbiAgICAgIGdldEFjdGl2aXR5RnVuY3Rpb24sXG4gICAgICBqb2luQWN0aXZpdHlGdW5jdGlvbixcbiAgICAgIGxlYXZlQWN0aXZpdHlGdW5jdGlvblxuICAgICk7XG5cbiAgICAvLyBBY3Rpdml0eSBBUEkgUm91dGVzXG4gICAgY29uc3QgYWN0aXZpdGllcyA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2FjdGl2aXRpZXMnKTtcblxuICAgIC8vIFBPU1QgL2FjdGl2aXRpZXMgLSBDcmVhdGUgYWN0aXZpdHlcbiAgICBhY3Rpdml0aWVzLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUFjdGl2aXR5RnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBHRVQgL2FjdGl2aXRpZXMgLSBMaXN0IGFjdGl2aXRpZXNcbiAgICBhY3Rpdml0aWVzLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGlzdEFjdGl2aXRpZXNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIEdFVCAvYWN0aXZpdGllcy97aWR9IC0gR2V0IGFjdGl2aXR5XG4gICAgY29uc3QgYWN0aXZpdHlCeUlkID0gYWN0aXZpdGllcy5hZGRSZXNvdXJjZSgne2lkfScpO1xuICAgIGFjdGl2aXR5QnlJZC5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldEFjdGl2aXR5RnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBQVVQgL2FjdGl2aXRpZXMve2lkfSAtIFVwZGF0ZSBhY3Rpdml0eVxuICAgIGNvbnN0IHVwZGF0ZUFjdGl2aXR5RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1VwZGF0ZUFjdGl2aXR5RnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL3VwZGF0ZS50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHVwZGF0ZUFjdGl2aXR5RnVuY3Rpb24pO1xuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2godXBkYXRlQWN0aXZpdHlGdW5jdGlvbik7XG5cbiAgICBhY3Rpdml0eUJ5SWQuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih1cGRhdGVBY3Rpdml0eUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUE9TVCAvYWN0aXZpdGllcy97aWR9L2pvaW4gLSBKb2luIGFjdGl2aXR5XG4gICAgY29uc3QgYWN0aXZpdHlKb2luID0gYWN0aXZpdHlCeUlkLmFkZFJlc291cmNlKCdqb2luJyk7XG4gICAgYWN0aXZpdHlKb2luLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGpvaW5BY3Rpdml0eUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUE9TVCAvYWN0aXZpdGllcy97aWR9L2xlYXZlIC0gTGVhdmUgYWN0aXZpdHlcbiAgICBjb25zdCBhY3Rpdml0eUxlYXZlID0gYWN0aXZpdHlCeUlkLmFkZFJlc291cmNlKCdsZWF2ZScpO1xuICAgIGFjdGl2aXR5TGVhdmUuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGVhdmVBY3Rpdml0eUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gQWN0aXZpdHkgUmV2aWV3c1xuICAgIGNvbnN0IGNyZWF0ZVJldmlld0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdDcmVhdGVSZXZpZXdGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2NyZWF0ZVJldmlldy50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRSZXZpZXdzRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldFJldmlld3NGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2dldFJldmlld3MudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNyZWF0ZVJldmlld0Z1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWREYXRhKGdldFJldmlld3NGdW5jdGlvbik7XG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChjcmVhdGVSZXZpZXdGdW5jdGlvbiwgZ2V0UmV2aWV3c0Z1bmN0aW9uKTtcblxuICAgIC8vIC9hY3Rpdml0aWVzL3tpZH0vcmV2aWV3c1xuICAgIGNvbnN0IGFjdGl2aXR5UmV2aWV3cyA9IGFjdGl2aXR5QnlJZC5hZGRSZXNvdXJjZSgncmV2aWV3cycpO1xuICAgIGFjdGl2aXR5UmV2aWV3cy5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihjcmVhdGVSZXZpZXdGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcbiAgICBhY3Rpdml0eVJldmlld3MuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRSZXZpZXdzRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBDaGF0IG1hbmFnZW1lbnQgTGFtYmRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IGNyZWF0ZUNoYXRSb29tRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0NyZWF0ZUNoYXRSb29tRnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9jaGF0L2NyZWF0ZVJvb20udHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZ2V0Q2hhdFJvb21zRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldENoYXRSb29tc0Z1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvY2hhdC9nZXRSb29tcy50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgICBERVBMT1lfVkVSU0lPTjogJzInLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRDaGF0Um9vbUZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRDaGF0Um9vbUZ1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvY2hhdC9nZXRSb29tLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNyZWF0ZUNoYXRSb29tRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShnZXRDaGF0Um9vbXNGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGdldENoYXRSb29tRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChjcmVhdGVDaGF0Um9vbUZ1bmN0aW9uLCBnZXRDaGF0Um9vbXNGdW5jdGlvbiwgZ2V0Q2hhdFJvb21GdW5jdGlvbik7XG5cbiAgICAvLyBDaGF0IEFQSSBSb3V0ZXNcbiAgICBjb25zdCBjaGF0ID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnY2hhdCcpO1xuICAgIGNvbnN0IGNoYXRSb29tcyA9IGNoYXQuYWRkUmVzb3VyY2UoJ3Jvb21zJyk7XG5cbiAgICAvLyBQT1NUIC9jaGF0L3Jvb21zIC0gQ3JlYXRlIGNoYXQgcm9vbVxuICAgIGNoYXRSb29tcy5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihjcmVhdGVDaGF0Um9vbUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gR0VUIC9jaGF0L3Jvb21zIC0gR2V0IHVzZXIncyBjaGF0IHJvb21zXG4gICAgY2hhdFJvb21zLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0Q2hhdFJvb21zRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBHRVQgL2NoYXQvcm9vbXMve2NoYXRSb29tSWR9IC0gR2V0IGNoYXQgcm9vbSBkZXRhaWxzXG4gICAgY29uc3QgY2hhdFJvb21EZXRhaWwgPSBjaGF0Um9vbXMuYWRkUmVzb3VyY2UoJ3tjaGF0Um9vbUlkfScpO1xuICAgIGNoYXRSb29tRGV0YWlsLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0Q2hhdFJvb21GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFVwbG9hZCBtYW5hZ2VtZW50IExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGdldFByZXNpZ25lZFVybEZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRQcmVzaWduZWRVcmxGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VwbG9hZHMvZ2V0UHJlc2lnbmVkVXJsLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBVUExPQURTX0JVQ0tFVF9OQU1FOiBwcm9wcy5idWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgUzMgd3JpdGUgcGVybWlzc2lvbnNcbiAgICBwcm9wcy5idWNrZXQuZ3JhbnRQdXQoZ2V0UHJlc2lnbmVkVXJsRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChnZXRQcmVzaWduZWRVcmxGdW5jdGlvbik7XG5cbiAgICAvLyBVcGxvYWQgQVBJIFJvdXRlc1xuICAgIGNvbnN0IHVwbG9hZHMgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCd1cGxvYWRzJyk7XG4gICAgY29uc3QgcHJlc2lnbmVkVXJsID0gdXBsb2Fkcy5hZGRSZXNvdXJjZSgncHJlc2lnbmVkLXVybCcpO1xuXG4gICAgLy8gUE9TVCAvdXBsb2Fkcy9wcmVzaWduZWQtdXJsIC0gR2V0IHByZXNpZ25lZCBVUkwgZm9yIHVwbG9hZFxuICAgIHByZXNpZ25lZFVybC5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRQcmVzaWduZWRVcmxGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFBheW1lbnQgTGFtYmRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IGZyb250ZW5kVXJsID0gcHJvY2Vzcy5lbnYuRlJPTlRFTkRfVVJMIHx8ICdodHRwczovL2QyczBrOWd0c3h1M2V2LmNsb3VkZnJvbnQubmV0JztcbiAgICBjb25zdCBwYXltZW50RW52aXJvbm1lbnQgPSB7XG4gICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICBTVFJJUEVfU0VDUkVUX0tFWTogcHJvY2Vzcy5lbnYuU1RSSVBFX1NFQ1JFVF9LRVkgfHwgJycsXG4gICAgICBTVFJJUEVfV0VCSE9PS19TRUNSRVQ6IHByb2Nlc3MuZW52LlNUUklQRV9XRUJIT09LX1NFQ1JFVCB8fCAnJyxcbiAgICAgIEZST05URU5EX1VSTDogZnJvbnRlbmRVcmwsXG4gICAgfTtcblxuICAgIGNvbnN0IGNyZWF0ZUNoZWNrb3V0U2Vzc2lvbkZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgICdDcmVhdGVDaGVja291dFNlc3Npb25GdW5jdGlvbicsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3BheW1lbnQvY3JlYXRlQ2hlY2tvdXRTZXNzaW9uLnRzJyksXG4gICAgICAgIGVudmlyb25tZW50OiBwYXltZW50RW52aXJvbm1lbnQsXG4gICAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IHdlYmhvb2tGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnV2ViaG9va0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3BheW1lbnQvd2ViaG9vay50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHBheW1lbnRFbnZpcm9ubWVudCxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBjcmVhdGVQb3J0YWxTZXNzaW9uRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24oXG4gICAgICB0aGlzLFxuICAgICAgJ0NyZWF0ZVBvcnRhbFNlc3Npb25GdW5jdGlvbicsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3BheW1lbnQvY3JlYXRlUG9ydGFsU2Vzc2lvbi50cycpLFxuICAgICAgICBlbnZpcm9ubWVudDogcGF5bWVudEVudmlyb25tZW50LFxuICAgICAgICBidW5kbGluZzoge1xuICAgICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9uc1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShjcmVhdGVDaGVja291dFNlc3Npb25GdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHdlYmhvb2tGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkRGF0YShjcmVhdGVQb3J0YWxTZXNzaW9uRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChcbiAgICAgIGNyZWF0ZUNoZWNrb3V0U2Vzc2lvbkZ1bmN0aW9uLFxuICAgICAgd2ViaG9va0Z1bmN0aW9uLFxuICAgICAgY3JlYXRlUG9ydGFsU2Vzc2lvbkZ1bmN0aW9uXG4gICAgKTtcblxuICAgIC8vIFBheW1lbnQgQVBJIFJvdXRlc1xuICAgIGNvbnN0IHBheW1lbnQgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdwYXltZW50Jyk7XG5cbiAgICAvLyBQT1NUIC9wYXltZW50L2NoZWNrb3V0XG4gICAgY29uc3QgY2hlY2tvdXQgPSBwYXltZW50LmFkZFJlc291cmNlKCdjaGVja291dCcpO1xuICAgIGNoZWNrb3V0LmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUNoZWNrb3V0U2Vzc2lvbkZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUE9TVCAvcGF5bWVudC93ZWJob29rIChubyBhdXRoIHJlcXVpcmVkIC0gU3RyaXBlIHdpbGwgc2VuZCBzaWduYXR1cmUpXG4gICAgY29uc3Qgd2ViaG9vayA9IHBheW1lbnQuYWRkUmVzb3VyY2UoJ3dlYmhvb2snKTtcbiAgICB3ZWJob29rLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHdlYmhvb2tGdW5jdGlvbikpO1xuXG4gICAgLy8gUE9TVCAvcGF5bWVudC9wb3J0YWxcbiAgICBjb25zdCBwb3J0YWwgPSBwYXltZW50LmFkZFJlc291cmNlKCdwb3J0YWwnKTtcbiAgICBwb3J0YWwuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oY3JlYXRlUG9ydGFsU2Vzc2lvbkZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUGhvdG8gR2FsbGVyeSBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgdXBsb2FkUGhvdG9GdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnVXBsb2FkUGhvdG9GdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL3VwbG9hZFBob3RvLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEJVQ0tFVF9OQU1FOiBwcm9wcy5idWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZ2V0UGhvdG9zRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldFBob3Rvc0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMvZ2V0UGhvdG9zLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zIGZvciBwaG90byBmdW5jdGlvbnNcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEodXBsb2FkUGhvdG9GdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkRGF0YShnZXRQaG90b3NGdW5jdGlvbik7XG4gICAgcHJvcHMuYnVja2V0LmdyYW50UmVhZFdyaXRlKHVwbG9hZFBob3RvRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaCh1cGxvYWRQaG90b0Z1bmN0aW9uLCBnZXRQaG90b3NGdW5jdGlvbik7XG5cbiAgICAvLyBQaG90byBBUEkgUm91dGVzIC0gUE9TVC9HRVQgL2FjdGl2aXRpZXMve2lkfS9waG90b3NcbiAgICBjb25zdCBhY3Rpdml0eVBob3RvcyA9IGFjdGl2aXR5QnlJZC5hZGRSZXNvdXJjZSgncGhvdG9zJyk7XG4gICAgYWN0aXZpdHlQaG90b3MuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odXBsb2FkUGhvdG9GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcbiAgICBhY3Rpdml0eVBob3Rvcy5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldFBob3Rvc0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUmVjb21tZW5kYXRpb25zIExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGdldFJlY29tbWVuZGF0aW9uc0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRSZWNvbW1lbmRhdGlvbnNGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9yZWNvbW1lbmRhdGlvbnMvZ2V0LnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KTtcblxuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZERhdGEoZ2V0UmVjb21tZW5kYXRpb25zRnVuY3Rpb24pO1xuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2goZ2V0UmVjb21tZW5kYXRpb25zRnVuY3Rpb24pO1xuXG4gICAgLy8gUmVjb21tZW5kYXRpb25zIEFQSSBSb3V0ZSAtIEdFVCAvcmVjb21tZW5kYXRpb25zXG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgncmVjb21tZW5kYXRpb25zJyk7XG4gICAgcmVjb21tZW5kYXRpb25zLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0UmVjb21tZW5kYXRpb25zRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBWZXJpZmljYXRpb24gTGFtYmRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IHZlcmlmaWNhdGlvbkNoZWNrb3V0RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1ZlcmlmaWNhdGlvbkNoZWNrb3V0Jywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3ZlcmlmaWNhdGlvbi9jcmVhdGVDaGVja291dC50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgICBTVFJJUEVfU0VDUkVUX0tFWTogcHJvY2Vzcy5lbnYuU1RSSVBFX1NFQ1JFVF9LRVkgfHwgJycsXG4gICAgICAgIEZST05URU5EX1VSTDogZnJvbnRlbmRVcmwsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHsgbWluaWZ5OiB0cnVlLCBzb3VyY2VNYXA6IHRydWUsIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRWZXJpZmljYXRpb25TdGF0dXNGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnR2V0VmVyaWZpY2F0aW9uU3RhdHVzJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3ZlcmlmaWNhdGlvbi9nZXRTdGF0dXMudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7IFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSB9LFxuICAgICAgYnVuZGxpbmc6IHsgbWluaWZ5OiB0cnVlLCBzb3VyY2VNYXA6IHRydWUsIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBhcHByb3ZlVmVyaWZpY2F0aW9uRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0FwcHJvdmVWZXJpZmljYXRpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdmVyaWZpY2F0aW9uL2FwcHJvdmUudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQURNSU5fVVNFUl9JRFM6IHByb2Nlc3MuZW52LkFETUlOX1VTRVJfSURTIHx8ICcnLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7IG1pbmlmeTogdHJ1ZSwgc291cmNlTWFwOiB0cnVlLCBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLCBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcmVqZWN0VmVyaWZpY2F0aW9uRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1JlamVjdFZlcmlmaWNhdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy92ZXJpZmljYXRpb24vcmVqZWN0LnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEFETUlOX1VTRVJfSURTOiBwcm9jZXNzLmVudi5BRE1JTl9VU0VSX0lEUyB8fCAnJyxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzogeyBtaW5pZnk6IHRydWUsIHNvdXJjZU1hcDogdHJ1ZSwgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSwgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh2ZXJpZmljYXRpb25DaGVja291dEZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWREYXRhKGdldFZlcmlmaWNhdGlvblN0YXR1c0Z1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYXBwcm92ZVZlcmlmaWNhdGlvbkZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEocmVqZWN0VmVyaWZpY2F0aW9uRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChcbiAgICAgIHZlcmlmaWNhdGlvbkNoZWNrb3V0RnVuY3Rpb24sXG4gICAgICBnZXRWZXJpZmljYXRpb25TdGF0dXNGdW5jdGlvbixcbiAgICAgIGFwcHJvdmVWZXJpZmljYXRpb25GdW5jdGlvbixcbiAgICAgIHJlamVjdFZlcmlmaWNhdGlvbkZ1bmN0aW9uLFxuICAgICk7XG5cbiAgICAvLyBWZXJpZmljYXRpb24gQVBJIFJvdXRlc1xuICAgIGNvbnN0IHZlcmlmaWNhdGlvbiA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3ZlcmlmaWNhdGlvbicpO1xuXG4gICAgY29uc3QgdmVyaWZpY2F0aW9uQ2hlY2tvdXRSZXNvdXJjZSA9IHZlcmlmaWNhdGlvbi5hZGRSZXNvdXJjZSgnY2hlY2tvdXQnKTtcbiAgICB2ZXJpZmljYXRpb25DaGVja291dFJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHZlcmlmaWNhdGlvbkNoZWNrb3V0RnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICBjb25zdCB2ZXJpZmljYXRpb25TdGF0dXNSZXNvdXJjZSA9IHZlcmlmaWNhdGlvbi5hZGRSZXNvdXJjZSgnc3RhdHVzJyk7XG4gICAgdmVyaWZpY2F0aW9uU3RhdHVzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRWZXJpZmljYXRpb25TdGF0dXNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IHZlcmlmaWNhdGlvbkFwcHJvdmVSZXNvdXJjZSA9IHZlcmlmaWNhdGlvbi5hZGRSZXNvdXJjZSgnYXBwcm92ZScpO1xuICAgIHZlcmlmaWNhdGlvbkFwcHJvdmVSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihhcHByb3ZlVmVyaWZpY2F0aW9uRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICBjb25zdCB2ZXJpZmljYXRpb25SZWplY3RSZXNvdXJjZSA9IHZlcmlmaWNhdGlvbi5hZGRSZXNvdXJjZSgncmVqZWN0Jyk7XG4gICAgdmVyaWZpY2F0aW9uUmVqZWN0UmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocmVqZWN0VmVyaWZpY2F0aW9uRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgQ09SUyBoZWFkZXJzIHRvIGFsbCBnYXRld2F5IHJlc3BvbnNlcyAoaW5jbHVkaW5nIGVycm9ycylcbiAgICB0aGlzLmFwaS5hZGRHYXRld2F5UmVzcG9uc2UoJ0RlZmF1bHQ0WFgnLCB7XG4gICAgICB0eXBlOiBhcGlnYXRld2F5LlJlc3BvbnNlVHlwZS5ERUZBVUxUXzRYWCxcbiAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogYCcqJ2AsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogYCdDb250ZW50LVR5cGUsQXV0aG9yaXphdGlvbixYLUFtei1EYXRlLFgtQXBpLUtleSxYLUFtei1TZWN1cml0eS1Ub2tlbidgLFxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6IGAnR0VULFBPU1QsUFVULERFTEVURSxPUFRJT05TJ2AsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hcGkuYWRkR2F0ZXdheVJlc3BvbnNlKCdEZWZhdWx0NVhYJywge1xuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5SZXNwb25zZVR5cGUuREVGQVVMVF81WFgsXG4gICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6IGAnKidgLFxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6IGAnQ29udGVudC1UeXBlLEF1dGhvcml6YXRpb24sWC1BbXotRGF0ZSxYLUFwaS1LZXksWC1BbXotU2VjdXJpdHktVG9rZW4nYCxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiBgJ0dFVCxQT1NULFBVVCxERUxFVEUsT1BUSU9OUydgLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpRW5kcG9pbnQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5hcGlFbmRwb2ludCxcbiAgICAgIGV4cG9ydE5hbWU6IGBDb25uZWN0NDAtQXBpRW5kcG9pbnQtJHtwcm9wcy5lbnZOYW1lfWAsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
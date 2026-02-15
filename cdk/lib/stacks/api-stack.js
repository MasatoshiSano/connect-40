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
        this.functions.push(createActivityFunction, listActivitiesFunction, getActivityFunction, joinActivityFunction);
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
        // POST /activities/{id}/join - Join activity
        const activityJoin = activityById.addResource('join');
        activityJoin.addMethod('POST', new apigateway.LambdaIntegration(joinActivityFunction), {
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
        // Payment Lambda functions - TEMPORARILY DISABLED FOR TESTING
        // TODO: Re-enable after fixing bundling issue
        /*
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
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
        */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFDekQsK0RBQWlEO0FBQ2pELHFFQUErRDtBQUsvRCwyQ0FBNkI7QUFTN0IsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckIsR0FBRyxDQUFxQjtJQUN4QixXQUFXLENBQVM7SUFDcEIsVUFBVSxDQUF3QztJQUNsRCxTQUFTLEdBQXNCLEVBQUUsQ0FBQztJQUVsRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQW9CO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLG1CQUFtQjtRQUNuQixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQzdDLFdBQVcsRUFBRSxpQkFBaUIsS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUM3QyxXQUFXLEVBQUUsb0JBQW9CO1lBQ2pDLGFBQWEsRUFBRTtnQkFDYixTQUFTLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3hCLGNBQWMsRUFBRSxJQUFJO2dCQUNwQixZQUFZLEVBQUUsVUFBVSxDQUFDLGtCQUFrQixDQUFDLElBQUk7Z0JBQ2hELGdCQUFnQixFQUFFLEtBQUssQ0FBQyxPQUFPLEtBQUssTUFBTTtnQkFDMUMsY0FBYyxFQUFFLElBQUk7YUFDckI7WUFDRCwyQkFBMkIsRUFBRTtnQkFDM0IsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLG9DQUFvQztnQkFDL0UsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVztnQkFDekMsWUFBWSxFQUFFO29CQUNaLGNBQWM7b0JBQ2QsZUFBZTtvQkFDZixZQUFZ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LENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNyQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDdkIsVUFBVSxFQUFFLHlCQUF5QixLQUFLLENBQUMsT0FBTyxFQUFFO1NBQ3JELENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTdaRCw0QkE2WkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBOb2RlanNGdW5jdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtbm9kZWpzJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBpU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgZW52TmFtZTogc3RyaW5nO1xuICB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcbiAgdGFibGU6IGR5bmFtb2RiLlRhYmxlO1xuICBidWNrZXQ6IHMzLkJ1Y2tldDtcbn1cblxuZXhwb3J0IGNsYXNzIEFwaVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGFwaTogYXBpZ2F0ZXdheS5SZXN0QXBpO1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpRW5kcG9pbnQ6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IGF1dGhvcml6ZXI6IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXI7XG4gIHB1YmxpYyByZWFkb25seSBmdW5jdGlvbnM6IGxhbWJkYS5GdW5jdGlvbltdID0gW107XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFwaVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIFJFU1QgQVBJIEdhdGV3YXlcbiAgICB0aGlzLmFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0FwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiBgQ29ubmVjdDQwLUFwaS0ke3Byb3BzLmVudk5hbWV9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29ubmVjdDQwIFJFU1QgQVBJJyxcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcbiAgICAgICAgc3RhZ2VOYW1lOiBwcm9wcy5lbnZOYW1lLFxuICAgICAgICB0cmFjaW5nRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgbG9nZ2luZ0xldmVsOiBhcGlnYXRld2F5Lk1ldGhvZExvZ2dpbmdMZXZlbC5JTkZPLFxuICAgICAgICBkYXRhVHJhY2VFbmFibGVkOiBwcm9wcy5lbnZOYW1lICE9PSAncHJvZCcsXG4gICAgICAgIG1ldHJpY3NFbmFibGVkOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUywgLy8gVE9ETzogUmVzdHJpY3QgdG8gZnJvbnRlbmQgZG9tYWluXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IFtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJyxcbiAgICAgICAgICAnQXV0aG9yaXphdGlvbicsXG4gICAgICAgICAgJ1gtQW16LURhdGUnLFxuICAgICAgICAgICdYLUFwaS1LZXknLFxuICAgICAgICAgICdYLUFtei1TZWN1cml0eS1Ub2tlbicsXG4gICAgICAgICAgJ1gtQW16LVVzZXItQWdlbnQnLFxuICAgICAgICBdLFxuICAgICAgICBhbGxvd0NyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYXBpRW5kcG9pbnQgPSB0aGlzLmFwaS51cmw7XG5cbiAgICAvLyBMYW1iZGEgTGF5ZXIgZm9yIGNvbW1vbiBjb2RlIC0gVEVNUE9SQVJJTFkgRElTQUJMRURcbiAgICAvLyBUT0RPOiBGaXggbGF5ZXIgc3RydWN0dXJlIHRvIG1hdGNoIExhbWJkYSByZXF1aXJlbWVudHNcbiAgICAvLyBjb25zdCBjb21tb25MYXllciA9IG5ldyBsYW1iZGEuTGF5ZXJWZXJzaW9uKHRoaXMsICdDb21tb25MYXllcicsIHtcbiAgICAvLyAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9sYXllcnMvY29tbW9uJykpLFxuICAgIC8vICAgY29tcGF0aWJsZVJ1bnRpbWVzOiBbbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1hdLFxuICAgIC8vICAgZGVzY3JpcHRpb246ICdDb21tb24gdXRpbGl0aWVzIGFuZCBEeW5hbW9EQiBjbGllbnQnLFxuICAgIC8vIH0pO1xuXG4gICAgLy8gQ29nbml0byBBdXRob3JpemVyXG4gICAgdGhpcy5hdXRob3JpemVyID0gbmV3IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIodGhpcywgJ0F1dGhvcml6ZXInLCB7XG4gICAgICBjb2duaXRvVXNlclBvb2xzOiBbcHJvcHMudXNlclBvb2xdLFxuICAgIH0pO1xuXG4gICAgLy8gVXNlciBtYW5hZ2VtZW50IExhbWJkYSBmdW5jdGlvbnNcbiAgICBjb25zdCBjcmVhdGVVc2VyRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0NyZWF0ZVVzZXJGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VzZXJzL2NyZWF0ZS50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgICBCVUNLRVRfTkFNRTogcHJvcHMuYnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdldFVzZXJGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnR2V0VXNlckZ1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvdXNlcnMvZ2V0LnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEJVQ0tFVF9OQU1FOiBwcm9wcy5idWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdXBkYXRlVXNlckZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdVcGRhdGVVc2VyRnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy91c2Vycy91cGRhdGUudHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQlVDS0VUX05BTUU6IHByb3BzLmJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9uc1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShjcmVhdGVVc2VyRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShnZXRVc2VyRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh1cGRhdGVVc2VyRnVuY3Rpb24pO1xuICAgIHByb3BzLmJ1Y2tldC5ncmFudFJlYWRXcml0ZShjcmVhdGVVc2VyRnVuY3Rpb24pO1xuICAgIHByb3BzLmJ1Y2tldC5ncmFudFJlYWRXcml0ZSh1cGRhdGVVc2VyRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChjcmVhdGVVc2VyRnVuY3Rpb24sIGdldFVzZXJGdW5jdGlvbiwgdXBkYXRlVXNlckZ1bmN0aW9uKTtcblxuICAgIC8vIEFQSSBSb3V0ZXNcbiAgICBjb25zdCB1c2VycyA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3VzZXJzJyk7XG5cbiAgICAvLyBQT1NUIC91c2VycyAtIENyZWF0ZSB1c2VyIHByb2ZpbGVcbiAgICB1c2Vycy5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihjcmVhdGVVc2VyRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICBjb25zdCB1c2VyTWUgPSB1c2Vycy5hZGRSZXNvdXJjZSgnbWUnKTtcblxuICAgIC8vIEdFVCAvdXNlcnMvbWUgLSBHZXQgY3VycmVudCB1c2VyIHByb2ZpbGVcbiAgICB1c2VyTWUuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRVc2VyRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBQVVQgL3VzZXJzL21lIC0gVXBkYXRlIGN1cnJlbnQgdXNlciBwcm9maWxlXG4gICAgdXNlck1lLmFkZE1ldGhvZCgnUFVUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odXBkYXRlVXNlckZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gQWN0aXZpdHkgbWFuYWdlbWVudCBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgY3JlYXRlQWN0aXZpdHlGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnQ3JlYXRlQWN0aXZpdHlGdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMvY3JlYXRlLnRzJyksXG4gICAgICAvLyBoYW5kbGVyIGRlZmF1bHRzIHRvICdoYW5kbGVyJyBpbiB0aGUgYnVuZGxlZCBpbmRleC5qc1xuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0QWN0aXZpdGllc0Z1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdMaXN0QWN0aXZpdGllc0Z1bmN0aW9uVjInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvYWN0aXZpdGllcy9saXN0LnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdldEFjdGl2aXR5RnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldEFjdGl2aXR5RnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2dldC50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBqb2luQWN0aXZpdHlGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnSm9pbkFjdGl2aXR5RnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzL2pvaW4udHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnNcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3JlYXRlQWN0aXZpdHlGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGxpc3RBY3Rpdml0aWVzRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShnZXRBY3Rpdml0eUZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoam9pbkFjdGl2aXR5RnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChcbiAgICAgIGNyZWF0ZUFjdGl2aXR5RnVuY3Rpb24sXG4gICAgICBsaXN0QWN0aXZpdGllc0Z1bmN0aW9uLFxuICAgICAgZ2V0QWN0aXZpdHlGdW5jdGlvbixcbiAgICAgIGpvaW5BY3Rpdml0eUZ1bmN0aW9uXG4gICAgKTtcblxuICAgIC8vIEFjdGl2aXR5IEFQSSBSb3V0ZXNcbiAgICBjb25zdCBhY3Rpdml0aWVzID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnYWN0aXZpdGllcycpO1xuXG4gICAgLy8gUE9TVCAvYWN0aXZpdGllcyAtIENyZWF0ZSBhY3Rpdml0eVxuICAgIGFjdGl2aXRpZXMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oY3JlYXRlQWN0aXZpdHlGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIEdFVCAvYWN0aXZpdGllcyAtIExpc3QgYWN0aXZpdGllc1xuICAgIGFjdGl2aXRpZXMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsaXN0QWN0aXZpdGllc0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gR0VUIC9hY3Rpdml0aWVzL3tpZH0gLSBHZXQgYWN0aXZpdHlcbiAgICBjb25zdCBhY3Rpdml0eUJ5SWQgPSBhY3Rpdml0aWVzLmFkZFJlc291cmNlKCd7aWR9Jyk7XG4gICAgYWN0aXZpdHlCeUlkLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0QWN0aXZpdHlGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFBPU1QgL2FjdGl2aXRpZXMve2lkfS9qb2luIC0gSm9pbiBhY3Rpdml0eVxuICAgIGNvbnN0IGFjdGl2aXR5Sm9pbiA9IGFjdGl2aXR5QnlJZC5hZGRSZXNvdXJjZSgnam9pbicpO1xuICAgIGFjdGl2aXR5Sm9pbi5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihqb2luQWN0aXZpdHlGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIENoYXQgbWFuYWdlbWVudCBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgY3JlYXRlQ2hhdFJvb21GdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnQ3JlYXRlQ2hhdFJvb21GdW5jdGlvblYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL2NoYXQvY3JlYXRlUm9vbS50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRDaGF0Um9vbXNGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnR2V0Q2hhdFJvb21zRnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9jaGF0L2dldFJvb21zLnRzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdldENoYXRSb29tRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldENoYXRSb29tRnVuY3Rpb25WMicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy9jaGF0L2dldFJvb20udHMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgZm9yY2VEb2NrZXJCdW5kbGluZzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnNcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3JlYXRlQ2hhdFJvb21GdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGdldENoYXRSb29tc0Z1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZ2V0Q2hhdFJvb21GdW5jdGlvbik7XG5cbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKGNyZWF0ZUNoYXRSb29tRnVuY3Rpb24sIGdldENoYXRSb29tc0Z1bmN0aW9uLCBnZXRDaGF0Um9vbUZ1bmN0aW9uKTtcblxuICAgIC8vIENoYXQgQVBJIFJvdXRlc1xuICAgIGNvbnN0IGNoYXQgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdjaGF0Jyk7XG4gICAgY29uc3QgY2hhdFJvb21zID0gY2hhdC5hZGRSZXNvdXJjZSgncm9vbXMnKTtcblxuICAgIC8vIFBPU1QgL2NoYXQvcm9vbXMgLSBDcmVhdGUgY2hhdCByb29tXG4gICAgY2hhdFJvb21zLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUNoYXRSb29tRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBHRVQgL2NoYXQvcm9vbXMgLSBHZXQgdXNlcidzIGNoYXQgcm9vbXNcbiAgICBjaGF0Um9vbXMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRDaGF0Um9vbXNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIEdFVCAvY2hhdC9yb29tcy97Y2hhdFJvb21JZH0gLSBHZXQgY2hhdCByb29tIGRldGFpbHNcbiAgICBjb25zdCBjaGF0Um9vbURldGFpbCA9IGNoYXRSb29tcy5hZGRSZXNvdXJjZSgne2NoYXRSb29tSWR9Jyk7XG4gICAgY2hhdFJvb21EZXRhaWwuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRDaGF0Um9vbUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUGF5bWVudCBMYW1iZGEgZnVuY3Rpb25zIC0gVEVNUE9SQVJJTFkgRElTQUJMRUQgRk9SIFRFU1RJTkdcbiAgICAvLyBUT0RPOiBSZS1lbmFibGUgYWZ0ZXIgZml4aW5nIGJ1bmRsaW5nIGlzc3VlXG4gICAgLypcbiAgICBjb25zdCBmcm9udGVuZFVybCA9IHByb2Nlc3MuZW52LkZST05URU5EX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDo1MTczJztcbiAgICBjb25zdCBwYXltZW50RW52aXJvbm1lbnQgPSB7XG4gICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICBTVFJJUEVfU0VDUkVUX0tFWTogcHJvY2Vzcy5lbnYuU1RSSVBFX1NFQ1JFVF9LRVkgfHwgJycsXG4gICAgICBTVFJJUEVfV0VCSE9PS19TRUNSRVQ6IHByb2Nlc3MuZW52LlNUUklQRV9XRUJIT09LX1NFQ1JFVCB8fCAnJyxcbiAgICAgIEZST05URU5EX1VSTDogZnJvbnRlbmRVcmwsXG4gICAgfTtcblxuICAgIGNvbnN0IGNyZWF0ZUNoZWNrb3V0U2Vzc2lvbkZ1bmN0aW9uID0gbmV3IE5vZGVqc0Z1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgICdDcmVhdGVDaGVja291dFNlc3Npb25GdW5jdGlvbicsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3BheW1lbnQvY3JlYXRlQ2hlY2tvdXRTZXNzaW9uLnRzJyksXG4gICAgICAgIGVudmlyb25tZW50OiBwYXltZW50RW52aXJvbm1lbnQsXG4gICAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICB9LFxuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IHdlYmhvb2tGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnV2ViaG9va0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3BheW1lbnQvd2ViaG9vay50cycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHBheW1lbnRFbnZpcm9ubWVudCxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBjcmVhdGVQb3J0YWxTZXNzaW9uRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24oXG4gICAgICB0aGlzLFxuICAgICAgJ0NyZWF0ZVBvcnRhbFNlc3Npb25GdW5jdGlvbicsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3BheW1lbnQvY3JlYXRlUG9ydGFsU2Vzc2lvbi50cycpLFxuICAgICAgICBlbnZpcm9ubWVudDogcGF5bWVudEVudmlyb25tZW50LFxuICAgICAgICBidW5kbGluZzoge1xuICAgICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbJ0Bhd3Mtc2RrLyonXSxcbiAgICAgICAgfSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9uc1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShjcmVhdGVDaGVja291dFNlc3Npb25GdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHdlYmhvb2tGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkRGF0YShjcmVhdGVQb3J0YWxTZXNzaW9uRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChcbiAgICAgIGNyZWF0ZUNoZWNrb3V0U2Vzc2lvbkZ1bmN0aW9uLFxuICAgICAgd2ViaG9va0Z1bmN0aW9uLFxuICAgICAgY3JlYXRlUG9ydGFsU2Vzc2lvbkZ1bmN0aW9uXG4gICAgKTtcblxuICAgIC8vIFBheW1lbnQgQVBJIFJvdXRlc1xuICAgIGNvbnN0IHBheW1lbnQgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdwYXltZW50Jyk7XG5cbiAgICAvLyBQT1NUIC9wYXltZW50L2NoZWNrb3V0XG4gICAgY29uc3QgY2hlY2tvdXQgPSBwYXltZW50LmFkZFJlc291cmNlKCdjaGVja291dCcpO1xuICAgIGNoZWNrb3V0LmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUNoZWNrb3V0U2Vzc2lvbkZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gUE9TVCAvcGF5bWVudC93ZWJob29rIChubyBhdXRoIHJlcXVpcmVkIC0gU3RyaXBlIHdpbGwgc2VuZCBzaWduYXR1cmUpXG4gICAgY29uc3Qgd2ViaG9vayA9IHBheW1lbnQuYWRkUmVzb3VyY2UoJ3dlYmhvb2snKTtcbiAgICB3ZWJob29rLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHdlYmhvb2tGdW5jdGlvbikpO1xuXG4gICAgLy8gUE9TVCAvcGF5bWVudC9wb3J0YWxcbiAgICBjb25zdCBwb3J0YWwgPSBwYXltZW50LmFkZFJlc291cmNlKCdwb3J0YWwnKTtcbiAgICBwb3J0YWwuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oY3JlYXRlUG9ydGFsU2Vzc2lvbkZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuICAgICovXG5cbiAgICAvLyBBZGQgQ09SUyBoZWFkZXJzIHRvIGFsbCBnYXRld2F5IHJlc3BvbnNlcyAoaW5jbHVkaW5nIGVycm9ycylcbiAgICB0aGlzLmFwaS5hZGRHYXRld2F5UmVzcG9uc2UoJ0RlZmF1bHQ0WFgnLCB7XG4gICAgICB0eXBlOiBhcGlnYXRld2F5LlJlc3BvbnNlVHlwZS5ERUZBVUxUXzRYWCxcbiAgICAgIHJlc3BvbnNlSGVhZGVyczoge1xuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogYCcqJ2AsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogYCdDb250ZW50LVR5cGUsQXV0aG9yaXphdGlvbixYLUFtei1EYXRlLFgtQXBpLUtleSxYLUFtei1TZWN1cml0eS1Ub2tlbidgLFxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6IGAnR0VULFBPU1QsUFVULERFTEVURSxPUFRJT05TJ2AsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hcGkuYWRkR2F0ZXdheVJlc3BvbnNlKCdEZWZhdWx0NVhYJywge1xuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5SZXNwb25zZVR5cGUuREVGQVVMVF81WFgsXG4gICAgICByZXNwb25zZUhlYWRlcnM6IHtcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6IGAnKidgLFxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6IGAnQ29udGVudC1UeXBlLEF1dGhvcml6YXRpb24sWC1BbXotRGF0ZSxYLUFwaS1LZXksWC1BbXotU2VjdXJpdHktVG9rZW4nYCxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiBgJ0dFVCxQT1NULFBVVCxERUxFVEUsT1BUSU9OUydgLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpRW5kcG9pbnQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5hcGlFbmRwb2ludCxcbiAgICAgIGV4cG9ydE5hbWU6IGBDb25uZWN0NDAtQXBpRW5kcG9pbnQtJHtwcm9wcy5lbnZOYW1lfWAsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
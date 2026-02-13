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
class ApiStack extends cdk.Stack {
    api;
    apiEndpoint;
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
        this.functions.push(createActivityFunction, listActivitiesFunction, getActivityFunction, joinActivityFunction);
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
exports.ApiStack = ApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFDekQsK0RBQWlEO0FBYWpELE1BQWEsUUFBUyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3JCLEdBQUcsQ0FBcUI7SUFDeEIsV0FBVyxDQUFTO0lBQ3BCLFNBQVMsR0FBc0IsRUFBRSxDQUFDO0lBRWxELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBb0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsbUJBQW1CO1FBQ25CLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7WUFDN0MsV0FBVyxFQUFFLGlCQUFpQixLQUFLLENBQUMsT0FBTyxFQUFFO1lBQzdDLFdBQVcsRUFBRSxvQkFBb0I7WUFDakMsYUFBYSxFQUFFO2dCQUNiLFNBQVMsRUFBRSxLQUFLLENBQUMsT0FBTztnQkFDeEIsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxVQUFVLENBQUMsa0JBQWtCLENBQUMsSUFBSTtnQkFDaEQsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLE9BQU8sS0FBSyxNQUFNO2dCQUMxQyxjQUFjLEVBQUUsSUFBSTthQUNyQjtZQUNELDJCQUEyQixFQUFFO2dCQUMzQixZQUFZLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsb0NBQW9DO2dCQUMvRSxZQUFZLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXO2dCQUN6QyxZQUFZLEVBQUUsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDO2dCQUMvQyxnQkFBZ0IsRUFBRSxJQUFJO2FBQ3ZCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgs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QUUseUJBQXlCLEtBQUssQ0FBQyxPQUFPLEVBQUU7U0FDckQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBL09ELDRCQStPQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBBcGlTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBlbnZOYW1lOiBzdHJpbmc7XG4gIHVzZXJQb29sOiBjb2duaXRvLlVzZXJQb29sO1xuICB0YWJsZTogZHluYW1vZGIuVGFibGU7XG4gIGJ1Y2tldDogczMuQnVja2V0O1xufVxuXG5leHBvcnQgY2xhc3MgQXBpU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XG4gIHB1YmxpYyByZWFkb25seSBhcGlFbmRwb2ludDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgZnVuY3Rpb25zOiBsYW1iZGEuRnVuY3Rpb25bXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBBcGlTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBSRVNUIEFQSSBHYXRld2F5XG4gICAgdGhpcy5hcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdBcGknLCB7XG4gICAgICByZXN0QXBpTmFtZTogYENvbm5lY3Q0MC1BcGktJHtwcm9wcy5lbnZOYW1lfWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nvbm5lY3Q0MCBSRVNUIEFQSScsXG4gICAgICBkZXBsb3lPcHRpb25zOiB7XG4gICAgICAgIHN0YWdlTmFtZTogcHJvcHMuZW52TmFtZSxcbiAgICAgICAgdHJhY2luZ0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIGxvZ2dpbmdMZXZlbDogYXBpZ2F0ZXdheS5NZXRob2RMb2dnaW5nTGV2ZWwuSU5GTyxcbiAgICAgICAgZGF0YVRyYWNlRW5hYmxlZDogcHJvcHMuZW52TmFtZSAhPT0gJ3Byb2QnLFxuICAgICAgICBtZXRyaWNzRW5hYmxlZDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsIC8vIFRPRE86IFJlc3RyaWN0IHRvIGZyb250ZW5kIGRvbWFpblxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJ10sXG4gICAgICAgIGFsbG93Q3JlZGVudGlhbHM6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hcGlFbmRwb2ludCA9IHRoaXMuYXBpLnVybDtcblxuICAgIC8vIExhbWJkYSBMYXllciBmb3IgY29tbW9uIGNvZGVcbiAgICBjb25zdCBjb21tb25MYXllciA9IG5ldyBsYW1iZGEuTGF5ZXJWZXJzaW9uKHRoaXMsICdDb21tb25MYXllcicsIHtcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vYmFja2VuZC9sYXllcnMvY29tbW9uJyksXG4gICAgICBjb21wYXRpYmxlUnVudGltZXM6IFtsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWF0sXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvbW1vbiB1dGlsaXRpZXMgYW5kIER5bmFtb0RCIGNsaWVudCcsXG4gICAgfSk7XG5cbiAgICAvLyBDb2duaXRvIEF1dGhvcml6ZXJcbiAgICBjb25zdCBhdXRob3JpemVyID0gbmV3IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIodGhpcywgJ0F1dGhvcml6ZXInLCB7XG4gICAgICBjb2duaXRvVXNlclBvb2xzOiBbcHJvcHMudXNlclBvb2xdLFxuICAgIH0pO1xuXG4gICAgLy8gVXNlciBtYW5hZ2VtZW50IExhbWJkYSBmdW5jdGlvbnNcbiAgICBjb25zdCBjcmVhdGVVc2VyRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdDcmVhdGVVc2VyRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdjcmVhdGUuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VzZXJzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEJVQ0tFVF9OQU1FOiBwcm9wcy5idWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgICBsYXllcnM6IFtjb21tb25MYXllcl0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRVc2VyRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdHZXRVc2VyRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdnZXQuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VzZXJzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEJVQ0tFVF9OQU1FOiBwcm9wcy5idWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgICBsYXllcnM6IFtjb21tb25MYXllcl0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCB1cGRhdGVVc2VyRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdVcGRhdGVVc2VyRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICd1cGRhdGUuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZnVuY3Rpb25zL3VzZXJzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEJVQ0tFVF9OQU1FOiBwcm9wcy5idWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgICBsYXllcnM6IFtjb21tb25MYXllcl0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9uc1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShjcmVhdGVVc2VyRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShnZXRVc2VyRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh1cGRhdGVVc2VyRnVuY3Rpb24pO1xuICAgIHByb3BzLmJ1Y2tldC5ncmFudFJlYWRXcml0ZShjcmVhdGVVc2VyRnVuY3Rpb24pO1xuICAgIHByb3BzLmJ1Y2tldC5ncmFudFJlYWRXcml0ZSh1cGRhdGVVc2VyRnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChjcmVhdGVVc2VyRnVuY3Rpb24sIGdldFVzZXJGdW5jdGlvbiwgdXBkYXRlVXNlckZ1bmN0aW9uKTtcblxuICAgIC8vIEFQSSBSb3V0ZXNcbiAgICBjb25zdCB1c2VycyA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3VzZXJzJyk7XG5cbiAgICAvLyBQT1NUIC91c2VycyAtIENyZWF0ZSB1c2VyIHByb2ZpbGVcbiAgICB1c2Vycy5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihjcmVhdGVVc2VyRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdXNlck1lID0gdXNlcnMuYWRkUmVzb3VyY2UoJ21lJyk7XG5cbiAgICAvLyBHRVQgL3VzZXJzL21lIC0gR2V0IGN1cnJlbnQgdXNlciBwcm9maWxlXG4gICAgdXNlck1lLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0VXNlckZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFBVVCAvdXNlcnMvbWUgLSBVcGRhdGUgY3VycmVudCB1c2VyIHByb2ZpbGVcbiAgICB1c2VyTWUuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih1cGRhdGVVc2VyRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gQWN0aXZpdHkgbWFuYWdlbWVudCBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgY3JlYXRlQWN0aXZpdHlGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0NyZWF0ZUFjdGl2aXR5RnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdjcmVhdGUuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBsYXllcnM6IFtjb21tb25MYXllcl0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0QWN0aXZpdGllc0Z1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnTGlzdEFjdGl2aXRpZXNGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2xpc3QuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZnVuY3Rpb25zL2FjdGl2aXRpZXMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBsYXllcnM6IFtjb21tb25MYXllcl0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRBY3Rpdml0eUZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnR2V0QWN0aXZpdHlGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2dldC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vYmFja2VuZC9mdW5jdGlvbnMvYWN0aXZpdGllcycpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGxheWVyczogW2NvbW1vbkxheWVyXSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGpvaW5BY3Rpdml0eUZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnSm9pbkFjdGl2aXR5RnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdqb2luLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9iYWNrZW5kL2Z1bmN0aW9ucy9hY3Rpdml0aWVzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgbGF5ZXJzOiBbY29tbW9uTGF5ZXJdLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnNcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3JlYXRlQWN0aXZpdHlGdW5jdGlvbik7XG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGxpc3RBY3Rpdml0aWVzRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShnZXRBY3Rpdml0eUZ1bmN0aW9uKTtcbiAgICBwcm9wcy50YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoam9pbkFjdGl2aXR5RnVuY3Rpb24pO1xuXG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChcbiAgICAgIGNyZWF0ZUFjdGl2aXR5RnVuY3Rpb24sXG4gICAgICBsaXN0QWN0aXZpdGllc0Z1bmN0aW9uLFxuICAgICAgZ2V0QWN0aXZpdHlGdW5jdGlvbixcbiAgICAgIGpvaW5BY3Rpdml0eUZ1bmN0aW9uXG4gICAgKTtcblxuICAgIC8vIEFjdGl2aXR5IEFQSSBSb3V0ZXNcbiAgICBjb25zdCBhY3Rpdml0aWVzID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnYWN0aXZpdGllcycpO1xuXG4gICAgLy8gUE9TVCAvYWN0aXZpdGllcyAtIENyZWF0ZSBhY3Rpdml0eVxuICAgIGFjdGl2aXRpZXMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oY3JlYXRlQWN0aXZpdHlGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBHRVQgL2FjdGl2aXRpZXMgLSBMaXN0IGFjdGl2aXRpZXNcbiAgICBhY3Rpdml0aWVzLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGlzdEFjdGl2aXRpZXNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBHRVQgL2FjdGl2aXRpZXMve2lkfSAtIEdldCBhY3Rpdml0eVxuICAgIGNvbnN0IGFjdGl2aXR5QnlJZCA9IGFjdGl2aXRpZXMuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBhY3Rpdml0eUJ5SWQuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRBY3Rpdml0eUZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIC8vIFBPU1QgL2FjdGl2aXRpZXMve2lkfS9qb2luIC0gSm9pbiBhY3Rpdml0eVxuICAgIGNvbnN0IGFjdGl2aXR5Sm9pbiA9IGFjdGl2aXR5QnlJZC5hZGRSZXNvdXJjZSgnam9pbicpO1xuICAgIGFjdGl2aXR5Sm9pbi5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihqb2luQWN0aXZpdHlGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBDaGF0IG1hbmFnZW1lbnQgTGFtYmRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IGNyZWF0ZUNoYXRSb29tRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdDcmVhdGVDaGF0Um9vbUZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnY3JlYXRlUm9vbS5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vYmFja2VuZC9mdW5jdGlvbnMvY2hhdCcpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGxheWVyczogW2NvbW1vbkxheWVyXSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdldENoYXRSb29tc0Z1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnR2V0Q2hhdFJvb21zRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdnZXRSb29tcy5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vYmFja2VuZC9mdW5jdGlvbnMvY2hhdCcpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGxheWVyczogW2NvbW1vbkxheWVyXSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zXG4gICAgcHJvcHMudGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNyZWF0ZUNoYXRSb29tRnVuY3Rpb24pO1xuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShnZXRDaGF0Um9vbXNGdW5jdGlvbik7XG5cbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKGNyZWF0ZUNoYXRSb29tRnVuY3Rpb24sIGdldENoYXRSb29tc0Z1bmN0aW9uKTtcblxuICAgIC8vIENoYXQgQVBJIFJvdXRlc1xuICAgIGNvbnN0IGNoYXQgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdjaGF0Jyk7XG4gICAgY29uc3QgY2hhdFJvb21zID0gY2hhdC5hZGRSZXNvdXJjZSgncm9vbXMnKTtcblxuICAgIC8vIFBPU1QgL2NoYXQvcm9vbXMgLSBDcmVhdGUgY2hhdCByb29tXG4gICAgY2hhdFJvb21zLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUNoYXRSb29tRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gR0VUIC9jaGF0L3Jvb21zIC0gR2V0IHVzZXIncyBjaGF0IHJvb21zXG4gICAgY2hhdFJvb21zLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0Q2hhdFJvb21zRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcGlFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFwaUVuZHBvaW50LFxuICAgICAgZXhwb3J0TmFtZTogYENvbm5lY3Q0MC1BcGlFbmRwb2ludC0ke3Byb3BzLmVudk5hbWV9YCxcbiAgICB9KTtcbiAgfVxufVxuIl19
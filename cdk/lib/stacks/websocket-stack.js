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
exports.WebSocketStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigatewayv2 = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const path = __importStar(require("path"));
class WebSocketStack extends cdk.Stack {
    webSocketApi;
    webSocketEndpoint;
    functions = [];
    constructor(scope, id, props) {
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
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            actions: ['execute-api:ManageConnections'],
            resources: [
                `arn:aws:execute-api:${this.region}:${this.account}:${this.webSocketApi.ref}/*`,
            ],
        }));
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
exports.WebSocketStack = WebSocketStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid2Vic29ja2V0LXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywyRUFBNkQ7QUFDN0QsK0RBQWlEO0FBR2pELHlEQUEyQztBQUUzQywyQ0FBNkI7QUFTN0IsTUFBYSxjQUFlLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDM0IsWUFBWSxDQUFzQjtJQUNsQyxpQkFBaUIsQ0FBUztJQUMxQixTQUFTLEdBQXNCLEVBQUUsQ0FBQztJQUVsRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTBCO1FBQ2xFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHdCQUF3QjtRQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ2hFLElBQUksRUFBRSx1QkFBdUIsS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUM1QyxZQUFZLEVBQUUsV0FBVztZQUN6Qix3QkFBd0IsRUFBRSxzQkFBc0I7U0FDakQsQ0FBQyxDQUFDO1FBRUgsa0VBQWtFO1FBQ2xFLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDM0QsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDO1lBQzNELGVBQWUsRUFBRTtnQkFDZixHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLDBDQUEwQyxDQUFDO2FBQ3ZGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsS0FBSyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUzQyxzRUFBc0U7UUFDdEUsVUFBVSxDQUFDLFdBQVcsQ0FD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O1lBQzVCLG9CQUFvQixFQUFFO2dCQUNwQixvQkFBb0IsRUFBRSxHQUFHO2dCQUN6QixtQkFBbUIsRUFBRSxJQUFJO2FBQzFCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLGdCQUFnQixJQUFJLENBQUMsTUFBTSxrQkFBa0IsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXBILFVBQVU7UUFDVixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzNDLEtBQUssRUFBRSxJQUFJLENBQUMsaUJBQWlCO1lBQzdCLFVBQVUsRUFBRSwrQkFBK0IsS0FBSyxDQUFDLE9BQU8sRUFBRTtTQUMzRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUEvS0Qsd0NBK0tDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXl2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheXYyJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGludGVyZmFjZSBXZWJTb2NrZXRTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBlbnZOYW1lOiBzdHJpbmc7XG4gIHVzZXJQb29sOiBjb2duaXRvLlVzZXJQb29sO1xuICB1c2VyUG9vbENsaWVudDogY29nbml0by5Vc2VyUG9vbENsaWVudDtcbiAgdGFibGU6IGR5bmFtb2RiLlRhYmxlO1xufVxuXG5leHBvcnQgY2xhc3MgV2ViU29ja2V0U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViU29ja2V0QXBpOiBhcGlnYXRld2F5djIuQ2ZuQXBpO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViU29ja2V0RW5kcG9pbnQ6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IGZ1bmN0aW9uczogbGFtYmRhLkZ1bmN0aW9uW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogV2ViU29ja2V0U3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gV2ViU29ja2V0IEFQSSBHYXRld2F5XG4gICAgdGhpcy53ZWJTb2NrZXRBcGkgPSBuZXcgYXBpZ2F0ZXdheXYyLkNmbkFwaSh0aGlzLCAnV2ViU29ja2V0QXBpJywge1xuICAgICAgbmFtZTogYENvbm5lY3Q0MC1XZWJTb2NrZXQtJHtwcm9wcy5lbnZOYW1lfWAsXG4gICAgICBwcm90b2NvbFR5cGU6ICdXRUJTT0NLRVQnLFxuICAgICAgcm91dGVTZWxlY3Rpb25FeHByZXNzaW9uOiAnJHJlcXVlc3QuYm9keS5hY3Rpb24nLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIGV4ZWN1dGlvbiByb2xlIHdpdGggRHluYW1vREIgYW5kIEFQSSBHYXRld2F5IHBlcm1pc3Npb25zXG4gICAgY29uc3QgbGFtYmRhUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnV2ViU29ja2V0TGFtYmRhUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsYW1iZGFSb2xlKTtcblxuICAgIC8vIEdyYW50IEFQSSBHYXRld2F5IG1hbmFnZW1lbnQgcGVybWlzc2lvbnMgZm9yIHBvc3RpbmcgdG8gY29ubmVjdGlvbnNcbiAgICBsYW1iZGFSb2xlLmFkZFRvUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbJ2V4ZWN1dGUtYXBpOk1hbmFnZUNvbm5lY3Rpb25zJ10sXG4gICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgIGBhcm46YXdzOmV4ZWN1dGUtYXBpOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fToke3RoaXMud2ViU29ja2V0QXBpLnJlZn0vKmAsXG4gICAgICAgIF0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBDb25uZWN0IEhhbmRsZXJcbiAgICBjb25zdCBjb25uZWN0RnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdDb25uZWN0RnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdjb25uZWN0LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy93ZWJzb2NrZXQnKSksXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgICBVU0VSX1BPT0xfSUQ6IHByb3BzLnVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICAgIENMSUVOVF9JRDogcHJvcHMudXNlclBvb2xDbGllbnQudXNlclBvb2xDbGllbnRJZCxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChjb25uZWN0RnVuY3Rpb24pO1xuXG4gICAgLy8gRGlzY29ubmVjdCBIYW5kbGVyXG4gICAgY29uc3QgZGlzY29ubmVjdEZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnRGlzY29ubmVjdEZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnZGlzY29ubmVjdC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvd2Vic29ja2V0JykpLFxuICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChkaXNjb25uZWN0RnVuY3Rpb24pO1xuXG4gICAgLy8gU2VuZE1lc3NhZ2UgSGFuZGxlclxuICAgIGNvbnN0IHNlbmRNZXNzYWdlRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdTZW5kTWVzc2FnZUZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnc2VuZE1lc3NhZ2UuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3dlYnNvY2tldCcpKSxcbiAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgIH0pO1xuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2goc2VuZE1lc3NhZ2VGdW5jdGlvbik7XG5cbiAgICAvLyBEZWZhdWx0IEhhbmRsZXJcbiAgICBjb25zdCBkZWZhdWx0RnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdEZWZhdWx0RnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdkZWZhdWx0LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy93ZWJzb2NrZXQnKSksXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KTtcbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKGRlZmF1bHRGdW5jdGlvbik7XG5cbiAgICAvLyBHcmFudCBMYW1iZGEgcGVybWlzc2lvbnMgdG8gYmUgaW52b2tlZCBieSBBUEkgR2F0ZXdheVxuICAgIGNvbm5lY3RGdW5jdGlvbi5ncmFudEludm9rZShuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2FwaWdhdGV3YXkuYW1hem9uYXdzLmNvbScpKTtcbiAgICBkaXNjb25uZWN0RnVuY3Rpb24uZ3JhbnRJbnZva2UobmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdhcGlnYXRld2F5LmFtYXpvbmF3cy5jb20nKSk7XG4gICAgc2VuZE1lc3NhZ2VGdW5jdGlvbi5ncmFudEludm9rZShuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2FwaWdhdGV3YXkuYW1hem9uYXdzLmNvbScpKTtcbiAgICBkZWZhdWx0RnVuY3Rpb24uZ3JhbnRJbnZva2UobmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdhcGlnYXRld2F5LmFtYXpvbmF3cy5jb20nKSk7XG5cbiAgICAvLyBDcmVhdGUgaW50ZWdyYXRpb25zXG4gICAgY29uc3QgY29ubmVjdEludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXl2Mi5DZm5JbnRlZ3JhdGlvbih0aGlzLCAnQ29ubmVjdEludGVncmF0aW9uJywge1xuICAgICAgYXBpSWQ6IHRoaXMud2ViU29ja2V0QXBpLnJlZixcbiAgICAgIGludGVncmF0aW9uVHlwZTogJ0FXU19QUk9YWScsXG4gICAgICBpbnRlZ3JhdGlvblVyaTogYGFybjphd3M6YXBpZ2F0ZXdheToke3RoaXMucmVnaW9ufTpsYW1iZGE6cGF0aC8yMDE1LTAzLTMxL2Z1bmN0aW9ucy8ke2Nvbm5lY3RGdW5jdGlvbi5mdW5jdGlvbkFybn0vaW52b2NhdGlvbnNgLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGlzY29ubmVjdEludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXl2Mi5DZm5JbnRlZ3JhdGlvbih0aGlzLCAnRGlzY29ubmVjdEludGVncmF0aW9uJywge1xuICAgICAgYXBpSWQ6IHRoaXMud2ViU29ja2V0QXBpLnJlZixcbiAgICAgIGludGVncmF0aW9uVHlwZTogJ0FXU19QUk9YWScsXG4gICAgICBpbnRlZ3JhdGlvblVyaTogYGFybjphd3M6YXBpZ2F0ZXdheToke3RoaXMucmVnaW9ufTpsYW1iZGE6cGF0aC8yMDE1LTAzLTMxL2Z1bmN0aW9ucy8ke2Rpc2Nvbm5lY3RGdW5jdGlvbi5mdW5jdGlvbkFybn0vaW52b2NhdGlvbnNgLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2VuZE1lc3NhZ2VJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5djIuQ2ZuSW50ZWdyYXRpb24odGhpcywgJ1NlbmRNZXNzYWdlSW50ZWdyYXRpb24nLCB7XG4gICAgICBhcGlJZDogdGhpcy53ZWJTb2NrZXRBcGkucmVmLFxuICAgICAgaW50ZWdyYXRpb25UeXBlOiAnQVdTX1BST1hZJyxcbiAgICAgIGludGVncmF0aW9uVXJpOiBgYXJuOmF3czphcGlnYXRld2F5OiR7dGhpcy5yZWdpb259OmxhbWJkYTpwYXRoLzIwMTUtMDMtMzEvZnVuY3Rpb25zLyR7c2VuZE1lc3NhZ2VGdW5jdGlvbi5mdW5jdGlvbkFybn0vaW52b2NhdGlvbnNgLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGVmYXVsdEludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXl2Mi5DZm5JbnRlZ3JhdGlvbih0aGlzLCAnRGVmYXVsdEludGVncmF0aW9uJywge1xuICAgICAgYXBpSWQ6IHRoaXMud2ViU29ja2V0QXBpLnJlZixcbiAgICAgIGludGVncmF0aW9uVHlwZTogJ0FXU19QUk9YWScsXG4gICAgICBpbnRlZ3JhdGlvblVyaTogYGFybjphd3M6YXBpZ2F0ZXdheToke3RoaXMucmVnaW9ufTpsYW1iZGE6cGF0aC8yMDE1LTAzLTMxL2Z1bmN0aW9ucy8ke2RlZmF1bHRGdW5jdGlvbi5mdW5jdGlvbkFybn0vaW52b2NhdGlvbnNgLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHJvdXRlc1xuICAgIGNvbnN0IGNvbm5lY3RSb3V0ZSA9IG5ldyBhcGlnYXRld2F5djIuQ2ZuUm91dGUodGhpcywgJ0Nvbm5lY3RSb3V0ZScsIHtcbiAgICAgIGFwaUlkOiB0aGlzLndlYlNvY2tldEFwaS5yZWYsXG4gICAgICByb3V0ZUtleTogJyRjb25uZWN0JyxcbiAgICAgIHRhcmdldDogYGludGVncmF0aW9ucy8ke2Nvbm5lY3RJbnRlZ3JhdGlvbi5yZWZ9YCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRpc2Nvbm5lY3RSb3V0ZSA9IG5ldyBhcGlnYXRld2F5djIuQ2ZuUm91dGUodGhpcywgJ0Rpc2Nvbm5lY3RSb3V0ZScsIHtcbiAgICAgIGFwaUlkOiB0aGlzLndlYlNvY2tldEFwaS5yZWYsXG4gICAgICByb3V0ZUtleTogJyRkaXNjb25uZWN0JyxcbiAgICAgIHRhcmdldDogYGludGVncmF0aW9ucy8ke2Rpc2Nvbm5lY3RJbnRlZ3JhdGlvbi5yZWZ9YCxcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlbmRNZXNzYWdlUm91dGUgPSBuZXcgYXBpZ2F0ZXdheXYyLkNmblJvdXRlKHRoaXMsICdTZW5kTWVzc2FnZVJvdXRlJywge1xuICAgICAgYXBpSWQ6IHRoaXMud2ViU29ja2V0QXBpLnJlZixcbiAgICAgIHJvdXRlS2V5OiAnc2VuZE1lc3NhZ2UnLFxuICAgICAgdGFyZ2V0OiBgaW50ZWdyYXRpb25zLyR7c2VuZE1lc3NhZ2VJbnRlZ3JhdGlvbi5yZWZ9YCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlZmF1bHRSb3V0ZSA9IG5ldyBhcGlnYXRld2F5djIuQ2ZuUm91dGUodGhpcywgJ0RlZmF1bHRSb3V0ZScsIHtcbiAgICAgIGFwaUlkOiB0aGlzLndlYlNvY2tldEFwaS5yZWYsXG4gICAgICByb3V0ZUtleTogJyRkZWZhdWx0JyxcbiAgICAgIHRhcmdldDogYGludGVncmF0aW9ucy8ke2RlZmF1bHRJbnRlZ3JhdGlvbi5yZWZ9YCxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBkZXBsb3ltZW50XG4gICAgY29uc3QgZGVwbG95bWVudCA9IG5ldyBhcGlnYXRld2F5djIuQ2ZuRGVwbG95bWVudCh0aGlzLCAnV2ViU29ja2V0RGVwbG95bWVudCcsIHtcbiAgICAgIGFwaUlkOiB0aGlzLndlYlNvY2tldEFwaS5yZWYsXG4gICAgfSk7XG5cbiAgICAvLyBFbnN1cmUgcm91dGVzIGFyZSBjcmVhdGVkIGJlZm9yZSBkZXBsb3ltZW50XG4gICAgZGVwbG95bWVudC5hZGREZXBlbmRlbmN5KGNvbm5lY3RSb3V0ZSk7XG4gICAgZGVwbG95bWVudC5hZGREZXBlbmRlbmN5KGRpc2Nvbm5lY3RSb3V0ZSk7XG4gICAgZGVwbG95bWVudC5hZGREZXBlbmRlbmN5KHNlbmRNZXNzYWdlUm91dGUpO1xuICAgIGRlcGxveW1lbnQuYWRkRGVwZW5kZW5jeShkZWZhdWx0Um91dGUpO1xuXG4gICAgLy8gQ3JlYXRlIHN0YWdlXG4gICAgY29uc3Qgc3RhZ2UgPSBuZXcgYXBpZ2F0ZXdheXYyLkNmblN0YWdlKHRoaXMsICdXZWJTb2NrZXRTdGFnZScsIHtcbiAgICAgIGFwaUlkOiB0aGlzLndlYlNvY2tldEFwaS5yZWYsXG4gICAgICBzdGFnZU5hbWU6IHByb3BzLmVudk5hbWUsXG4gICAgICBkZXBsb3ltZW50SWQ6IGRlcGxveW1lbnQucmVmLFxuICAgICAgZGVmYXVsdFJvdXRlU2V0dGluZ3M6IHtcbiAgICAgICAgdGhyb3R0bGluZ0J1cnN0TGltaXQ6IDUwMCxcbiAgICAgICAgdGhyb3R0bGluZ1JhdGVMaW1pdDogMTAwMCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLndlYlNvY2tldEVuZHBvaW50ID0gYHdzczovLyR7dGhpcy53ZWJTb2NrZXRBcGkucmVmfS5leGVjdXRlLWFwaS4ke3RoaXMucmVnaW9ufS5hbWF6b25hd3MuY29tLyR7cHJvcHMuZW52TmFtZX1gO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdXZWJTb2NrZXRFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLndlYlNvY2tldEVuZHBvaW50LFxuICAgICAgZXhwb3J0TmFtZTogYENvbm5lY3Q0MC1XZWJTb2NrZXRFbmRwb2ludC0ke3Byb3BzLmVudk5hbWV9YCxcbiAgICB9KTtcbiAgfVxufVxuIl19
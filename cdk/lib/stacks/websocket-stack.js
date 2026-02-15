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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid2Vic29ja2V0LXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywyRUFBNkQ7QUFDN0QsK0RBQWlEO0FBR2pELHlEQUEyQztBQUUzQywyQ0FBNkI7QUFRN0IsTUFBYSxjQUFlLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDM0IsWUFBWSxDQUFzQjtJQUNsQyxpQkFBaUIsQ0FBUztJQUMxQixTQUFTLEdBQXNCLEVBQUUsQ0FBQztJQUVsRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTBCO1FBQ2xFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHdCQUF3QjtRQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ2hFLElBQUksRUFBRSx1QkFBdUIsS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUM1QyxZQUFZLEVBQUUsV0FBVztZQUN6Qix3QkFBd0IsRUFBRSxzQkFBc0I7U0FDakQsQ0FBQyxDQUFDO1FBRUgsa0VBQWtFO1FBQ2xFLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDM0QsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDO1lBQzNELGVBQWUsRUFBRTtnQkFDZixHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLDBDQUEwQyxDQUFDO2FBQ3ZGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsS0FBSyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUzQyxzRUFBc0U7UUFDdEUsVUFBVSxDQUFDLFdBQVcsQ0FD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QztRQUVILElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxnQkFBZ0IsSUFBSSxDQUFDLE1BQU0sa0JBQWtCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVwSCxVQUFVO1FBQ1YsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtZQUM3QixVQUFVLEVBQUUsK0JBQStCLEtBQUssQ0FBQyxPQUFPLEVBQUU7U0FDM0QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBN0tELHdDQTZLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5djIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXl2Mic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2ViU29ja2V0U3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgZW52TmFtZTogc3RyaW5nO1xuICB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcbiAgdGFibGU6IGR5bmFtb2RiLlRhYmxlO1xufVxuXG5leHBvcnQgY2xhc3MgV2ViU29ja2V0U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViU29ja2V0QXBpOiBhcGlnYXRld2F5djIuQ2ZuQXBpO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViU29ja2V0RW5kcG9pbnQ6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IGZ1bmN0aW9uczogbGFtYmRhLkZ1bmN0aW9uW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogV2ViU29ja2V0U3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gV2ViU29ja2V0IEFQSSBHYXRld2F5XG4gICAgdGhpcy53ZWJTb2NrZXRBcGkgPSBuZXcgYXBpZ2F0ZXdheXYyLkNmbkFwaSh0aGlzLCAnV2ViU29ja2V0QXBpJywge1xuICAgICAgbmFtZTogYENvbm5lY3Q0MC1XZWJTb2NrZXQtJHtwcm9wcy5lbnZOYW1lfWAsXG4gICAgICBwcm90b2NvbFR5cGU6ICdXRUJTT0NLRVQnLFxuICAgICAgcm91dGVTZWxlY3Rpb25FeHByZXNzaW9uOiAnJHJlcXVlc3QuYm9keS5hY3Rpb24nLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIGV4ZWN1dGlvbiByb2xlIHdpdGggRHluYW1vREIgYW5kIEFQSSBHYXRld2F5IHBlcm1pc3Npb25zXG4gICAgY29uc3QgbGFtYmRhUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnV2ViU29ja2V0TGFtYmRhUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIHByb3BzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsYW1iZGFSb2xlKTtcblxuICAgIC8vIEdyYW50IEFQSSBHYXRld2F5IG1hbmFnZW1lbnQgcGVybWlzc2lvbnMgZm9yIHBvc3RpbmcgdG8gY29ubmVjdGlvbnNcbiAgICBsYW1iZGFSb2xlLmFkZFRvUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbJ2V4ZWN1dGUtYXBpOk1hbmFnZUNvbm5lY3Rpb25zJ10sXG4gICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgIGBhcm46YXdzOmV4ZWN1dGUtYXBpOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fToke3RoaXMud2ViU29ja2V0QXBpLnJlZn0vKmAsXG4gICAgICAgIF0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBDb25uZWN0IEhhbmRsZXJcbiAgICBjb25zdCBjb25uZWN0RnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdDb25uZWN0RnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdjb25uZWN0LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy93ZWJzb2NrZXQnKSksXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KTtcbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKGNvbm5lY3RGdW5jdGlvbik7XG5cbiAgICAvLyBEaXNjb25uZWN0IEhhbmRsZXJcbiAgICBjb25zdCBkaXNjb25uZWN0RnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdEaXNjb25uZWN0RnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdkaXNjb25uZWN0LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9iYWNrZW5kL2Z1bmN0aW9ucy93ZWJzb2NrZXQnKSksXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KTtcbiAgICB0aGlzLmZ1bmN0aW9ucy5wdXNoKGRpc2Nvbm5lY3RGdW5jdGlvbik7XG5cbiAgICAvLyBTZW5kTWVzc2FnZSBIYW5kbGVyXG4gICAgY29uc3Qgc2VuZE1lc3NhZ2VGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1NlbmRNZXNzYWdlRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdzZW5kTWVzc2FnZS5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYmFja2VuZC9mdW5jdGlvbnMvd2Vic29ja2V0JykpLFxuICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHByb3BzLnRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG4gICAgdGhpcy5mdW5jdGlvbnMucHVzaChzZW5kTWVzc2FnZUZ1bmN0aW9uKTtcblxuICAgIC8vIERlZmF1bHQgSGFuZGxlclxuICAgIGNvbnN0IGRlZmF1bHRGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0RlZmF1bHRGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2RlZmF1bHQuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2JhY2tlbmQvZnVuY3Rpb25zL3dlYnNvY2tldCcpKSxcbiAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiBwcm9wcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgIH0pO1xuICAgIHRoaXMuZnVuY3Rpb25zLnB1c2goZGVmYXVsdEZ1bmN0aW9uKTtcblxuICAgIC8vIEdyYW50IExhbWJkYSBwZXJtaXNzaW9ucyB0byBiZSBpbnZva2VkIGJ5IEFQSSBHYXRld2F5XG4gICAgY29ubmVjdEZ1bmN0aW9uLmdyYW50SW52b2tlKG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnYXBpZ2F0ZXdheS5hbWF6b25hd3MuY29tJykpO1xuICAgIGRpc2Nvbm5lY3RGdW5jdGlvbi5ncmFudEludm9rZShuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2FwaWdhdGV3YXkuYW1hem9uYXdzLmNvbScpKTtcbiAgICBzZW5kTWVzc2FnZUZ1bmN0aW9uLmdyYW50SW52b2tlKG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnYXBpZ2F0ZXdheS5hbWF6b25hd3MuY29tJykpO1xuICAgIGRlZmF1bHRGdW5jdGlvbi5ncmFudEludm9rZShuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2FwaWdhdGV3YXkuYW1hem9uYXdzLmNvbScpKTtcblxuICAgIC8vIENyZWF0ZSBpbnRlZ3JhdGlvbnNcbiAgICBjb25zdCBjb25uZWN0SW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheXYyLkNmbkludGVncmF0aW9uKHRoaXMsICdDb25uZWN0SW50ZWdyYXRpb24nLCB7XG4gICAgICBhcGlJZDogdGhpcy53ZWJTb2NrZXRBcGkucmVmLFxuICAgICAgaW50ZWdyYXRpb25UeXBlOiAnQVdTX1BST1hZJyxcbiAgICAgIGludGVncmF0aW9uVXJpOiBgYXJuOmF3czphcGlnYXRld2F5OiR7dGhpcy5yZWdpb259OmxhbWJkYTpwYXRoLzIwMTUtMDMtMzEvZnVuY3Rpb25zLyR7Y29ubmVjdEZ1bmN0aW9uLmZ1bmN0aW9uQXJufS9pbnZvY2F0aW9uc2AsXG4gICAgfSk7XG5cbiAgICBjb25zdCBkaXNjb25uZWN0SW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheXYyLkNmbkludGVncmF0aW9uKHRoaXMsICdEaXNjb25uZWN0SW50ZWdyYXRpb24nLCB7XG4gICAgICBhcGlJZDogdGhpcy53ZWJTb2NrZXRBcGkucmVmLFxuICAgICAgaW50ZWdyYXRpb25UeXBlOiAnQVdTX1BST1hZJyxcbiAgICAgIGludGVncmF0aW9uVXJpOiBgYXJuOmF3czphcGlnYXRld2F5OiR7dGhpcy5yZWdpb259OmxhbWJkYTpwYXRoLzIwMTUtMDMtMzEvZnVuY3Rpb25zLyR7ZGlzY29ubmVjdEZ1bmN0aW9uLmZ1bmN0aW9uQXJufS9pbnZvY2F0aW9uc2AsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzZW5kTWVzc2FnZUludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXl2Mi5DZm5JbnRlZ3JhdGlvbih0aGlzLCAnU2VuZE1lc3NhZ2VJbnRlZ3JhdGlvbicsIHtcbiAgICAgIGFwaUlkOiB0aGlzLndlYlNvY2tldEFwaS5yZWYsXG4gICAgICBpbnRlZ3JhdGlvblR5cGU6ICdBV1NfUFJPWFknLFxuICAgICAgaW50ZWdyYXRpb25Vcmk6IGBhcm46YXdzOmFwaWdhdGV3YXk6JHt0aGlzLnJlZ2lvbn06bGFtYmRhOnBhdGgvMjAxNS0wMy0zMS9mdW5jdGlvbnMvJHtzZW5kTWVzc2FnZUZ1bmN0aW9uLmZ1bmN0aW9uQXJufS9pbnZvY2F0aW9uc2AsXG4gICAgfSk7XG5cbiAgICBjb25zdCBkZWZhdWx0SW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheXYyLkNmbkludGVncmF0aW9uKHRoaXMsICdEZWZhdWx0SW50ZWdyYXRpb24nLCB7XG4gICAgICBhcGlJZDogdGhpcy53ZWJTb2NrZXRBcGkucmVmLFxuICAgICAgaW50ZWdyYXRpb25UeXBlOiAnQVdTX1BST1hZJyxcbiAgICAgIGludGVncmF0aW9uVXJpOiBgYXJuOmF3czphcGlnYXRld2F5OiR7dGhpcy5yZWdpb259OmxhbWJkYTpwYXRoLzIwMTUtMDMtMzEvZnVuY3Rpb25zLyR7ZGVmYXVsdEZ1bmN0aW9uLmZ1bmN0aW9uQXJufS9pbnZvY2F0aW9uc2AsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgcm91dGVzXG4gICAgY29uc3QgY29ubmVjdFJvdXRlID0gbmV3IGFwaWdhdGV3YXl2Mi5DZm5Sb3V0ZSh0aGlzLCAnQ29ubmVjdFJvdXRlJywge1xuICAgICAgYXBpSWQ6IHRoaXMud2ViU29ja2V0QXBpLnJlZixcbiAgICAgIHJvdXRlS2V5OiAnJGNvbm5lY3QnLFxuICAgICAgdGFyZ2V0OiBgaW50ZWdyYXRpb25zLyR7Y29ubmVjdEludGVncmF0aW9uLnJlZn1gLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGlzY29ubmVjdFJvdXRlID0gbmV3IGFwaWdhdGV3YXl2Mi5DZm5Sb3V0ZSh0aGlzLCAnRGlzY29ubmVjdFJvdXRlJywge1xuICAgICAgYXBpSWQ6IHRoaXMud2ViU29ja2V0QXBpLnJlZixcbiAgICAgIHJvdXRlS2V5OiAnJGRpc2Nvbm5lY3QnLFxuICAgICAgdGFyZ2V0OiBgaW50ZWdyYXRpb25zLyR7ZGlzY29ubmVjdEludGVncmF0aW9uLnJlZn1gLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2VuZE1lc3NhZ2VSb3V0ZSA9IG5ldyBhcGlnYXRld2F5djIuQ2ZuUm91dGUodGhpcywgJ1NlbmRNZXNzYWdlUm91dGUnLCB7XG4gICAgICBhcGlJZDogdGhpcy53ZWJTb2NrZXRBcGkucmVmLFxuICAgICAgcm91dGVLZXk6ICdzZW5kTWVzc2FnZScsXG4gICAgICB0YXJnZXQ6IGBpbnRlZ3JhdGlvbnMvJHtzZW5kTWVzc2FnZUludGVncmF0aW9uLnJlZn1gLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGVmYXVsdFJvdXRlID0gbmV3IGFwaWdhdGV3YXl2Mi5DZm5Sb3V0ZSh0aGlzLCAnRGVmYXVsdFJvdXRlJywge1xuICAgICAgYXBpSWQ6IHRoaXMud2ViU29ja2V0QXBpLnJlZixcbiAgICAgIHJvdXRlS2V5OiAnJGRlZmF1bHQnLFxuICAgICAgdGFyZ2V0OiBgaW50ZWdyYXRpb25zLyR7ZGVmYXVsdEludGVncmF0aW9uLnJlZn1gLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGRlcGxveW1lbnRcbiAgICBjb25zdCBkZXBsb3ltZW50ID0gbmV3IGFwaWdhdGV3YXl2Mi5DZm5EZXBsb3ltZW50KHRoaXMsICdXZWJTb2NrZXREZXBsb3ltZW50Jywge1xuICAgICAgYXBpSWQ6IHRoaXMud2ViU29ja2V0QXBpLnJlZixcbiAgICB9KTtcblxuICAgIC8vIEVuc3VyZSByb3V0ZXMgYXJlIGNyZWF0ZWQgYmVmb3JlIGRlcGxveW1lbnRcbiAgICBkZXBsb3ltZW50LmFkZERlcGVuZGVuY3koY29ubmVjdFJvdXRlKTtcbiAgICBkZXBsb3ltZW50LmFkZERlcGVuZGVuY3koZGlzY29ubmVjdFJvdXRlKTtcbiAgICBkZXBsb3ltZW50LmFkZERlcGVuZGVuY3koc2VuZE1lc3NhZ2VSb3V0ZSk7XG4gICAgZGVwbG95bWVudC5hZGREZXBlbmRlbmN5KGRlZmF1bHRSb3V0ZSk7XG5cbiAgICAvLyBDcmVhdGUgc3RhZ2VcbiAgICBjb25zdCBzdGFnZSA9IG5ldyBhcGlnYXRld2F5djIuQ2ZuU3RhZ2UodGhpcywgJ1dlYlNvY2tldFN0YWdlJywge1xuICAgICAgYXBpSWQ6IHRoaXMud2ViU29ja2V0QXBpLnJlZixcbiAgICAgIHN0YWdlTmFtZTogcHJvcHMuZW52TmFtZSxcbiAgICAgIGRlcGxveW1lbnRJZDogZGVwbG95bWVudC5yZWYsXG4gICAgICBkZWZhdWx0Um91dGVTZXR0aW5nczoge1xuICAgICAgICB0aHJvdHRsaW5nQnVyc3RMaW1pdDogNTAwLFxuICAgICAgICB0aHJvdHRsaW5nUmF0ZUxpbWl0OiAxMDAwLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMud2ViU29ja2V0RW5kcG9pbnQgPSBgd3NzOi8vJHt0aGlzLndlYlNvY2tldEFwaS5yZWZ9LmV4ZWN1dGUtYXBpLiR7dGhpcy5yZWdpb259LmFtYXpvbmF3cy5jb20vJHtwcm9wcy5lbnZOYW1lfWA7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dlYlNvY2tldEVuZHBvaW50Jywge1xuICAgICAgdmFsdWU6IHRoaXMud2ViU29ja2V0RW5kcG9pbnQsXG4gICAgICBleHBvcnROYW1lOiBgQ29ubmVjdDQwLVdlYlNvY2tldEVuZHBvaW50LSR7cHJvcHMuZW52TmFtZX1gLFxuICAgIH0pO1xuICB9XG59XG4iXX0=
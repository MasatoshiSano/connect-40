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
exports.PaymentStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
class PaymentStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Lambda execution role
        const lambdaRole = new iam.Role(this, 'PaymentLambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
        });
        // Grant DynamoDB access
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:Query',
            ],
            resources: [props.tableArn, `${props.tableArn}/index/*`],
        }));
        // Common environment variables
        const environment = {
            TABLE_NAME: props.tableName,
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
            STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
            FRONTEND_URL: props.frontendUrl,
        };
        // Create Checkout Session Lambda
        const createCheckoutSessionFunction = new lambda.Function(this, 'CreateCheckoutSessionFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'createCheckoutSession.handler',
            code: lambda.Code.fromAsset('../backend/functions/payment'),
            role: lambdaRole,
            environment,
            timeout: cdk.Duration.seconds(30),
        });
        // Stripe Webhook Lambda
        const webhookFunction = new lambda.Function(this, 'WebhookFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'webhook.handler',
            code: lambda.Code.fromAsset('../backend/functions/payment'),
            role: lambdaRole,
            environment,
            timeout: cdk.Duration.seconds(30),
        });
        // Create Portal Session Lambda
        const createPortalSessionFunction = new lambda.Function(this, 'CreatePortalSessionFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'createPortalSession.handler',
            code: lambda.Code.fromAsset('../backend/functions/payment'),
            role: lambdaRole,
            environment,
            timeout: cdk.Duration.seconds(30),
        });
        // Add routes to REST API
        const paymentResource = props.restApi.root.addResource('payment');
        // POST /payment/checkout
        const checkoutResource = paymentResource.addResource('checkout');
        checkoutResource.addMethod('POST', new apigateway.LambdaIntegration(createCheckoutSessionFunction), {
            authorizer: props.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // POST /payment/webhook (no auth required - Stripe will send signature)
        const webhookResource = paymentResource.addResource('webhook');
        webhookResource.addMethod('POST', new apigateway.LambdaIntegration(webhookFunction));
        // POST /payment/portal
        const portalResource = paymentResource.addResource('portal');
        portalResource.addMethod('POST', new apigateway.LambdaIntegration(createPortalSessionFunction), {
            authorizer: props.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // Outputs
        new cdk.CfnOutput(this, 'WebhookUrl', {
            value: `${props.restApi.url}payment/webhook`,
            description: 'Stripe Webhook URL (configure in Stripe Dashboard)',
        });
    }
}
exports.PaymentStack = PaymentStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF5bWVudC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBheW1lbnQtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLCtEQUFpRDtBQUNqRCx1RUFBeUQ7QUFDekQseURBQTJDO0FBYTNDLE1BQWEsWUFBYSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3pDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBd0I7UUFDaEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsd0JBQXdCO1FBQ3hCLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDekQsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDO1lBQzNELGVBQWUsRUFBRTtnQkFDZixHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLDBDQUEwQyxDQUFDO2FBQ3ZGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0JBQXdCO1FBQ3hCLFVBQVUsQ0FBQyxXQUFXLENBQ3BCLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUN0QixPQUFPLEVBQUU7Z0JBQ1Asa0JBQWtCO2dCQUNsQixrQkFBa0I7Z0JBQ2xCLHFCQUFxQjtnQkFDckIsZ0JBQWdCO2FBQ2pCO1lBQ0QsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLEtBQUssQ0FBQyxRQUFRLFVBQVUsQ0FBQztTQUN6RCxDQUFDLENBQ0gsQ0FBQztRQUVGLCtCQUErQjtRQUMvQixNQUFNLFdBQVcsR0FBRztZQUNsQixVQUFVLEVBQUUsS0FBSyxDQUFDLFNBQVM7WUFDM0IsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsSUFBSSxFQUFFO1lBQ3RE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WUFDcEMsS0FBSyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLGlCQUFpQjtZQUM1QyxXQUFXLEVBQUUsb0RBQW9EO1NBQ2xFLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTFHRCxvQ0EwR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuaW50ZXJmYWNlIFBheW1lbnRTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICB1c2VyUG9vbElkOiBzdHJpbmc7XG4gIHVzZXJQb29sQXJuOiBzdHJpbmc7XG4gIHJlc3RBcGk6IGFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgYXV0aG9yaXplcjogYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcjtcbiAgdGFibGVOYW1lOiBzdHJpbmc7XG4gIHRhYmxlQXJuOiBzdHJpbmc7XG4gIGZyb250ZW5kVXJsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBQYXltZW50U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogUGF5bWVudFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIExhbWJkYSBleGVjdXRpb24gcm9sZVxuICAgIGNvbnN0IGxhbWJkYVJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ1BheW1lbnRMYW1iZGFSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdzZXJ2aWNlLXJvbGUvQVdTTGFtYmRhQmFzaWNFeGVjdXRpb25Sb2xlJyksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgRHluYW1vREIgYWNjZXNzXG4gICAgbGFtYmRhUm9sZS5hZGRUb1BvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICdkeW5hbW9kYjpHZXRJdGVtJyxcbiAgICAgICAgICAnZHluYW1vZGI6UHV0SXRlbScsXG4gICAgICAgICAgJ2R5bmFtb2RiOlVwZGF0ZUl0ZW0nLFxuICAgICAgICAgICdkeW5hbW9kYjpRdWVyeScsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogW3Byb3BzLnRhYmxlQXJuLCBgJHtwcm9wcy50YWJsZUFybn0vaW5kZXgvKmBdLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQ29tbW9uIGVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgIGNvbnN0IGVudmlyb25tZW50ID0ge1xuICAgICAgVEFCTEVfTkFNRTogcHJvcHMudGFibGVOYW1lLFxuICAgICAgU1RSSVBFX1NFQ1JFVF9LRVk6IHByb2Nlc3MuZW52LlNUUklQRV9TRUNSRVRfS0VZIHx8ICcnLFxuICAgICAgU1RSSVBFX1dFQkhPT0tfU0VDUkVUOiBwcm9jZXNzLmVudi5TVFJJUEVfV0VCSE9PS19TRUNSRVQgfHwgJycsXG4gICAgICBGUk9OVEVORF9VUkw6IHByb3BzLmZyb250ZW5kVXJsLFxuICAgIH07XG5cbiAgICAvLyBDcmVhdGUgQ2hlY2tvdXQgU2Vzc2lvbiBMYW1iZGFcbiAgICBjb25zdCBjcmVhdGVDaGVja291dFNlc3Npb25GdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24oXG4gICAgICB0aGlzLFxuICAgICAgJ0NyZWF0ZUNoZWNrb3V0U2Vzc2lvbkZ1bmN0aW9uJyxcbiAgICAgIHtcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICAgIGhhbmRsZXI6ICdjcmVhdGVDaGVja291dFNlc3Npb24uaGFuZGxlcicsXG4gICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vYmFja2VuZC9mdW5jdGlvbnMvcGF5bWVudCcpLFxuICAgICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgICBlbnZpcm9ubWVudCxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBTdHJpcGUgV2ViaG9vayBMYW1iZGFcbiAgICBjb25zdCB3ZWJob29rRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdXZWJob29rRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICd3ZWJob29rLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9iYWNrZW5kL2Z1bmN0aW9ucy9wYXltZW50JyksXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgUG9ydGFsIFNlc3Npb24gTGFtYmRhXG4gICAgY29uc3QgY3JlYXRlUG9ydGFsU2Vzc2lvbkZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICAnQ3JlYXRlUG9ydGFsU2Vzc2lvbkZ1bmN0aW9uJyxcbiAgICAgIHtcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICAgIGhhbmRsZXI6ICdjcmVhdGVQb3J0YWxTZXNzaW9uLmhhbmRsZXInLFxuICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZnVuY3Rpb25zL3BheW1lbnQnKSxcbiAgICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICAgICAgZW52aXJvbm1lbnQsXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gQWRkIHJvdXRlcyB0byBSRVNUIEFQSVxuICAgIGNvbnN0IHBheW1lbnRSZXNvdXJjZSA9IHByb3BzLnJlc3RBcGkucm9vdC5hZGRSZXNvdXJjZSgncGF5bWVudCcpO1xuXG4gICAgLy8gUE9TVCAvcGF5bWVudC9jaGVja291dFxuICAgIGNvbnN0IGNoZWNrb3V0UmVzb3VyY2UgPSBwYXltZW50UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2NoZWNrb3V0Jyk7XG4gICAgY2hlY2tvdXRSZXNvdXJjZS5hZGRNZXRob2QoXG4gICAgICAnUE9TVCcsXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihjcmVhdGVDaGVja291dFNlc3Npb25GdW5jdGlvbiksXG4gICAgICB7XG4gICAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIFBPU1QgL3BheW1lbnQvd2ViaG9vayAobm8gYXV0aCByZXF1aXJlZCAtIFN0cmlwZSB3aWxsIHNlbmQgc2lnbmF0dXJlKVxuICAgIGNvbnN0IHdlYmhvb2tSZXNvdXJjZSA9IHBheW1lbnRSZXNvdXJjZS5hZGRSZXNvdXJjZSgnd2ViaG9vaycpO1xuICAgIHdlYmhvb2tSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih3ZWJob29rRnVuY3Rpb24pKTtcblxuICAgIC8vIFBPU1QgL3BheW1lbnQvcG9ydGFsXG4gICAgY29uc3QgcG9ydGFsUmVzb3VyY2UgPSBwYXltZW50UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3BvcnRhbCcpO1xuICAgIHBvcnRhbFJlc291cmNlLmFkZE1ldGhvZChcbiAgICAgICdQT1NUJyxcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZVBvcnRhbFNlc3Npb25GdW5jdGlvbiksXG4gICAgICB7XG4gICAgICAgIGF1dGhvcml6ZXI6IHByb3BzLmF1dGhvcml6ZXIsXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV2ViaG9va1VybCcsIHtcbiAgICAgIHZhbHVlOiBgJHtwcm9wcy5yZXN0QXBpLnVybH1wYXltZW50L3dlYmhvb2tgLFxuICAgICAgZGVzY3JpcHRpb246ICdTdHJpcGUgV2ViaG9vayBVUkwgKGNvbmZpZ3VyZSBpbiBTdHJpcGUgRGFzaGJvYXJkKScsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
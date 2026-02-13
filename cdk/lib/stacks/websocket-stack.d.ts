import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export interface WebSocketStackProps extends cdk.StackProps {
    envName: string;
    userPool: cognito.UserPool;
    table: dynamodb.Table;
}
export declare class WebSocketStack extends cdk.Stack {
    readonly webSocketApi: apigatewayv2.CfnApi;
    readonly webSocketEndpoint: string;
    readonly functions: lambda.Function[];
    constructor(scope: Construct, id: string, props: WebSocketStackProps);
}

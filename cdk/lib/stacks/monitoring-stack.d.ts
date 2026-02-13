import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
export interface MonitoringStackProps extends cdk.StackProps {
    envName: string;
    apiGateway?: apigateway.RestApi;
    lambdaFunctions?: lambda.Function[];
}
export declare class MonitoringStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: MonitoringStackProps);
}

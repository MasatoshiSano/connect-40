import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
export interface ApiStackProps extends cdk.StackProps {
    envName: string;
    userPool: cognito.UserPool;
    table: dynamodb.Table;
    bucket: s3.Bucket;
}
export declare class ApiStack extends cdk.Stack {
    readonly api: apigateway.RestApi;
    readonly apiEndpoint: string;
    readonly functions: lambda.Function[];
    constructor(scope: Construct, id: string, props: ApiStackProps);
}

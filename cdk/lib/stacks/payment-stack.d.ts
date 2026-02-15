import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
interface PaymentStackProps extends cdk.StackProps {
    userPoolId: string;
    userPoolArn: string;
    restApi: apigateway.RestApi;
    authorizer: apigateway.CognitoUserPoolsAuthorizer;
    tableName: string;
    tableArn: string;
    frontendUrl: string;
}
export declare class PaymentStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: PaymentStackProps);
}
export {};

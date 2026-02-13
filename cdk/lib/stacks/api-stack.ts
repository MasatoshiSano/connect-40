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

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly apiEndpoint: string;
  public readonly functions: lambda.Function[] = [];

  constructor(scope: Construct, id: string, props: ApiStackProps) {
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

    // Placeholder Lambda functions (実装はPhase 2以降)
    // UserFunction
    const userFunction = new lambda.Function(this, 'UserFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'UserFunction placeholder' })
          };
        };
      `),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucket.bucketName,
      },
      layers: [commonLayer],
    });

    props.table.grantReadWriteData(userFunction);
    props.bucket.grantReadWrite(userFunction);
    this.functions.push(userFunction);

    // API Routes
    const users = this.api.root.addResource('users');
    users.addResource('me').addMethod('GET', new apigateway.LambdaIntegration(userFunction), {
      authorizer,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.apiEndpoint,
      exportName: `Connect40-ApiEndpoint-${props.envName}`,
    });
  }
}

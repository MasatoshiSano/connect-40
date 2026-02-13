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

export class WebSocketStack extends cdk.Stack {
  public readonly webSocketApi: apigatewayv2.CfnApi;
  public readonly webSocketEndpoint: string;
  public readonly functions: lambda.Function[] = [];

  constructor(scope: Construct, id: string, props: WebSocketStackProps) {
    super(scope, id, props);

    // WebSocket API Gateway (プレースホルダー - Phase 4で実装)
    this.webSocketApi = new apigatewayv2.CfnApi(this, 'WebSocketApi', {
      name: `Connect40-WebSocket-${props.envName}`,
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.action',
    });

    this.webSocketEndpoint = `wss://${this.webSocketApi.ref}.execute-api.${this.region}.amazonaws.com/${props.envName}`;

    // Outputs
    new cdk.CfnOutput(this, 'WebSocketEndpoint', {
      value: this.webSocketEndpoint,
      exportName: `Connect40-WebSocketEndpoint-${props.envName}`,
    });
  }
}

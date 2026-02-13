import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  envName: string;
  apiGateway?: apigateway.RestApi;
  lambdaFunctions?: lambda.Function[];
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alarms (Phase 7で詳細設定)
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: `Connect40 Alarms (${props.envName})`,
    });

    // CloudWatch Dashboard (Phase 7で詳細設定)
    new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `Connect40-${props.envName}`,
    });

    // Outputs
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      exportName: `Connect40-AlarmTopicArn-${props.envName}`,
    });
  }
}

#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/stacks/auth-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { WebSocketStack } from '../lib/stacks/websocket-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';

const app = new cdk.App();

const env = app.node.tryGetContext('env') || 'dev';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'ap-northeast-1';

const stackProps = {
  env: { account, region },
  tags: {
    Environment: env,
    Project: 'Connect40',
    ManagedBy: 'CDK',
  },
};

// Auth Stack (Cognito)
const authStack = new AuthStack(app, `Connect40-Auth-${env}`, {
  ...stackProps,
  envName: env,
});

// Database Stack (DynamoDB)
const databaseStack = new DatabaseStack(app, `Connect40-Database-${env}`, {
  ...stackProps,
  envName: env,
});

// Storage Stack (S3)
const storageStack = new StorageStack(app, `Connect40-Storage-${env}`, {
  ...stackProps,
  envName: env,
});

// API Stack (API Gateway REST + Lambda)
const apiStack = new ApiStack(app, `Connect40-Api-${env}`, {
  ...stackProps,
  envName: env,
  userPool: authStack.userPool,
  table: databaseStack.table,
  bucket: storageStack.bucket,
});

// WebSocket Stack (API Gateway WebSocket + Lambda)
const webSocketStack = new WebSocketStack(app, `Connect40-WebSocket-${env}`, {
  ...stackProps,
  envName: env,
  userPool: authStack.userPool,
  table: databaseStack.table,
});

// Frontend Stack (S3 + CloudFront)
const frontendStack = new FrontendStack(app, `Connect40-Frontend-${env}`, {
  ...stackProps,
  envName: env,
  apiEndpoint: apiStack.apiEndpoint,
  webSocketEndpoint: webSocketStack.webSocketEndpoint,
});

// Monitoring Stack (CloudWatch)
const monitoringStack = new MonitoringStack(app, `Connect40-Monitoring-${env}`, {
  ...stackProps,
  envName: env,
  apiGateway: apiStack.api,
  lambdaFunctions: [...apiStack.functions, ...webSocketStack.functions],
});

app.synth();

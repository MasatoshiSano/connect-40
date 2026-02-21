#!/usr/bin/env node
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const auth_stack_1 = require("../lib/stacks/auth-stack");
const database_stack_1 = require("../lib/stacks/database-stack");
const storage_stack_1 = require("../lib/stacks/storage-stack");
const api_stack_1 = require("../lib/stacks/api-stack");
const websocket_stack_1 = require("../lib/stacks/websocket-stack");
const frontend_stack_1 = require("../lib/stacks/frontend-stack");
const monitoring_stack_1 = require("../lib/stacks/monitoring-stack");
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
const authStack = new auth_stack_1.AuthStack(app, `Connect40-Auth-${env}`, {
    ...stackProps,
    envName: env,
});
// Database Stack (DynamoDB)
const databaseStack = new database_stack_1.DatabaseStack(app, `Connect40-Database-${env}`, {
    ...stackProps,
    envName: env,
});
// Storage Stack (S3)
const storageStack = new storage_stack_1.StorageStack(app, `Connect40-Storage-${env}`, {
    ...stackProps,
    envName: env,
});
// API Stack (API Gateway REST + Lambda)
const apiStack = new api_stack_1.ApiStack(app, `Connect40-Api-${env}`, {
    ...stackProps,
    envName: env,
    userPool: authStack.userPool,
    table: databaseStack.table,
    bucket: storageStack.bucket,
});
// WebSocket Stack (API Gateway WebSocket + Lambda)
const webSocketStack = new websocket_stack_1.WebSocketStack(app, `Connect40-WebSocket-${env}`, {
    ...stackProps,
    envName: env,
    userPool: authStack.userPool,
    userPoolClient: authStack.userPoolClient,
    table: databaseStack.table,
});
// Frontend Stack (S3 + CloudFront)
const frontendStack = new frontend_stack_1.FrontendStack(app, `Connect40-Frontend-${env}`, {
    ...stackProps,
    envName: env,
    apiEndpoint: apiStack.apiEndpoint,
    webSocketEndpoint: webSocketStack.webSocketEndpoint,
});
// Monitoring Stack (CloudWatch)
const monitoringStack = new monitoring_stack_1.MonitoringStack(app, `Connect40-Monitoring-${env}`, {
    ...stackProps,
    envName: env,
    apiGateway: apiStack.api,
    lambdaFunctions: [...apiStack.functions, ...webSocketStack.functions],
});
// Define stack dependencies
apiStack.addDependency(authStack);
apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);
webSocketStack.addDependency(authStack);
webSocketStack.addDependency(databaseStack);
frontendStack.addDependency(apiStack);
frontendStack.addDependency(webSocketStack);
monitoringStack.addDependency(apiStack);
monitoringStack.addDependency(webSocketStack);
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMseURBQXFEO0FBQ3JELGlFQUE2RDtBQUM3RCwrREFBMkQ7QUFDM0QsdURBQW1EO0FBQ25ELG1FQUErRDtBQUMvRCxpRUFBNkQ7QUFDN0QscUVBQWlFO0FBRWpFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUNuRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDO0FBQ2hELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksZ0JBQWdCLENBQUM7QUFFbEUsTUFBTSxVQUFVLEdBQUc7SUFDakIsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRTtJQUN4QixJQUFJLEVBQUU7UUFDSixXQUFXLEVBQUUsR0FBRztRQUNoQixPQUFPLEVBQUUsV0FBVztRQUNwQixTQUFTLEVBQUUsS0FBSztLQUNqQjtDQUNGLENBQUM7QUFFRix1QkFBdUI7QUFDdkIsTUFBTSxTQUFTLEdBQUcsSUFBSSxzQkFBUyxDQUFDLEdBQUcsRUFBRSxrQkFBa0IsR0FBRyxFQUFFLEVBQUU7SUFDNUQsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7Q0FDYixDQUFDLENBQUM7QUFFSCw0QkFBNEI7QUFDNUIsTUFBTSxhQUFhLEdBQUcsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSxzQkFBc0IsR0FBRyxFQUFFLEVBQUU7SUFDeEUsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7Q0FDYixDQUFDLENBQUM7QUFFSCxxQkFBcUI7QUFDckIsTUFBTSxZQUFZLEdBQUcsSUFBSSw0QkFBWSxDQUFDLEdBQUcsRUFBRSxxQkFBcUIsR0FBRyxFQUFFLEVBQUU7SUFDckUsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7Q0FDYixDQUFDLENBQUM7QUFFSCx3Q0FBd0M7QUFDeEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsR0FBRyxFQUFFLEVBQUU7SUFDekQsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7SUFDWixRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7SUFDNUIsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLO0lBQzFCLE1BQU0sRUFBRSxZQUFZLENBQUMsTUFBTTtDQUM1QixDQUFDLENBQUM7QUFFSCxtREFBbUQ7QUFDbkQsTUFBTSxjQUFjLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLEdBQUcsRUFBRSx1QkFBdUIsR0FBRyxFQUFFLEVBQUU7SUFDM0UsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7SUFDWixRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7SUFDNUIsY0FBYyxFQUFFLFNBQVMsQ0FBQyxjQUFjO0lBQ3hDLEtBQUssRUFBRSxhQUFhLENBQUMsS0FBSztDQUMzQixDQUFDLENBQUM7QUFFSCxtQ0FBbUM7QUFDbkMsTUFBTSxhQUFhLEdBQUcsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSxzQkFBc0IsR0FBRyxFQUFFLEVBQUU7SUFDeEUsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7SUFDWixXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVc7SUFDakMsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLGlCQUFpQjtDQUNwRCxDQUFDLENBQUM7QUFFSCxnQ0FBZ0M7QUFDaEMsTUFBTSxlQUFlLEdBQUcsSUFBSSxrQ0FBZSxDQUFDLEdBQUcsRUFBRSx3QkFBd0IsR0FBRyxFQUFFLEVBQUU7SUFDOUUsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7SUFDWixVQUFVLEVBQUUsUUFBUSxDQUFDLEdBQUc7SUFDeEIsZUFBZSxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsY0FBYyxDQUFDLFNBQVMsQ0FBQztDQUN0RSxDQUFDLENBQUM7QUFFSCw0QkFBNEI7QUFDNUIsUUFBUSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNsQyxRQUFRLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3RDLFFBQVEsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFckMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN4QyxjQUFjLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBRTVDLGFBQWEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdEMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUU1QyxlQUFlLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3hDLGVBQWUsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFOUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEF1dGhTdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3MvYXV0aC1zdGFjayc7XG5pbXBvcnQgeyBEYXRhYmFzZVN0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9kYXRhYmFzZS1zdGFjayc7XG5pbXBvcnQgeyBTdG9yYWdlU3RhY2sgfSBmcm9tICcuLi9saWIvc3RhY2tzL3N0b3JhZ2Utc3RhY2snO1xuaW1wb3J0IHsgQXBpU3RhY2sgfSBmcm9tICcuLi9saWIvc3RhY2tzL2FwaS1zdGFjayc7XG5pbXBvcnQgeyBXZWJTb2NrZXRTdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3Mvd2Vic29ja2V0LXN0YWNrJztcbmltcG9ydCB7IEZyb250ZW5kU3RhY2sgfSBmcm9tICcuLi9saWIvc3RhY2tzL2Zyb250ZW5kLXN0YWNrJztcbmltcG9ydCB7IE1vbml0b3JpbmdTdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3MvbW9uaXRvcmluZy1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbmNvbnN0IGVudiA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VudicpIHx8ICdkZXYnO1xuY29uc3QgYWNjb3VudCA9IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQ7XG5jb25zdCByZWdpb24gPSBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT04gfHwgJ2FwLW5vcnRoZWFzdC0xJztcblxuY29uc3Qgc3RhY2tQcm9wcyA9IHtcbiAgZW52OiB7IGFjY291bnQsIHJlZ2lvbiB9LFxuICB0YWdzOiB7XG4gICAgRW52aXJvbm1lbnQ6IGVudixcbiAgICBQcm9qZWN0OiAnQ29ubmVjdDQwJyxcbiAgICBNYW5hZ2VkQnk6ICdDREsnLFxuICB9LFxufTtcblxuLy8gQXV0aCBTdGFjayAoQ29nbml0bylcbmNvbnN0IGF1dGhTdGFjayA9IG5ldyBBdXRoU3RhY2soYXBwLCBgQ29ubmVjdDQwLUF1dGgtJHtlbnZ9YCwge1xuICAuLi5zdGFja1Byb3BzLFxuICBlbnZOYW1lOiBlbnYsXG59KTtcblxuLy8gRGF0YWJhc2UgU3RhY2sgKER5bmFtb0RCKVxuY29uc3QgZGF0YWJhc2VTdGFjayA9IG5ldyBEYXRhYmFzZVN0YWNrKGFwcCwgYENvbm5lY3Q0MC1EYXRhYmFzZS0ke2Vudn1gLCB7XG4gIC4uLnN0YWNrUHJvcHMsXG4gIGVudk5hbWU6IGVudixcbn0pO1xuXG4vLyBTdG9yYWdlIFN0YWNrIChTMylcbmNvbnN0IHN0b3JhZ2VTdGFjayA9IG5ldyBTdG9yYWdlU3RhY2soYXBwLCBgQ29ubmVjdDQwLVN0b3JhZ2UtJHtlbnZ9YCwge1xuICAuLi5zdGFja1Byb3BzLFxuICBlbnZOYW1lOiBlbnYsXG59KTtcblxuLy8gQVBJIFN0YWNrIChBUEkgR2F0ZXdheSBSRVNUICsgTGFtYmRhKVxuY29uc3QgYXBpU3RhY2sgPSBuZXcgQXBpU3RhY2soYXBwLCBgQ29ubmVjdDQwLUFwaS0ke2Vudn1gLCB7XG4gIC4uLnN0YWNrUHJvcHMsXG4gIGVudk5hbWU6IGVudixcbiAgdXNlclBvb2w6IGF1dGhTdGFjay51c2VyUG9vbCxcbiAgdGFibGU6IGRhdGFiYXNlU3RhY2sudGFibGUsXG4gIGJ1Y2tldDogc3RvcmFnZVN0YWNrLmJ1Y2tldCxcbn0pO1xuXG4vLyBXZWJTb2NrZXQgU3RhY2sgKEFQSSBHYXRld2F5IFdlYlNvY2tldCArIExhbWJkYSlcbmNvbnN0IHdlYlNvY2tldFN0YWNrID0gbmV3IFdlYlNvY2tldFN0YWNrKGFwcCwgYENvbm5lY3Q0MC1XZWJTb2NrZXQtJHtlbnZ9YCwge1xuICAuLi5zdGFja1Byb3BzLFxuICBlbnZOYW1lOiBlbnYsXG4gIHVzZXJQb29sOiBhdXRoU3RhY2sudXNlclBvb2wsXG4gIHVzZXJQb29sQ2xpZW50OiBhdXRoU3RhY2sudXNlclBvb2xDbGllbnQsXG4gIHRhYmxlOiBkYXRhYmFzZVN0YWNrLnRhYmxlLFxufSk7XG5cbi8vIEZyb250ZW5kIFN0YWNrIChTMyArIENsb3VkRnJvbnQpXG5jb25zdCBmcm9udGVuZFN0YWNrID0gbmV3IEZyb250ZW5kU3RhY2soYXBwLCBgQ29ubmVjdDQwLUZyb250ZW5kLSR7ZW52fWAsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgZW52TmFtZTogZW52LFxuICBhcGlFbmRwb2ludDogYXBpU3RhY2suYXBpRW5kcG9pbnQsXG4gIHdlYlNvY2tldEVuZHBvaW50OiB3ZWJTb2NrZXRTdGFjay53ZWJTb2NrZXRFbmRwb2ludCxcbn0pO1xuXG4vLyBNb25pdG9yaW5nIFN0YWNrIChDbG91ZFdhdGNoKVxuY29uc3QgbW9uaXRvcmluZ1N0YWNrID0gbmV3IE1vbml0b3JpbmdTdGFjayhhcHAsIGBDb25uZWN0NDAtTW9uaXRvcmluZy0ke2Vudn1gLCB7XG4gIC4uLnN0YWNrUHJvcHMsXG4gIGVudk5hbWU6IGVudixcbiAgYXBpR2F0ZXdheTogYXBpU3RhY2suYXBpLFxuICBsYW1iZGFGdW5jdGlvbnM6IFsuLi5hcGlTdGFjay5mdW5jdGlvbnMsIC4uLndlYlNvY2tldFN0YWNrLmZ1bmN0aW9uc10sXG59KTtcblxuLy8gRGVmaW5lIHN0YWNrIGRlcGVuZGVuY2llc1xuYXBpU3RhY2suYWRkRGVwZW5kZW5jeShhdXRoU3RhY2spO1xuYXBpU3RhY2suYWRkRGVwZW5kZW5jeShkYXRhYmFzZVN0YWNrKTtcbmFwaVN0YWNrLmFkZERlcGVuZGVuY3koc3RvcmFnZVN0YWNrKTtcblxud2ViU29ja2V0U3RhY2suYWRkRGVwZW5kZW5jeShhdXRoU3RhY2spO1xud2ViU29ja2V0U3RhY2suYWRkRGVwZW5kZW5jeShkYXRhYmFzZVN0YWNrKTtcblxuZnJvbnRlbmRTdGFjay5hZGREZXBlbmRlbmN5KGFwaVN0YWNrKTtcbmZyb250ZW5kU3RhY2suYWRkRGVwZW5kZW5jeSh3ZWJTb2NrZXRTdGFjayk7XG5cbm1vbml0b3JpbmdTdGFjay5hZGREZXBlbmRlbmN5KGFwaVN0YWNrKTtcbm1vbml0b3JpbmdTdGFjay5hZGREZXBlbmRlbmN5KHdlYlNvY2tldFN0YWNrKTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=
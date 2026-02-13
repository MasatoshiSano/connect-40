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
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMseURBQXFEO0FBQ3JELGlFQUE2RDtBQUM3RCwrREFBMkQ7QUFDM0QsdURBQW1EO0FBQ25ELG1FQUErRDtBQUMvRCxpRUFBNkQ7QUFDN0QscUVBQWlFO0FBRWpFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUNuRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDO0FBQ2hELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksZ0JBQWdCLENBQUM7QUFFbEUsTUFBTSxVQUFVLEdBQUc7SUFDakIsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRTtJQUN4QixJQUFJLEVBQUU7UUFDSixXQUFXLEVBQUUsR0FBRztRQUNoQixPQUFPLEVBQUUsV0FBVztRQUNwQixTQUFTLEVBQUUsS0FBSztLQUNqQjtDQUNGLENBQUM7QUFFRix1QkFBdUI7QUFDdkIsTUFBTSxTQUFTLEdBQUcsSUFBSSxzQkFBUyxDQUFDLEdBQUcsRUFBRSxrQkFBa0IsR0FBRyxFQUFFLEVBQUU7SUFDNUQsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7Q0FDYixDQUFDLENBQUM7QUFFSCw0QkFBNEI7QUFDNUIsTUFBTSxhQUFhLEdBQUcsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSxzQkFBc0IsR0FBRyxFQUFFLEVBQUU7SUFDeEUsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7Q0FDYixDQUFDLENBQUM7QUFFSCxxQkFBcUI7QUFDckIsTUFBTSxZQUFZLEdBQUcsSUFBSSw0QkFBWSxDQUFDLEdBQUcsRUFBRSxxQkFBcUIsR0FBRyxFQUFFLEVBQUU7SUFDckUsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7Q0FDYixDQUFDLENBQUM7QUFFSCx3Q0FBd0M7QUFDeEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsR0FBRyxFQUFFLEVBQUU7SUFDekQsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7SUFDWixRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7SUFDNUIsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLO0lBQzFCLE1BQU0sRUFBRSxZQUFZLENBQUMsTUFBTTtDQUM1QixDQUFDLENBQUM7QUFFSCxtREFBbUQ7QUFDbkQsTUFBTSxjQUFjLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLEdBQUcsRUFBRSx1QkFBdUIsR0FBRyxFQUFFLEVBQUU7SUFDM0UsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7SUFDWixRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7SUFDNUIsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLO0NBQzNCLENBQUMsQ0FBQztBQUVILG1DQUFtQztBQUNuQyxNQUFNLGFBQWEsR0FBRyxJQUFJLDhCQUFhLENBQUMsR0FBRyxFQUFFLHNCQUFzQixHQUFHLEVBQUUsRUFBRTtJQUN4RSxHQUFHLFVBQVU7SUFDYixPQUFPLEVBQUUsR0FBRztJQUNaLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVztJQUNqQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsaUJBQWlCO0NBQ3BELENBQUMsQ0FBQztBQUVILGdDQUFnQztBQUNoQyxNQUFNLGVBQWUsR0FBRyxJQUFJLGtDQUFlLENBQUMsR0FBRyxFQUFFLHdCQUF3QixHQUFHLEVBQUUsRUFBRTtJQUM5RSxHQUFHLFVBQVU7SUFDYixPQUFPLEVBQUUsR0FBRztJQUNaLFVBQVUsRUFBRSxRQUFRLENBQUMsR0FBRztJQUN4QixlQUFlLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxTQUFTLEVBQUUsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDO0NBQ3RFLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBBdXRoU3RhY2sgfSBmcm9tICcuLi9saWIvc3RhY2tzL2F1dGgtc3RhY2snO1xuaW1wb3J0IHsgRGF0YWJhc2VTdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3MvZGF0YWJhc2Utc3RhY2snO1xuaW1wb3J0IHsgU3RvcmFnZVN0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9zdG9yYWdlLXN0YWNrJztcbmltcG9ydCB7IEFwaVN0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9hcGktc3RhY2snO1xuaW1wb3J0IHsgV2ViU29ja2V0U3RhY2sgfSBmcm9tICcuLi9saWIvc3RhY2tzL3dlYnNvY2tldC1zdGFjayc7XG5pbXBvcnQgeyBGcm9udGVuZFN0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9mcm9udGVuZC1zdGFjayc7XG5pbXBvcnQgeyBNb25pdG9yaW5nU3RhY2sgfSBmcm9tICcuLi9saWIvc3RhY2tzL21vbml0b3Jpbmctc3RhY2snO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuXG5jb25zdCBlbnYgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbnYnKSB8fCAnZGV2JztcbmNvbnN0IGFjY291bnQgPSBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5UO1xuY29uc3QgcmVnaW9uID0gcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OIHx8ICdhcC1ub3J0aGVhc3QtMSc7XG5cbmNvbnN0IHN0YWNrUHJvcHMgPSB7XG4gIGVudjogeyBhY2NvdW50LCByZWdpb24gfSxcbiAgdGFnczoge1xuICAgIEVudmlyb25tZW50OiBlbnYsXG4gICAgUHJvamVjdDogJ0Nvbm5lY3Q0MCcsXG4gICAgTWFuYWdlZEJ5OiAnQ0RLJyxcbiAgfSxcbn07XG5cbi8vIEF1dGggU3RhY2sgKENvZ25pdG8pXG5jb25zdCBhdXRoU3RhY2sgPSBuZXcgQXV0aFN0YWNrKGFwcCwgYENvbm5lY3Q0MC1BdXRoLSR7ZW52fWAsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgZW52TmFtZTogZW52LFxufSk7XG5cbi8vIERhdGFiYXNlIFN0YWNrIChEeW5hbW9EQilcbmNvbnN0IGRhdGFiYXNlU3RhY2sgPSBuZXcgRGF0YWJhc2VTdGFjayhhcHAsIGBDb25uZWN0NDAtRGF0YWJhc2UtJHtlbnZ9YCwge1xuICAuLi5zdGFja1Byb3BzLFxuICBlbnZOYW1lOiBlbnYsXG59KTtcblxuLy8gU3RvcmFnZSBTdGFjayAoUzMpXG5jb25zdCBzdG9yYWdlU3RhY2sgPSBuZXcgU3RvcmFnZVN0YWNrKGFwcCwgYENvbm5lY3Q0MC1TdG9yYWdlLSR7ZW52fWAsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgZW52TmFtZTogZW52LFxufSk7XG5cbi8vIEFQSSBTdGFjayAoQVBJIEdhdGV3YXkgUkVTVCArIExhbWJkYSlcbmNvbnN0IGFwaVN0YWNrID0gbmV3IEFwaVN0YWNrKGFwcCwgYENvbm5lY3Q0MC1BcGktJHtlbnZ9YCwge1xuICAuLi5zdGFja1Byb3BzLFxuICBlbnZOYW1lOiBlbnYsXG4gIHVzZXJQb29sOiBhdXRoU3RhY2sudXNlclBvb2wsXG4gIHRhYmxlOiBkYXRhYmFzZVN0YWNrLnRhYmxlLFxuICBidWNrZXQ6IHN0b3JhZ2VTdGFjay5idWNrZXQsXG59KTtcblxuLy8gV2ViU29ja2V0IFN0YWNrIChBUEkgR2F0ZXdheSBXZWJTb2NrZXQgKyBMYW1iZGEpXG5jb25zdCB3ZWJTb2NrZXRTdGFjayA9IG5ldyBXZWJTb2NrZXRTdGFjayhhcHAsIGBDb25uZWN0NDAtV2ViU29ja2V0LSR7ZW52fWAsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgZW52TmFtZTogZW52LFxuICB1c2VyUG9vbDogYXV0aFN0YWNrLnVzZXJQb29sLFxuICB0YWJsZTogZGF0YWJhc2VTdGFjay50YWJsZSxcbn0pO1xuXG4vLyBGcm9udGVuZCBTdGFjayAoUzMgKyBDbG91ZEZyb250KVxuY29uc3QgZnJvbnRlbmRTdGFjayA9IG5ldyBGcm9udGVuZFN0YWNrKGFwcCwgYENvbm5lY3Q0MC1Gcm9udGVuZC0ke2Vudn1gLCB7XG4gIC4uLnN0YWNrUHJvcHMsXG4gIGVudk5hbWU6IGVudixcbiAgYXBpRW5kcG9pbnQ6IGFwaVN0YWNrLmFwaUVuZHBvaW50LFxuICB3ZWJTb2NrZXRFbmRwb2ludDogd2ViU29ja2V0U3RhY2sud2ViU29ja2V0RW5kcG9pbnQsXG59KTtcblxuLy8gTW9uaXRvcmluZyBTdGFjayAoQ2xvdWRXYXRjaClcbmNvbnN0IG1vbml0b3JpbmdTdGFjayA9IG5ldyBNb25pdG9yaW5nU3RhY2soYXBwLCBgQ29ubmVjdDQwLU1vbml0b3JpbmctJHtlbnZ9YCwge1xuICAuLi5zdGFja1Byb3BzLFxuICBlbnZOYW1lOiBlbnYsXG4gIGFwaUdhdGV3YXk6IGFwaVN0YWNrLmFwaSxcbiAgbGFtYmRhRnVuY3Rpb25zOiBbLi4uYXBpU3RhY2suZnVuY3Rpb25zLCAuLi53ZWJTb2NrZXRTdGFjay5mdW5jdGlvbnNdLFxufSk7XG5cbmFwcC5zeW50aCgpO1xuIl19
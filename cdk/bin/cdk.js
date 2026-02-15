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
// TEMPORARILY DISABLED - Only deploying API stack
/*
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
*/
// Define stack dependencies
apiStack.addDependency(authStack);
apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);
/*
webSocketStack.addDependency(authStack);
webSocketStack.addDependency(databaseStack);

frontendStack.addDependency(apiStack);
frontendStack.addDependency(webSocketStack);

monitoringStack.addDependency(apiStack);
monitoringStack.addDependency(webSocketStack);
*/
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMseURBQXFEO0FBQ3JELGlFQUE2RDtBQUM3RCwrREFBMkQ7QUFDM0QsdURBQW1EO0FBS25ELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUNuRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDO0FBQ2hELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksZ0JBQWdCLENBQUM7QUFFbEUsTUFBTSxVQUFVLEdBQUc7SUFDakIsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRTtJQUN4QixJQUFJLEVBQUU7UUFDSixXQUFXLEVBQUUsR0FBRztRQUNoQixPQUFPLEVBQUUsV0FBVztRQUNwQixTQUFTLEVBQUUsS0FBSztLQUNqQjtDQUNGLENBQUM7QUFFRix1QkFBdUI7QUFDdkIsTUFBTSxTQUFTLEdBQUcsSUFBSSxzQkFBUyxDQUFDLEdBQUcsRUFBRSxrQkFBa0IsR0FBRyxFQUFFLEVBQUU7SUFDNUQsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7Q0FDYixDQUFDLENBQUM7QUFFSCw0QkFBNEI7QUFDNUIsTUFBTSxhQUFhLEdBQUcsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSxzQkFBc0IsR0FBRyxFQUFFLEVBQUU7SUFDeEUsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7Q0FDYixDQUFDLENBQUM7QUFFSCxxQkFBcUI7QUFDckIsTUFBTSxZQUFZLEdBQUcsSUFBSSw0QkFBWSxDQUFDLEdBQUcsRUFBRSxxQkFBcUIsR0FBRyxFQUFFLEVBQUU7SUFDckUsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7Q0FDYixDQUFDLENBQUM7QUFFSCx3Q0FBd0M7QUFDeEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsR0FBRyxFQUFFLEVBQUU7SUFDekQsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7SUFDWixRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7SUFDNUIsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLO0lBQzFCLE1BQU0sRUFBRSxZQUFZLENBQUMsTUFBTTtDQUM1QixDQUFDLENBQUM7QUFFSCxrREFBa0Q7QUFDbEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQXdCRTtBQUVGLDRCQUE0QjtBQUM1QixRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2xDLFFBQVEsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDdEMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUVyQzs7Ozs7Ozs7O0VBU0U7QUFFRixHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQXV0aFN0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9hdXRoLXN0YWNrJztcbmltcG9ydCB7IERhdGFiYXNlU3RhY2sgfSBmcm9tICcuLi9saWIvc3RhY2tzL2RhdGFiYXNlLXN0YWNrJztcbmltcG9ydCB7IFN0b3JhZ2VTdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3Mvc3RvcmFnZS1zdGFjayc7XG5pbXBvcnQgeyBBcGlTdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3MvYXBpLXN0YWNrJztcbmltcG9ydCB7IFdlYlNvY2tldFN0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy93ZWJzb2NrZXQtc3RhY2snO1xuaW1wb3J0IHsgRnJvbnRlbmRTdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3MvZnJvbnRlbmQtc3RhY2snO1xuaW1wb3J0IHsgTW9uaXRvcmluZ1N0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9tb25pdG9yaW5nLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuY29uc3QgZW52ID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52JykgfHwgJ2Rldic7XG5jb25zdCBhY2NvdW50ID0gcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVDtcbmNvbnN0IHJlZ2lvbiA9IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTiB8fCAnYXAtbm9ydGhlYXN0LTEnO1xuXG5jb25zdCBzdGFja1Byb3BzID0ge1xuICBlbnY6IHsgYWNjb3VudCwgcmVnaW9uIH0sXG4gIHRhZ3M6IHtcbiAgICBFbnZpcm9ubWVudDogZW52LFxuICAgIFByb2plY3Q6ICdDb25uZWN0NDAnLFxuICAgIE1hbmFnZWRCeTogJ0NESycsXG4gIH0sXG59O1xuXG4vLyBBdXRoIFN0YWNrIChDb2duaXRvKVxuY29uc3QgYXV0aFN0YWNrID0gbmV3IEF1dGhTdGFjayhhcHAsIGBDb25uZWN0NDAtQXV0aC0ke2Vudn1gLCB7XG4gIC4uLnN0YWNrUHJvcHMsXG4gIGVudk5hbWU6IGVudixcbn0pO1xuXG4vLyBEYXRhYmFzZSBTdGFjayAoRHluYW1vREIpXG5jb25zdCBkYXRhYmFzZVN0YWNrID0gbmV3IERhdGFiYXNlU3RhY2soYXBwLCBgQ29ubmVjdDQwLURhdGFiYXNlLSR7ZW52fWAsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgZW52TmFtZTogZW52LFxufSk7XG5cbi8vIFN0b3JhZ2UgU3RhY2sgKFMzKVxuY29uc3Qgc3RvcmFnZVN0YWNrID0gbmV3IFN0b3JhZ2VTdGFjayhhcHAsIGBDb25uZWN0NDAtU3RvcmFnZS0ke2Vudn1gLCB7XG4gIC4uLnN0YWNrUHJvcHMsXG4gIGVudk5hbWU6IGVudixcbn0pO1xuXG4vLyBBUEkgU3RhY2sgKEFQSSBHYXRld2F5IFJFU1QgKyBMYW1iZGEpXG5jb25zdCBhcGlTdGFjayA9IG5ldyBBcGlTdGFjayhhcHAsIGBDb25uZWN0NDAtQXBpLSR7ZW52fWAsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgZW52TmFtZTogZW52LFxuICB1c2VyUG9vbDogYXV0aFN0YWNrLnVzZXJQb29sLFxuICB0YWJsZTogZGF0YWJhc2VTdGFjay50YWJsZSxcbiAgYnVja2V0OiBzdG9yYWdlU3RhY2suYnVja2V0LFxufSk7XG5cbi8vIFRFTVBPUkFSSUxZIERJU0FCTEVEIC0gT25seSBkZXBsb3lpbmcgQVBJIHN0YWNrXG4vKlxuLy8gV2ViU29ja2V0IFN0YWNrIChBUEkgR2F0ZXdheSBXZWJTb2NrZXQgKyBMYW1iZGEpXG5jb25zdCB3ZWJTb2NrZXRTdGFjayA9IG5ldyBXZWJTb2NrZXRTdGFjayhhcHAsIGBDb25uZWN0NDAtV2ViU29ja2V0LSR7ZW52fWAsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgZW52TmFtZTogZW52LFxuICB1c2VyUG9vbDogYXV0aFN0YWNrLnVzZXJQb29sLFxuICB0YWJsZTogZGF0YWJhc2VTdGFjay50YWJsZSxcbn0pO1xuXG4vLyBGcm9udGVuZCBTdGFjayAoUzMgKyBDbG91ZEZyb250KVxuY29uc3QgZnJvbnRlbmRTdGFjayA9IG5ldyBGcm9udGVuZFN0YWNrKGFwcCwgYENvbm5lY3Q0MC1Gcm9udGVuZC0ke2Vudn1gLCB7XG4gIC4uLnN0YWNrUHJvcHMsXG4gIGVudk5hbWU6IGVudixcbiAgYXBpRW5kcG9pbnQ6IGFwaVN0YWNrLmFwaUVuZHBvaW50LFxuICB3ZWJTb2NrZXRFbmRwb2ludDogd2ViU29ja2V0U3RhY2sud2ViU29ja2V0RW5kcG9pbnQsXG59KTtcblxuLy8gTW9uaXRvcmluZyBTdGFjayAoQ2xvdWRXYXRjaClcbmNvbnN0IG1vbml0b3JpbmdTdGFjayA9IG5ldyBNb25pdG9yaW5nU3RhY2soYXBwLCBgQ29ubmVjdDQwLU1vbml0b3JpbmctJHtlbnZ9YCwge1xuICAuLi5zdGFja1Byb3BzLFxuICBlbnZOYW1lOiBlbnYsXG4gIGFwaUdhdGV3YXk6IGFwaVN0YWNrLmFwaSxcbiAgbGFtYmRhRnVuY3Rpb25zOiBbLi4uYXBpU3RhY2suZnVuY3Rpb25zLCAuLi53ZWJTb2NrZXRTdGFjay5mdW5jdGlvbnNdLFxufSk7XG4qL1xuXG4vLyBEZWZpbmUgc3RhY2sgZGVwZW5kZW5jaWVzXG5hcGlTdGFjay5hZGREZXBlbmRlbmN5KGF1dGhTdGFjayk7XG5hcGlTdGFjay5hZGREZXBlbmRlbmN5KGRhdGFiYXNlU3RhY2spO1xuYXBpU3RhY2suYWRkRGVwZW5kZW5jeShzdG9yYWdlU3RhY2spO1xuXG4vKlxud2ViU29ja2V0U3RhY2suYWRkRGVwZW5kZW5jeShhdXRoU3RhY2spO1xud2ViU29ja2V0U3RhY2suYWRkRGVwZW5kZW5jeShkYXRhYmFzZVN0YWNrKTtcblxuZnJvbnRlbmRTdGFjay5hZGREZXBlbmRlbmN5KGFwaVN0YWNrKTtcbmZyb250ZW5kU3RhY2suYWRkRGVwZW5kZW5jeSh3ZWJTb2NrZXRTdGFjayk7XG5cbm1vbml0b3JpbmdTdGFjay5hZGREZXBlbmRlbmN5KGFwaVN0YWNrKTtcbm1vbml0b3JpbmdTdGFjay5hZGREZXBlbmRlbmN5KHdlYlNvY2tldFN0YWNrKTtcbiovXG5cbmFwcC5zeW50aCgpO1xuIl19
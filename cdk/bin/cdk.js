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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMseURBQXFEO0FBQ3JELGlFQUE2RDtBQUM3RCwrREFBMkQ7QUFDM0QsdURBQW1EO0FBQ25ELG1FQUErRDtBQUMvRCxpRUFBNkQ7QUFDN0QscUVBQWlFO0FBRWpFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUNuRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDO0FBQ2hELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksZ0JBQWdCLENBQUM7QUFFbEUsTUFBTSxVQUFVLEdBQUc7SUFDakIsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRTtJQUN4QixJQUFJLEVBQUU7UUFDSixXQUFXLEVBQUUsR0FBRztRQUNoQixPQUFPLEVBQUUsV0FBVztRQUNwQixTQUFTLEVBQUUsS0FBSztLQUNqQjtDQUNGLENBQUM7QUFFRix1QkFBdUI7QUFDdkIsTUFBTSxTQUFTLEdBQUcsSUFBSSxzQkFBUyxDQUFDLEdBQUcsRUFBRSxrQkFBa0IsR0FBRyxFQUFFLEVBQUU7SUFDNUQsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7Q0FDYixDQUFDLENBQUM7QUFFSCw0QkFBNEI7QUFDNUIsTUFBTSxhQUFhLEdBQUcsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSxzQkFBc0IsR0FBRyxFQUFFLEVBQUU7SUFDeEUsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7Q0FDYixDQUFDLENBQUM7QUFFSCxxQkFBcUI7QUFDckIsTUFBTSxZQUFZLEdBQUcsSUFBSSw0QkFBWSxDQUFDLEdBQUcsRUFBRSxxQkFBcUIsR0FBRyxFQUFFLEVBQUU7SUFDckUsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7Q0FDYixDQUFDLENBQUM7QUFFSCx3Q0FBd0M7QUFDeEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsR0FBRyxFQUFFLEVBQUU7SUFDekQsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7SUFDWixRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7SUFDNUIsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLO0lBQzFCLE1BQU0sRUFBRSxZQUFZLENBQUMsTUFBTTtDQUM1QixDQUFDLENBQUM7QUFFSCxtREFBbUQ7QUFDbkQsTUFBTSxjQUFjLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLEdBQUcsRUFBRSx1QkFBdUIsR0FBRyxFQUFFLEVBQUU7SUFDM0UsR0FBRyxVQUFVO0lBQ2IsT0FBTyxFQUFFLEdBQUc7SUFDWixRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7SUFDNUIsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLO0NBQzNCLENBQUMsQ0FBQztBQUVILG1DQUFtQztBQUNuQyxNQUFNLGFBQWEsR0FBRyxJQUFJLDhCQUFhLENBQUMsR0FBRyxFQUFFLHNCQUFzQixHQUFHLEVBQUUsRUFBRTtJQUN4RSxHQUFHLFVBQVU7SUFDYixPQUFPLEVBQUUsR0FBRztJQUNaLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVztJQUNqQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsaUJBQWlCO0NBQ3BELENBQUMsQ0FBQztBQUVILGdDQUFnQztBQUNoQyxNQUFNLGVBQWUsR0FBRyxJQUFJLGtDQUFlLENBQUMsR0FBRyxFQUFFLHdCQUF3QixHQUFHLEVBQUUsRUFBRTtJQUM5RSxHQUFHLFVBQVU7SUFDYixPQUFPLEVBQUUsR0FBRztJQUNaLFVBQVUsRUFBRSxRQUFRLENBQUMsR0FBRztJQUN4QixlQUFlLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxTQUFTLEVBQUUsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDO0NBQ3RFLENBQUMsQ0FBQztBQUVILDRCQUE0QjtBQUM1QixRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2xDLFFBQVEsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDdEMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUVyQyxjQUFjLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3hDLGNBQWMsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFNUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN0QyxhQUFhLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRTVDLGVBQWUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDeEMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUU5QyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQXV0aFN0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9hdXRoLXN0YWNrJztcbmltcG9ydCB7IERhdGFiYXNlU3RhY2sgfSBmcm9tICcuLi9saWIvc3RhY2tzL2RhdGFiYXNlLXN0YWNrJztcbmltcG9ydCB7IFN0b3JhZ2VTdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3Mvc3RvcmFnZS1zdGFjayc7XG5pbXBvcnQgeyBBcGlTdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3MvYXBpLXN0YWNrJztcbmltcG9ydCB7IFdlYlNvY2tldFN0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy93ZWJzb2NrZXQtc3RhY2snO1xuaW1wb3J0IHsgRnJvbnRlbmRTdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3MvZnJvbnRlbmQtc3RhY2snO1xuaW1wb3J0IHsgTW9uaXRvcmluZ1N0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9tb25pdG9yaW5nLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuY29uc3QgZW52ID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52JykgfHwgJ2Rldic7XG5jb25zdCBhY2NvdW50ID0gcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVDtcbmNvbnN0IHJlZ2lvbiA9IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTiB8fCAnYXAtbm9ydGhlYXN0LTEnO1xuXG5jb25zdCBzdGFja1Byb3BzID0ge1xuICBlbnY6IHsgYWNjb3VudCwgcmVnaW9uIH0sXG4gIHRhZ3M6IHtcbiAgICBFbnZpcm9ubWVudDogZW52LFxuICAgIFByb2plY3Q6ICdDb25uZWN0NDAnLFxuICAgIE1hbmFnZWRCeTogJ0NESycsXG4gIH0sXG59O1xuXG4vLyBBdXRoIFN0YWNrIChDb2duaXRvKVxuY29uc3QgYXV0aFN0YWNrID0gbmV3IEF1dGhTdGFjayhhcHAsIGBDb25uZWN0NDAtQXV0aC0ke2Vudn1gLCB7XG4gIC4uLnN0YWNrUHJvcHMsXG4gIGVudk5hbWU6IGVudixcbn0pO1xuXG4vLyBEYXRhYmFzZSBTdGFjayAoRHluYW1vREIpXG5jb25zdCBkYXRhYmFzZVN0YWNrID0gbmV3IERhdGFiYXNlU3RhY2soYXBwLCBgQ29ubmVjdDQwLURhdGFiYXNlLSR7ZW52fWAsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgZW52TmFtZTogZW52LFxufSk7XG5cbi8vIFN0b3JhZ2UgU3RhY2sgKFMzKVxuY29uc3Qgc3RvcmFnZVN0YWNrID0gbmV3IFN0b3JhZ2VTdGFjayhhcHAsIGBDb25uZWN0NDAtU3RvcmFnZS0ke2Vudn1gLCB7XG4gIC4uLnN0YWNrUHJvcHMsXG4gIGVudk5hbWU6IGVudixcbn0pO1xuXG4vLyBBUEkgU3RhY2sgKEFQSSBHYXRld2F5IFJFU1QgKyBMYW1iZGEpXG5jb25zdCBhcGlTdGFjayA9IG5ldyBBcGlTdGFjayhhcHAsIGBDb25uZWN0NDAtQXBpLSR7ZW52fWAsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgZW52TmFtZTogZW52LFxuICB1c2VyUG9vbDogYXV0aFN0YWNrLnVzZXJQb29sLFxuICB0YWJsZTogZGF0YWJhc2VTdGFjay50YWJsZSxcbiAgYnVja2V0OiBzdG9yYWdlU3RhY2suYnVja2V0LFxufSk7XG5cbi8vIFdlYlNvY2tldCBTdGFjayAoQVBJIEdhdGV3YXkgV2ViU29ja2V0ICsgTGFtYmRhKVxuY29uc3Qgd2ViU29ja2V0U3RhY2sgPSBuZXcgV2ViU29ja2V0U3RhY2soYXBwLCBgQ29ubmVjdDQwLVdlYlNvY2tldC0ke2Vudn1gLCB7XG4gIC4uLnN0YWNrUHJvcHMsXG4gIGVudk5hbWU6IGVudixcbiAgdXNlclBvb2w6IGF1dGhTdGFjay51c2VyUG9vbCxcbiAgdGFibGU6IGRhdGFiYXNlU3RhY2sudGFibGUsXG59KTtcblxuLy8gRnJvbnRlbmQgU3RhY2sgKFMzICsgQ2xvdWRGcm9udClcbmNvbnN0IGZyb250ZW5kU3RhY2sgPSBuZXcgRnJvbnRlbmRTdGFjayhhcHAsIGBDb25uZWN0NDAtRnJvbnRlbmQtJHtlbnZ9YCwge1xuICAuLi5zdGFja1Byb3BzLFxuICBlbnZOYW1lOiBlbnYsXG4gIGFwaUVuZHBvaW50OiBhcGlTdGFjay5hcGlFbmRwb2ludCxcbiAgd2ViU29ja2V0RW5kcG9pbnQ6IHdlYlNvY2tldFN0YWNrLndlYlNvY2tldEVuZHBvaW50LFxufSk7XG5cbi8vIE1vbml0b3JpbmcgU3RhY2sgKENsb3VkV2F0Y2gpXG5jb25zdCBtb25pdG9yaW5nU3RhY2sgPSBuZXcgTW9uaXRvcmluZ1N0YWNrKGFwcCwgYENvbm5lY3Q0MC1Nb25pdG9yaW5nLSR7ZW52fWAsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgZW52TmFtZTogZW52LFxuICBhcGlHYXRld2F5OiBhcGlTdGFjay5hcGksXG4gIGxhbWJkYUZ1bmN0aW9uczogWy4uLmFwaVN0YWNrLmZ1bmN0aW9ucywgLi4ud2ViU29ja2V0U3RhY2suZnVuY3Rpb25zXSxcbn0pO1xuXG4vLyBEZWZpbmUgc3RhY2sgZGVwZW5kZW5jaWVzXG5hcGlTdGFjay5hZGREZXBlbmRlbmN5KGF1dGhTdGFjayk7XG5hcGlTdGFjay5hZGREZXBlbmRlbmN5KGRhdGFiYXNlU3RhY2spO1xuYXBpU3RhY2suYWRkRGVwZW5kZW5jeShzdG9yYWdlU3RhY2spO1xuXG53ZWJTb2NrZXRTdGFjay5hZGREZXBlbmRlbmN5KGF1dGhTdGFjayk7XG53ZWJTb2NrZXRTdGFjay5hZGREZXBlbmRlbmN5KGRhdGFiYXNlU3RhY2spO1xuXG5mcm9udGVuZFN0YWNrLmFkZERlcGVuZGVuY3koYXBpU3RhY2spO1xuZnJvbnRlbmRTdGFjay5hZGREZXBlbmRlbmN5KHdlYlNvY2tldFN0YWNrKTtcblxubW9uaXRvcmluZ1N0YWNrLmFkZERlcGVuZGVuY3koYXBpU3RhY2spO1xubW9uaXRvcmluZ1N0YWNrLmFkZERlcGVuZGVuY3kod2ViU29ja2V0U3RhY2spO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==
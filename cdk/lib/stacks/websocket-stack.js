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
exports.WebSocketStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigatewayv2 = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
class WebSocketStack extends cdk.Stack {
    webSocketApi;
    webSocketEndpoint;
    functions = [];
    constructor(scope, id, props) {
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
exports.WebSocketStack = WebSocketStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid2Vic29ja2V0LXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywyRUFBNkQ7QUFZN0QsTUFBYSxjQUFlLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDM0IsWUFBWSxDQUFzQjtJQUNsQyxpQkFBaUIsQ0FBUztJQUMxQixTQUFTLEdBQXNCLEVBQUUsQ0FBQztJQUVsRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTBCO1FBQ2xFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGdEQUFnRDtRQUNoRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ2hFLElBQUksRUFBRSx1QkFBdUIsS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUM1QyxZQUFZLEVBQUUsV0FBVztZQUN6Qix3QkFBd0IsRUFBRSxzQkFBc0I7U0FDakQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLGdCQUFnQixJQUFJLENBQUMsTUFBTSxrQkFBa0IsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXBILFVBQVU7UUFDVixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzNDLEtBQUssRUFBRSxJQUFJLENBQUMsaUJBQWlCO1lBQzdCLFVBQVUsRUFBRSwrQkFBK0IsS0FBSyxDQUFDLE9BQU8sRUFBRTtTQUMzRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF2QkQsd0NBdUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXl2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheXYyJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdlYlNvY2tldFN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGVudk5hbWU6IHN0cmluZztcbiAgdXNlclBvb2w6IGNvZ25pdG8uVXNlclBvb2w7XG4gIHRhYmxlOiBkeW5hbW9kYi5UYWJsZTtcbn1cblxuZXhwb3J0IGNsYXNzIFdlYlNvY2tldFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHdlYlNvY2tldEFwaTogYXBpZ2F0ZXdheXYyLkNmbkFwaTtcbiAgcHVibGljIHJlYWRvbmx5IHdlYlNvY2tldEVuZHBvaW50OiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBmdW5jdGlvbnM6IGxhbWJkYS5GdW5jdGlvbltdID0gW107XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFdlYlNvY2tldFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIFdlYlNvY2tldCBBUEkgR2F0ZXdheSAo44OX44Os44O844K544Ob44Or44OA44O8IC0gUGhhc2UgNOOBp+Wun+ijhSlcbiAgICB0aGlzLndlYlNvY2tldEFwaSA9IG5ldyBhcGlnYXRld2F5djIuQ2ZuQXBpKHRoaXMsICdXZWJTb2NrZXRBcGknLCB7XG4gICAgICBuYW1lOiBgQ29ubmVjdDQwLVdlYlNvY2tldC0ke3Byb3BzLmVudk5hbWV9YCxcbiAgICAgIHByb3RvY29sVHlwZTogJ1dFQlNPQ0tFVCcsXG4gICAgICByb3V0ZVNlbGVjdGlvbkV4cHJlc3Npb246ICckcmVxdWVzdC5ib2R5LmFjdGlvbicsXG4gICAgfSk7XG5cbiAgICB0aGlzLndlYlNvY2tldEVuZHBvaW50ID0gYHdzczovLyR7dGhpcy53ZWJTb2NrZXRBcGkucmVmfS5leGVjdXRlLWFwaS4ke3RoaXMucmVnaW9ufS5hbWF6b25hd3MuY29tLyR7cHJvcHMuZW52TmFtZX1gO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdXZWJTb2NrZXRFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLndlYlNvY2tldEVuZHBvaW50LFxuICAgICAgZXhwb3J0TmFtZTogYENvbm5lY3Q0MC1XZWJTb2NrZXRFbmRwb2ludC0ke3Byb3BzLmVudk5hbWV9YCxcbiAgICB9KTtcbiAgfVxufVxuIl19
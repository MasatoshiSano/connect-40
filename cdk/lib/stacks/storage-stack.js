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
exports.StorageStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
class StorageStack extends cdk.Stack {
    bucket;
    constructor(scope, id, props) {
        super(scope, id, props);
        // S3 Bucket for user uploads (profile photos, verification documents)
        // ACL operations are blocked but bucket policy-based public access is allowed
        // so that profile/ and activity/ prefixes can be publicly readable.
        this.bucket = new s3.Bucket(this, 'UserUploadsBucket', {
            bucketName: `connect40-uploads-${props.envName}-${this.account}`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: new s3.BlockPublicAccess({
                blockPublicAcls: true,
                ignorePublicAcls: true,
                blockPublicPolicy: false,
                restrictPublicBuckets: false,
            }),
            cors: [
                {
                    allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
                    allowedOrigins: ['*'], // TODO: Restrict to frontend domain
                    allowedHeaders: ['*'],
                    maxAge: 3000,
                },
            ],
            lifecycleRules: [
                {
                    id: 'DeleteOldVerificationDocuments',
                    prefix: 'verification/',
                    expiration: cdk.Duration.days(7),
                },
            ],
            removalPolicy: props.envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: props.envName !== 'prod',
        });
        // Allow public GET for profile photos and activity images (not verification docs)
        this.bucket.addToResourcePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.StarPrincipal()],
            actions: ['s3:GetObject'],
            resources: [
                `${this.bucket.bucketArn}/profile/*`,
                `${this.bucket.bucketArn}/activity/*`,
            ],
        }));
        // Outputs
        new cdk.CfnOutput(this, 'BucketName', {
            value: this.bucket.bucketName,
            exportName: `Connect40-BucketName-${props.envName}`,
        });
    }
}
exports.StorageStack = StorageStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN0b3JhZ2Utc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVEQUF5QztBQUN6Qyx5REFBMkM7QUFPM0MsTUFBYSxZQUFhLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDekIsTUFBTSxDQUFZO0lBRWxDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBd0I7UUFDaEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsc0VBQXNFO1FBQ3RFLDhFQUE4RTtRQUM5RSxvRUFBb0U7UUFDcEUsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQ3JELFVBQVUsRUFBRSxxQkFBcUIsS0FBSyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hFLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDMUMsZUFBZSxFQUFFLElBQUk7Z0JBQ3JCLGdCQUFnQixFQUFFLElBQUk7Z0JBQ3RCLGlCQUFpQixFQUFFLEtBQUs7Z0JBQ3hCLHFCQUFxQixFQUFFLEtBQUs7YUFDN0IsQ0FBQztZQUNGLElBQUksRUFBRTtnQkFDSjtvQkFDRSxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztvQkFDN0UsY0FBYyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsb0NBQW9DO29CQUMzRCxjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQ3JCLE1BQU0sRUFBRSxJQUFJO2lCQUNiO2FBQ0Y7WUFDRCxjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsRUFBRSxFQUFFLGdDQUFnQztvQkFDcEMsTUFBTSxFQUFFLGVBQWU7b0JBQ3ZCLFVBQVUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7aUJBQ2pDO2FBQ0Y7WUFDRCxhQUFhLEVBQ1gsS0FBSyxDQUFDLE9BQU8sS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDakYsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLE9BQU8sS0FBSyxNQUFNO1NBQzVDLENBQUMsQ0FBQztRQUVILGtGQUFrRjtRQUNsRixJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUM3QixJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7WUFDdEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztZQUN4QixVQUFVLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNyQyxPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUM7WUFDekIsU0FBUyxFQUFFO2dCQUNULEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLFlBQVk7Z0JBQ3BDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLGFBQWE7YUFDdEM7U0FDRixDQUFDLENBQ0gsQ0FBQztRQUVGLFVBQVU7UUFDVixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNwQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVO1lBQzdCLFVBQVUsRUFBRSx3QkFBd0IsS0FBSyxDQUFDLE9BQU8sRUFBRTtTQUNwRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF6REQsb0NBeURDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBTdG9yYWdlU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgZW52TmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgU3RvcmFnZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldDogczMuQnVja2V0O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBTdG9yYWdlU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gUzMgQnVja2V0IGZvciB1c2VyIHVwbG9hZHMgKHByb2ZpbGUgcGhvdG9zLCB2ZXJpZmljYXRpb24gZG9jdW1lbnRzKVxuICAgIC8vIEFDTCBvcGVyYXRpb25zIGFyZSBibG9ja2VkIGJ1dCBidWNrZXQgcG9saWN5LWJhc2VkIHB1YmxpYyBhY2Nlc3MgaXMgYWxsb3dlZFxuICAgIC8vIHNvIHRoYXQgcHJvZmlsZS8gYW5kIGFjdGl2aXR5LyBwcmVmaXhlcyBjYW4gYmUgcHVibGljbHkgcmVhZGFibGUuXG4gICAgdGhpcy5idWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdVc2VyVXBsb2Fkc0J1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBjb25uZWN0NDAtdXBsb2Fkcy0ke3Byb3BzLmVudk5hbWV9LSR7dGhpcy5hY2NvdW50fWAsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogbmV3IHMzLkJsb2NrUHVibGljQWNjZXNzKHtcbiAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogZmFsc2UsXG4gICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogZmFsc2UsXG4gICAgICB9KSxcbiAgICAgIGNvcnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBbczMuSHR0cE1ldGhvZHMuR0VULCBzMy5IdHRwTWV0aG9kcy5QVVQsIHMzLkh0dHBNZXRob2RzLlBPU1RdLFxuICAgICAgICAgIGFsbG93ZWRPcmlnaW5zOiBbJyonXSwgLy8gVE9ETzogUmVzdHJpY3QgdG8gZnJvbnRlbmQgZG9tYWluXG4gICAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFsnKiddLFxuICAgICAgICAgIG1heEFnZTogMzAwMCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBsaWZlY3ljbGVSdWxlczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdEZWxldGVPbGRWZXJpZmljYXRpb25Eb2N1bWVudHMnLFxuICAgICAgICAgIHByZWZpeDogJ3ZlcmlmaWNhdGlvbi8nLFxuICAgICAgICAgIGV4cGlyYXRpb246IGNkay5EdXJhdGlvbi5kYXlzKDcpLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHJlbW92YWxQb2xpY3k6XG4gICAgICAgIHByb3BzLmVudk5hbWUgPT09ICdwcm9kJyA/IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiA6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogcHJvcHMuZW52TmFtZSAhPT0gJ3Byb2QnLFxuICAgIH0pO1xuXG4gICAgLy8gQWxsb3cgcHVibGljIEdFVCBmb3IgcHJvZmlsZSBwaG90b3MgYW5kIGFjdGl2aXR5IGltYWdlcyAobm90IHZlcmlmaWNhdGlvbiBkb2NzKVxuICAgIHRoaXMuYnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgcHJpbmNpcGFsczogW25ldyBpYW0uU3RhclByaW5jaXBhbCgpXSxcbiAgICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgYCR7dGhpcy5idWNrZXQuYnVja2V0QXJufS9wcm9maWxlLypgLFxuICAgICAgICAgIGAke3RoaXMuYnVja2V0LmJ1Y2tldEFybn0vYWN0aXZpdHkvKmAsXG4gICAgICAgIF0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0J1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5idWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIGV4cG9ydE5hbWU6IGBDb25uZWN0NDAtQnVja2V0TmFtZS0ke3Byb3BzLmVudk5hbWV9YCxcbiAgICB9KTtcbiAgfVxufVxuIl19
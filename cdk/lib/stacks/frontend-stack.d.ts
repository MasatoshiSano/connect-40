import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
export interface FrontendStackProps extends cdk.StackProps {
    envName: string;
    apiEndpoint: string;
    webSocketEndpoint: string;
}
export declare class FrontendStack extends cdk.Stack {
    readonly bucket: s3.Bucket;
    readonly distribution: cloudfront.CloudFrontWebDistribution;
    constructor(scope: Construct, id: string, props: FrontendStackProps);
}

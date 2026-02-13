import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface FrontendStackProps extends cdk.StackProps {
  envName: string;
  apiEndpoint: string;
  webSocketEndpoint: string;
}

export class FrontendStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.CloudFrontWebDistribution;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    // S3 Bucket for static website hosting
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `connect40-frontend-${props.envName}-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        props.envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.envName !== 'prod',
    });

    // CloudFront Distribution (Phase 6で詳細設定)
    // Placeholder: 基本的なCloudFront設定
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI');
    this.bucket.grantRead(originAccessIdentity);

    // Outputs
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.bucket.bucketName,
      exportName: `Connect40-FrontendBucketName-${props.envName}`,
    });
  }
}

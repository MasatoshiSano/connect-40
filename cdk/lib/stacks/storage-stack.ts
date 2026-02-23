import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.StackProps {
  envName: string;
}

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
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
      removalPolicy:
        props.envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.envName !== 'prod',
    });

    // Allow public GET for profile photos and activity images (not verification docs)
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.StarPrincipal()],
        actions: ['s3:GetObject'],
        resources: [
          `${this.bucket.bucketArn}/profile/*`,
          `${this.bucket.bucketArn}/activity/*`,
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      exportName: `Connect40-BucketName-${props.envName}`,
    });
  }
}

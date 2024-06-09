import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as deployment from "aws-cdk-lib/aws-s3-deployment";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { config } from "dotenv";

config();

const app = new cdk.App();

const stack = new cdk.Stack(app, "nodejsAwsAppStack", {
  env: {
    account: process.env.AWS_PROFILE,
    region: process.env.AWS_REGION,
  },
});

const bucket = new s3.Bucket(stack, "node.jsAwsAppBucket", {
  bucketName: "node.js-aws-app",
});

const originAccessIdentity = new cf.OriginAccessIdentity(
  stack,
  "node.jsAwsAppOAI",
  {
    comment: bucket.bucketName,
  }
);

bucket.grantRead(originAccessIdentity);

const distribution = new cf.Distribution(stack, "node.jsAwsAppDistribution", {
  defaultBehavior: {
    origin: new origins.S3Origin(bucket, {
      originAccessIdentity,
    }),
    viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  },

  defaultRootObject: "index.html",

  errorResponses: [
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: "/index.html",
    },
  ],
});

new deployment.BucketDeployment(stack, "node.jsAwsAppDeployment", {
  destinationBucket: bucket,
  sources: [deployment.Source.asset("./build")],
  distribution,
  distributionPaths: ["/*"],
});

new cdk.CfnOutput(stack, "node.jsAwsAppOutput", {
  value: distribution.distributionDomainName,
});

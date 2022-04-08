import * as path from 'path'
import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import MainConstruct, { MainConstructProps } from 'cld_deploy/context/main-construct'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'
import { LambdaFunctionType, S3BucketType } from 'cld_deploy/context/resource-types'
import * as iam from 'aws-cdk-lib/aws-iam'

export class UpdateLayerSourceConstruct extends MainConstruct {
  constructor(scope: Construct, id: string, props: MainConstructProps) {
    super(scope, id, props)
    const { context } = props

    const func = new lambdaNodeJs.NodejsFunction(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: path.join(__dirname, 'function/src/index.js'),
      handler: 'handler',
      functionName: 'CdkLambdaDeployer_UpdateLayerSource',
      timeout: cdk.Duration.minutes(10),
      allowPublicSubnet: true,
    })

    const stageBucketArn = context.getS3Bucket(S3BucketType.STAGE).bucketArn
    const prodBucketArn = context.getS3Bucket(S3BucketType.PROD).bucketArn

    const rolePolicies = [
      {
        Effect: 'Allow',
        Action: ['s3:ListBucket'], // Required to call listObjects
        Resource: [stageBucketArn, prodBucketArn],
      },
      {
        Effect: 'Allow',
        Action: ['s3:GetObject'],
        Resource: [prodBucketArn + '/updating_libs.lock'],
      },
      {
        Effect: 'Allow',
        Action: ['s3:GetObject'],
        Resource: [stageBucketArn + '/metadata.json'],
      },
      {
        Effect: 'Allow',
        Action: ['s3:GetObject'],
        Resource: [prodBucketArn + '/metadata.json'],
      },
      {
        Effect: 'Allow',
        Action: ['s3:GetObject'],
        Resource: [stageBucketArn + '/libs/*', prodBucketArn + '/libs/*'],
      },
      {
        Effect: 'Allow',
        Action: ['s3:PutObject'],
        Resource: [prodBucketArn + '/*'],
      },
      {
        Effect: 'Allow',
        Action: ['s3:DeleteObject'],
        Resource: [prodBucketArn + '/libs/*'],
      },
    ]
    rolePolicies.forEach((policy) => {
      func?.role?.addToPrincipalPolicy(iam.PolicyStatement.fromJson(policy))
    })

    context.setLambdaFunction(LambdaFunctionType.UPDATE_LIBS_SOURCE, func)
  }
}

import * as path from 'path'
import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'
import MainConstruct, { MainConstructProps } from 'cdk_lib/context/main-construct'
import { LambdaFunctionType, S3BucketType } from 'cdk_lib/context/resource-types'
import * as iam from 'aws-cdk-lib/aws-iam'

export class UpdateSourceConstruct extends MainConstruct {
  constructor(scope: Construct, id: string, props: MainConstructProps) {
    super(scope, id, props)
    const { context } = props

    const func = new lambdaNodeJs.NodejsFunction(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: path.join(__dirname, 'function/src/index.ts'),
      handler: 'handler',
      functionName: 'CdkLambdaDeployer_UpdateSource',
      timeout: cdk.Duration.minutes(10),
      vpc: context.getVpc(),
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
        Resource: [prodBucketArn + '/updating_functions.lock'],
      },
      {
        Effect: 'Allow',
        Action: ['s3:GetObject'],
        Resource: [stageBucketArn + '/functions/*', prodBucketArn + '/functions/*'],
      },
      {
        Effect: 'Allow',
        Action: ['s3:PutObject'],
        Resource: [prodBucketArn + '/*'],
      },
      {
        Effect: 'Allow',
        Action: ['s3:DeleteObject'],
        Resource: [prodBucketArn + '/functions/*'],
      },
    ]
    rolePolicies.forEach((policy) => {
      func?.role?.addToPrincipalPolicy(iam.PolicyStatement.fromJson(policy))
    })

    context.setLambdaFunction(LambdaFunctionType.DEPLOY_API_FUNCTIONS_UPDATE_SOURCE, func)
  }
}

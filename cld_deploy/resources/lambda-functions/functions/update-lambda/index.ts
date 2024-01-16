import * as path from 'path'
import MainConstruct, { MainConstructProps } from 'cld_deploy/context/main-construct'
import { Construct } from 'constructs'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as cdk from 'aws-cdk-lib'
import { LambdaFunctionType, S3BucketType } from 'cld_deploy/context/resource-types'

export class UpdateLambdaConstruct extends MainConstruct {
  constructor(scope: Construct, id: string, props: MainConstructProps) {
    super(scope, id, props)
    const { context } = props
    const { accountId } = context

    const prodBucketArn = context.getS3Bucket(S3BucketType.PROD).bucketArn

    const lambdaFunctionRole = createRoleForApi(this, 'UpdateLambdaFunctionRole')

    const func = new lambdaNodeJs.NodejsFunction(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, 'function/src/index.js'),
      handler: 'handler',
      functionName: 'CdkLambdaDeployer_UpdateLambda',
      timeout: cdk.Duration.minutes(10),
      allowPublicSubnet: true,
      environment: {
        LAMBDA_FUNCTION_ROLE: lambdaFunctionRole.roleArn,
      },
    })

    const rolePolicies = [
      {
        Effect: 'Allow',
        Action: ['s3:GetObject', 's3:GetObjectVersion'],
        Resource: [prodBucketArn + '/functions/*'],
      },
      {
        Effect: 'Allow',
        Action: ['s3:GetObject'],
        Resource: [prodBucketArn + '/metadata.json'],
      },
      {
        Effect: 'Allow',
        Action: ['s3:DeleteObject'],
        Resource: [prodBucketArn + '/updating_functions.lock'],
      },
      {
        Effect: 'Allow',
        Action: ['lambda:CreateFunction', 'lambda:UpdateFunctionCode', 'lambda:DeleteFunction'],
        Resource: [`arn:aws:lambda:us-west-1:${accountId}:function:*`], //TODO use function prefix from config
      },
      {
        Effect: 'Allow',
        Action: ['iam:PassRole'],
        Resource: [lambdaFunctionRole.roleArn],
      },
    ]
    rolePolicies.forEach((policy) => {
      func?.role?.addToPrincipalPolicy(iam.PolicyStatement.fromJson(policy))
    })

    context.setLambdaFunction(LambdaFunctionType.UPDATE_LAMBDA, func)
  }
}

function createRoleForApi(scope: Construct, id: string) {
  return new iam.Role(scope, id, {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
}

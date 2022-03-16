import * as path from 'path'
import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import MainConstruct, { MainConstructProps } from 'cld_deploy/context/main-construct'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'
import { LambdaFunctionType, S3BucketType } from 'cld_deploy/context/resource-types'
import * as iam from 'aws-cdk-lib/aws-iam'

export class UpdateLayerConstruct extends MainConstruct {
    constructor(scope: Construct, id: string, props: MainConstructProps) {
        super(scope, id, props)
        const { context } = props
        const { accountId } = context

        const prodBucketArn = context.getS3Bucket(S3BucketType.PROD).bucketArn

        const func = new lambdaNodeJs.NodejsFunction(this, 'Function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            entry: path.join(__dirname, 'function/src/index.ts'),
            handler: 'handler',
            functionName: 'CdkLambdaDeployer_UpdateLayer',
            timeout: cdk.Duration.minutes(10),
            vpc: context.getVpc(),
        })

        const rolePolicies = [
            {
                Effect: 'Allow',
                Action: ['s3:DeleteObject'],
                Resource: [prodBucketArn + '/updating_libs.lock'],
            },
            {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:GetObjectVersion'],
                Resource: [prodBucketArn + '/libs/*'],
            },
            {
                Effect: 'Allow',
                Action: ['s3:PutObject'],
                Resource: [prodBucketArn + '/libs/metadata.json'],
            },
            {
                Effect: 'Allow',
                Action: ['s3:GetObject'],
                Resource: [prodBucketArn + '/functions/metadata.json'],
            },
            {
                Effect: 'Allow',
                Action: ['lambda:PublishLayerVersion', 'lambda:GetLayerVersion'],
                Resource: [`arn:aws:lambda:us-west-1:${accountId}:layer:api*`],
            },
            {
                Effect: 'Allow',
                Action: ['lambda:UpdateFunctionConfiguration'],
                Resource: [`arn:aws:lambda:us-west-1:${accountId}:function:api*`],
            },
        ]

        rolePolicies.forEach((policy) => {
            func?.role?.addToPrincipalPolicy(iam.PolicyStatement.fromJson(policy))
        })

        context.setLambdaFunction(LambdaFunctionType.UPDATE_LAYER, func)
    }
}

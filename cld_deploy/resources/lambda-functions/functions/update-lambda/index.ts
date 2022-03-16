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

        //TODO: Externalize
        const customerApiRole = createRoleForApi(this, 'CustomerApiRole')
        const delivererApiRole = createRoleForApi(this, 'DelivererApiRole')
        const adminApiRole = createRoleForApi(this, 'AdminApiRole')

        const func = new lambdaNodeJs.NodejsFunction(this, 'Function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            entry: path.join(__dirname, 'function/src/index.ts'),
            handler: 'handler',
            functionName: 'CdkLambdaDeployer_UpdateLambda',
            timeout: cdk.Duration.minutes(10),
            vpc: context.getVpc(),
            environment: {
                CUSTOMER_API_ROLE: customerApiRole.roleArn,
                DELIVERER_API_ROLE: delivererApiRole.roleArn,
                ADMIN_API_ROLE: adminApiRole.roleArn,
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
                Action: ['s3:DeleteObject'],
                Resource: [prodBucketArn + '/updating_functions.lock'],
            },
            {
                Effect: 'Allow',
                Action: ['lambda:CreateFunction', 'lambda:UpdateFunctionCode', 'lambda:DeleteFunction'],
                Resource: [`arn:aws:lambda:us-west-1:${accountId}:function:api*`],
            },
            {
                Effect: 'Allow',
                Action: ['iam:PassRole'],
                Resource: [customerApiRole.roleArn, delivererApiRole.roleArn, adminApiRole.roleArn],
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

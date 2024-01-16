import * as path from 'path'
import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'
import MainConstruct, { MainConstructProps } from 'cld_deploy/context/main-construct'
import { LambdaFunctionType, S3BucketType } from 'cld_deploy/context/resource-types'
import * as iam from 'aws-cdk-lib/aws-iam'

export class InvokeLambdaConstruct extends MainConstruct {
  constructor(scope: Construct, id: string, props: MainConstructProps) {
    super(scope, id, props)
    const { context } = props

    const func = new lambdaNodeJs.NodejsFunction(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, 'function/src/index.js'),
      depsLockFilePath: '',
      handler: 'handler',
      functionName: 'CdkLambdaDeployer_InvokeLambda',
      timeout: cdk.Duration.minutes(1),
    })

    const rolePolicies = [
      {
        Effect: 'Allow',
        Action: ['lambda:InvokeFunction'], // Required to call listObjects
        Resource: '*',
      },
    ]
    rolePolicies.forEach((policy) => {
      func?.role?.addToPrincipalPolicy(iam.PolicyStatement.fromJson(policy))
    })

    context.setLambdaFunction(LambdaFunctionType.INVOKE_FUNCTION, func)
  }
}

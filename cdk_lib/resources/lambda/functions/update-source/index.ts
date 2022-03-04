import * as path from 'path'
import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'

export type CdkLibProps = {
  vpc: ec2.Vpc
}

export class UpdateSourceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CdkLibProps) {
    super(scope, id)
    const { vpc } = props
    new lambdaNodeJs.NodejsFunction(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: path.join(__dirname, 'lambda/function.ts'),
      handler: 'handler',
      functionName: 'CdkLambdaDeployer_UpdateSource',
      timeout: cdk.Duration.minutes(10),
      vpc,
    })
  }
}

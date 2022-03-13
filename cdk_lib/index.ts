import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'
import Context from './context/index'
import { AppName } from './context/app'
import { S3BucketsConstruct } from './resources/s3-buckets/index'
import { LambdaFunctionsConstruct } from './resources/lambda-functions'

export type CDKLambdaDeployerConstructProps = {
  vpc: ec2.Vpc
}

export class CDKLambdaDeployerConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CDKLambdaDeployerConstructProps) {
    super(scope, id)
    const { vpc } = props
    const context = new Context(AppName.DEFAULT)
    context.setVpc(vpc)
    new S3BucketsConstruct(this, 'S3Buckets', { context })
    new LambdaFunctionsConstruct(this, 'LambdaFunctions', { context })
  }
}

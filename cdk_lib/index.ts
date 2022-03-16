import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'
import Context from './context/index'
import { AppName } from './context/app'
import { S3BucketsConstruct } from './resources/s3-buckets/index'
import { LambdaFunctionsConstruct } from './resources/lambda-functions'
import { Stack } from 'aws-cdk-lib'
import { CodeBuildProjectsConstruct } from 'cdk_lib/resources/code-build-projects'

export type CDKLambdaDeployerProps = {
  vpc?: ec2.Vpc
  vpcId?: string
}

export class CDKLambdaDeployerStack extends Stack {
  constructor(scope: Construct, id: string, props: CDKLambdaDeployerProps) {
    super(scope, id)
    if (!props.vpc && !props.vpcId) {
      throw new Error('You have to specify either the vpc or vpcId param.')
    }
    new CDKLambdaDeployerConstruct(this, 'CDKLambdaDeployer', props)
  }
}

export class CDKLambdaDeployerConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CDKLambdaDeployerProps) {
    super(scope, id)
    const { vpc, vpcId } = props
    const context = new Context(AppName.DEFAULT)
    context.setVpc(vpc || (ec2.Vpc.fromLookup(this, 'Vpc', { vpcId }) as ec2.Vpc))
    new S3BucketsConstruct(this, 'S3Buckets', { context })
    new CodeBuildProjectsConstruct(this, 'CodeBuildProjects', { context })
    new LambdaFunctionsConstruct(this, 'LambdaFunctions', { context })
  }
}

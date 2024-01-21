import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'
import Context from './context/index'
import { AppName } from './context/app'
import { S3BucketsConstruct } from './resources/s3-buckets/index'
import { LambdaFunctionsConstruct } from './resources/lambda-functions'
import { Stack, StackProps } from 'aws-cdk-lib'
import { CodeBuildProjectsConstruct } from 'cld_deploy/resources/code-build-projects'
import { CodePipelinesConstruct } from 'cld_deploy/resources/code-pipelines'
import { ApiGatewaysConstruct } from 'cld_deploy/resources/api-gateways'

export type CDKLambdaDeployerProps = {
  githubRepoOwner: string
  githubRepoName: string
  githubRepoSubFolder?: string
  cldOutputFolder: string
  githubRepoBranch?: string
  githubTokenSecretId: string
  lambdaSubnetIds?: ec2.ISubnet[]
  lambdaSecurityGroups?: ec2.SecurityGroup[]
}

export type CDKLambdaDeployerStackProps = StackProps & CDKLambdaDeployerProps

export class CDKLambdaDeployerStack extends Stack {
  constructor(scope: Construct, id: string, props: CDKLambdaDeployerStackProps) {
    super(scope, id, props)
    new CDKLambdaDeployerConstruct(this, 'CDKLambdaDeployer', props)
  }
}

export class CDKLambdaDeployerConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CDKLambdaDeployerProps) {
    super(scope, id)
    const {
      githubRepoOwner,
      githubRepoName,
      githubRepoSubFolder,
      cldOutputFolder,
      githubRepoBranch,
      githubTokenSecretId,
      lambdaSubnetIds,
      lambdaSecurityGroups,
    } = props
    const context = new Context(AppName.DEFAULT)
    new S3BucketsConstruct(this, 'S3Buckets', { context })
    new LambdaFunctionsConstruct(this, 'LambdaFunctions', { context })
    new CodeBuildProjectsConstruct(this, 'CodeBuildProjects', {
      context,
      cldOutputFolder,
      githubRepoSubFolder,
      subnetIds: lambdaSubnetIds ?? [],
      securityGroupIds: lambdaSecurityGroups?.map((group) => group.securityGroupId) ?? [],
    })
    new CodePipelinesConstruct(this, 'CodePipelines', {
      context,
      githubRepoOwner,
      githubRepoName,
      githubRepoBranch,
      githubTokenSecretId,
    })
    new ApiGatewaysConstruct(this, 'ApiGateways', { context })
  }
}

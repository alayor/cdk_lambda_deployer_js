import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as rds from 'aws-cdk-lib/aws-rds'
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
  lambdaSubnets?: ec2.ISubnet[]
  lambdaSecurityGroups?: ec2.SecurityGroup[]
  rdsDatabaseProxy?: rds.DatabaseProxy
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
      lambdaSubnets,
      lambdaSecurityGroups,
      rdsDatabaseProxy,
    } = props
    const context = new Context(AppName.DEFAULT)
    new S3BucketsConstruct(this, 'S3Buckets', { context })
    new LambdaFunctionsConstruct(this, 'LambdaFunctions', { context })
    new CodeBuildProjectsConstruct(this, 'CodeBuildProjects', {
      context,
      cldOutputFolder,
      githubRepoSubFolder,
      subnets: lambdaSubnets ?? [],
      securityGroupIds: lambdaSecurityGroups?.map((group) => group.securityGroupId) ?? [],
      databaseProxyName: rdsDatabaseProxy?.dbProxyName ?? '',
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

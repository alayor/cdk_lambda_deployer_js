import MainConstruct, { MainConstructProps } from 'cld_deploy/context/main-construct'
import { Construct } from 'constructs'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import {
  CodeBuildProjectType,
  LambdaFunctionType,
  S3BucketType,
} from 'cld_deploy/context/resource-types'
import * as iam from 'aws-cdk-lib/aws-iam'
import { ISubnet } from 'aws-cdk-lib/aws-ec2'

export type CodeBuildProjectsConstructProps = MainConstructProps & {
  githubRepoSubFolder?: string
  cldOutputFolder: string
  subnets: ISubnet[]
  securityGroupIds: string[]
  databaseProxyName?: string
}

export class CodeBuildProjectsConstruct extends MainConstruct {
  constructor(scope: Construct, id: string, props: CodeBuildProjectsConstructProps) {
    super(scope, id, props)
    const {
      context,
      cldOutputFolder,
      githubRepoSubFolder,
      subnets,
      securityGroupIds,
      databaseProxyName,
    } = props
    const updateSourceFunction = context.getLambdaFunction(
      LambdaFunctionType.UPDATE_FUNCTIONS_SOURCE,
    )
    const updateLambdaFunction = context.getLambdaFunction(LambdaFunctionType.UPDATE_LAMBDA)
    const updateSourceLayer = context.getLambdaFunction(LambdaFunctionType.UPDATE_LIBS_SOURCE)
    const updateLayer = context.getLambdaFunction(LambdaFunctionType.UPDATE_LAYER)
    const prodBucket = context.getS3Bucket(S3BucketType.PROD)
    const stageBucket = context.getS3Bucket(S3BucketType.STAGE)

    const s3BucketNames = {
      prodBucketName: prodBucket.bucketName,
      stageBucketName: stageBucket.bucketName,
    }

    const updateSourceFunctionPayload = JSON.stringify({
      body: {
        ...s3BucketNames,
      },
    })

    const updateLambdaFunctionPayload = JSON.stringify({
      body: {
        ...s3BucketNames,
        subnetIds: subnets.map((s) => s.subnetId),
        securityGroupIds: [securityGroupIds.join(',')],
        databaseProxyName,
      },
    })

    const updateSourceLayerPayload = JSON.stringify({
      body: {
        ...s3BucketNames,
      },
    })

    const updateLayerPayload = JSON.stringify({
      body: {
        ...s3BucketNames,
      },
    })

    const codeBuildProject = new codebuild.PipelineProject(this, 'Project', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            ['runtime-versions']: {
              nodejs: 20,
            },
          },
          build: {
            commands: [
              'node --version',
              'ls -la',
              `cd ${githubRepoSubFolder ? githubRepoSubFolder : '.'}`,
              'npm install',
              'npm install -g typescript',
              'tsc',
              'node ./node_modules/.bin/cld_build',
              `aws s3 sync --only-show-errors --delete ${cldOutputFolder} s3://${stageBucket.bucketName}/`,
              `aws lambda invoke --function-name ${updateSourceFunction.functionName} --cli-binary-format raw-in-base64-out --payload '${updateSourceFunctionPayload} response.json`,
              `aws lambda invoke --function-name ${updateLambdaFunction.functionName} --cli-binary-format raw-in-base64-out --payload '${updateLambdaFunctionPayload}' response.json`,
              `aws lambda invoke --function-name ${updateSourceLayer.functionName} --cli-binary-format raw-in-base64-out --payload '${updateSourceLayerPayload} response.json`,
              `aws lambda invoke --function-name ${updateLayer.functionName} --cli-binary-format raw-in-base64-out --payload '${updateLayerPayload} response.json`,
            ],
          },
        },
      }),
    })

    const bucketArn = stageBucket.bucketArn
    const s3Policies = [
      {
        Effect: 'Allow',
        Action: ['s3:ListBucket'],
        Resource: [bucketArn],
      },
      {
        Effect: 'Allow',
        Action: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
        Resource: [bucketArn + '/*'],
      },
    ]
    s3Policies.forEach((policy) => {
      codeBuildProject?.role?.addToPrincipalPolicy(iam.PolicyStatement.fromJson(policy))
    })
    updateSourceFunction.grantInvoke(codeBuildProject)
    updateLambdaFunction.grantInvoke(codeBuildProject)
    updateSourceLayer.grantInvoke(codeBuildProject)
    updateLayer.grantInvoke(codeBuildProject)

    context.setCodeBuildProject(CodeBuildProjectType.DEPLOY, codeBuildProject)
  }
}

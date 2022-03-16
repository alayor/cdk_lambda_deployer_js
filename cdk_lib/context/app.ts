import * as ec2 from 'aws-cdk-lib/aws-ec2'
import {
  CodeBuildProjectType,
  LambdaFunctionType,
  S3BucketType,
} from 'cdk_lib/context/resource-types'
import { AppResourceAlreadySetError, AppResourceNotSetError } from 'cdk_lib/context/errors'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'

export enum AppName {
  DEFAULT,
}

export interface IApp {
  setVpc(vpc: ec2.Vpc): void
  getVpc(): ec2.Vpc
  setS3Bucket(type: S3BucketType, s3Bucket: s3.Bucket): void
  getS3Bucket(type: S3BucketType): s3.Bucket
  setCodeBuildProject(type: CodeBuildProjectType, project: codebuild.PipelineProject): void
  getCodeBuildProject(type: CodeBuildProjectType): codebuild.PipelineProject
  setLambdaFunction(type: LambdaFunctionType, fn: lambdaNodeJs.NodejsFunction): void
  getLambdaFunction(type: LambdaFunctionType): lambdaNodeJs.NodejsFunction
}

export class AppModel implements IApp {
  private _vpc: ec2.Vpc
  private _s3Buckets: Map<S3BucketType, s3.Bucket>
  private _codeBuildProjects: Map<CodeBuildProjectType, codebuild.PipelineProject>
  private _lambdaFunctions: Map<LambdaFunctionType, lambdaNodeJs.NodejsFunction>

  constructor() {
    this._s3Buckets = new Map<S3BucketType, s3.Bucket>()
    this._codeBuildProjects = new Map<CodeBuildProjectType, codebuild.PipelineProject>()
    this._lambdaFunctions = new Map<LambdaFunctionType, lambdaNodeJs.NodejsFunction>()
  }

  setVpc(vpc: ec2.Vpc): void {
    if (this._vpc) {
      throw new AppResourceAlreadySetError('VPC')
    }
    this._vpc = vpc
  }

  getVpc(): ec2.Vpc {
    if (!this._vpc) {
      throw new AppResourceNotSetError('VPC')
    }
    return this._vpc
  }

  setS3Bucket(type: S3BucketType, s3Bucket: s3.Bucket): void {
    if (this._s3Buckets.get(type)) {
      throw new AppResourceAlreadySetError('S3 Bucket', S3BucketType[type])
    }
    this._s3Buckets.set(type, s3Bucket)
  }

  getS3Bucket(type: S3BucketType): s3.Bucket {
    const s3Bucket = this._s3Buckets.get(type)
    if (!s3Bucket) {
      throw new AppResourceNotSetError('S3 Bucket', S3BucketType[type])
    }
    return s3Bucket
  }

  setCodeBuildProject(type: CodeBuildProjectType, project: codebuild.PipelineProject): void {
    if (this._codeBuildProjects.get(type)) {
      throw new AppResourceAlreadySetError('CodeBuild Project', CodeBuildProjectType[type])
    }
    this._codeBuildProjects.set(type, project)
  }

  getCodeBuildProject(type: CodeBuildProjectType): codebuild.PipelineProject {
    const project = this._codeBuildProjects.get(type)
    if (!project) {
      throw new AppResourceNotSetError('CodeBuild Project', CodeBuildProjectType[type])
    }
    return project
  }

  setLambdaFunction(type: LambdaFunctionType, project: lambdaNodeJs.NodejsFunction): void {
    if (this._lambdaFunctions.get(type)) {
      throw new AppResourceAlreadySetError('Lambda Function', LambdaFunctionType[type])
    }
    this._lambdaFunctions.set(type, project)
  }

  getLambdaFunction(type: LambdaFunctionType): lambdaNodeJs.NodejsFunction {
    const fn = this._lambdaFunctions.get(type)
    if (!fn) {
      throw new AppResourceNotSetError('Lambda Function', LambdaFunctionType[type])
    }
    return fn
  }
}

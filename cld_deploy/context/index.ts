import * as s3 from 'aws-cdk-lib/aws-s3'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import {
  CodeBuildProjectType,
  LambdaFunctionType,
  S3BucketType,
} from 'cld_deploy/context/resource-types'
import { AppModel, AppName, IApp } from 'cld_deploy/context/app'
import { AppResourceNotSetError } from 'cld_deploy/context/errors'

export default class Context implements IApp {
  private _defaultApp: AppName
  private _apps: Map<AppName, AppModel>

  constructor(defaultApp: AppName) {
    this._defaultApp = defaultApp
    this._apps = new Map<AppName, AppModel>()
    this._apps.set(AppName.DEFAULT, new AppModel())
  }

  get accountId() {
    return process.env.CDK_DEFAULT_ACCOUNT
  }

  getApp(name: AppName): AppModel {
    const app = this._apps.get(name)
    if (!app) {
      throw new AppResourceNotSetError('App')
    }
    return app
  }

  setS3Bucket(type: S3BucketType, s3Bucket: s3.Bucket): void {
    this.getApp(this._defaultApp).setS3Bucket(type, s3Bucket)
  }

  getS3Bucket(type: S3BucketType): s3.Bucket {
    return this.getApp(this._defaultApp).getS3Bucket(type)
  }

  setCodeBuildProject(type: CodeBuildProjectType, project: codebuild.PipelineProject): void {
    this.getApp(this._defaultApp).setCodeBuildProject(type, project)
  }

  getCodeBuildProject(type: CodeBuildProjectType): codebuild.PipelineProject {
    return this.getApp(this._defaultApp).getCodeBuildProject(type)
  }

  setLambdaFunction(type: LambdaFunctionType, project: lambdaNodeJs.NodejsFunction): void {
    this.getApp(this._defaultApp).setLambdaFunction(type, project)
  }

  getLambdaFunction(type: LambdaFunctionType): lambdaNodeJs.NodejsFunction {
    return this.getApp(this._defaultApp).getLambdaFunction(type)
  }
}

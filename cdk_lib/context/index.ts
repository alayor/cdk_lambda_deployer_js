import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'
import {
  LambdaFunctionType,
  S3BucketType,
} from 'cdk_lib/context/resource-types'
import { AppModel, AppName, IApp } from 'cdk_lib/context/app'
import { AppResourceNotSetError } from 'cdk_lib/context/errors'

export default class Context implements IApp {
  private _defaultApp: AppName
  private _apps: Map<AppName, AppModel>

  constructor(defaultApp: AppName) {
    this._defaultApp = defaultApp
    this._apps = new Map<AppName, AppModel>()
    this._apps.set(AppName.MARKET_C2C, new AppModel())
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

  setVpc(vpc: ec2.Vpc) {
    this.getApp(this._defaultApp).setVpc(vpc)
  }

  getVpc() {
    return this.getApp(this._defaultApp).getVpc()
  }

  setS3Bucket(type: S3BucketType, s3Bucket: s3.Bucket): void {
    this.getApp(this._defaultApp).setS3Bucket(type, s3Bucket)
  }

  getS3Bucket(type: S3BucketType): s3.Bucket {
    return this.getApp(this._defaultApp).getS3Bucket(type)
  }

  setLambdaFunction(type: LambdaFunctionType, project: lambdaNodeJs.NodejsFunction): void {
    this.getApp(this._defaultApp).setLambdaFunction(type, project)
  }

  getLambdaFunction(type: LambdaFunctionType): lambdaNodeJs.NodejsFunction {
    return this.getApp(this._defaultApp).getLambdaFunction(type)
  }
}

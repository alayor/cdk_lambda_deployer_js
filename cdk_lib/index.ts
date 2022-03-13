import { Construct } from 'constructs'
import Context from './context/index'
import { AppName } from './context/app'
import { S3BucketsConstruct } from './resources/s3-buckets/index'
import { LambdaFunctionsConstruct } from './resources/lambda-functions'

export class CDKLambdaDeployerConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id)
    const context = new Context(AppName.DEFAULT)
    new S3BucketsConstruct(this, 'S3Buckets', { context })
    new LambdaFunctionsConstruct(this, 'LambdaFunctions', { context })
  }
}

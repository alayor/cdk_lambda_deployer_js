import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import MainConstruct, { MainConstructProps } from 'cdk_lib/context/main-construct'
import {Duration, RemovalPolicy} from 'aws-cdk-lib'
import { S3BucketType } from 'cdk_lib/context/resource-types'

export class BucketConstruct extends MainConstruct {
  constructor(scope: Construct, id: string, props: MainConstructProps) {
    super(scope, id, props)
    const { context } = props

    const stageBucket = new s3.Bucket(this, 'StageBucket', {
      bucketName: 'minisuper-api-functions-stage',
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      lifecycleRules: [{
        noncurrentVersionExpiration: Duration.days(15)
      }]
    })

    const prodBucket = new s3.Bucket(this, 'Bucket', {
      bucketName: 'minisuper-api-functions',
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      lifecycleRules: [{
        noncurrentVersionExpiration: Duration.days(15)
      }]
    })

    context.setS3Bucket(S3BucketType.STAGE, stageBucket)
    context.setS3Bucket(S3BucketType.PROD, prodBucket)
  }
}

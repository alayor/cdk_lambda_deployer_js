import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import MainConstruct, { MainConstructProps } from 'cld_deploy/context/main-construct'
import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import { S3BucketType } from 'cld_deploy/context/resource-types'

export class S3BucketsConstruct extends MainConstruct {
  constructor(scope: Construct, id: string, props: MainConstructProps) {
    super(scope, id, props)
    const { context } = props

    const stageBucket = new s3.Bucket(this, 'StageBucket', {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: Duration.days(15),
        },
      ],
    })

    const prodBucket = new s3.Bucket(this, 'Bucket', {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: Duration.days(15),
        },
      ],
    })

    context.setS3Bucket(S3BucketType.STAGE, stageBucket)
    context.setS3Bucket(S3BucketType.PROD, prodBucket)
  }
}

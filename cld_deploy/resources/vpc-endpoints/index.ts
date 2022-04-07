import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import MainConstruct, { MainConstructProps } from 'cld_deploy/context/main-construct'
import * as iam from 'aws-cdk-lib/aws-iam'
import { S3BucketType } from 'cld_deploy/context/resource-types'

export class VpcEndpointsConstruct extends MainConstruct {
  constructor(scope: Construct, id: string, props: MainConstructProps) {
    super(scope, id, props)
    const { context } = props
    const stageBucketArn = context.getS3Bucket(S3BucketType.STAGE).bucketArn
    const prodBucketArn = context.getS3Bucket(S3BucketType.PROD).bucketArn

    const vpcEndpoint = new ec2.GatewayVpcEndpoint(this, 'S3GatewayVpcEndpoint', {
      vpc: context.getVpc(),
      service: { name: 'com.amazonaws.us-west-1.s3' },
    })

    const rolePolicies = [
      {
        Sid: 'AccessToSpecificBucket',
        Effect: 'Allow',
        Action: [
          's3:ListBucket',
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:GetObjectVersion',
        ],
        Resource: [stageBucketArn, prodBucketArn, stageBucketArn + '/*', prodBucketArn + '/*'],
        Principal: '*',
      },
    ]
    rolePolicies.forEach((policy) => {
      vpcEndpoint.addToPolicy(iam.PolicyStatement.fromJson(policy))
    })
  }
}

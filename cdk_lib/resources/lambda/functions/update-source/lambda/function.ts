import * as aws from 'aws-sdk'

let s3: aws.S3

export async function handler(_event: any) {
  if (!s3) {
    s3 = new aws.S3({ apiVersion: '2006-03-01' })
  }
  return await s3.getObject({Bucket: '', Key: ''}).promise()
}

import * as aws from 'aws-sdk'
import { LOCK_FILE, PROD_BUCKET } from './constants'

let s3: aws.S3

export async function handler(_event: any) {
  if (!s3) {
    s3 = new aws.S3({ apiVersion: '2006-03-01' })
  }
  if (await isLocked()) {

  }
}

async function isLocked(): Promise<boolean> {
  try {
    await s3.getObject({ Bucket: PROD_BUCKET, Key: LOCK_FILE }).promise()
    return true
  } catch (err: any) {
    if (err.code === 'NoSuchKey') {
      return false
    }
    throw err
  }
}

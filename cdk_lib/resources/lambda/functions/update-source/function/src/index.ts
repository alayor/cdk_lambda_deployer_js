import * as aws from 'aws-sdk'
import { LOCK_FILE, PROD_BUCKET } from './constants'
import { getFunctionsMetadata } from './metadata_util/get_metadata'

let s3: aws.S3

export async function handler(_event: any) {
  if (!s3) {
    s3 = new aws.S3({ apiVersion: '2006-03-01' })
  }
  if (await isLocked()) {
    console.error(
      `The current deploying process has not finished or it failed as 
 the file update_in_progress.lock still exists in ${PROD_BUCKET} bucket.`,
    )
    return
  }
  const { stageMetadata, prodMetadata } = await getFunctionsMetadata(s3)
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

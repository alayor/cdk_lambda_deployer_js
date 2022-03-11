import * as aws from 'aws-sdk'
import {
  FUNCTIONS_METADATA_FILE_NAME,
  LIBS_CHANGES_SUMMARY_FILE_NAME,
  LIBS_METADATA_FILE_NAME,
  PROD_BUCKET,
} from './constants'
import { hasLayerVersionsChanges, hasSummaryChanges } from './preconditions_util'

let s3: aws.S3

export async function handler(event: any) {
  if (!s3) {
    s3 = new aws.S3({ apiVersion: '2006-03-01' })
  }
  const changesSummary = await getS3File(LIBS_CHANGES_SUMMARY_FILE_NAME)
  if (!hasSummaryChanges(changesSummary)) {
    console.log('No changes detected in summary.')
    return
  }
  const libsMetadata = await getS3File(LIBS_METADATA_FILE_NAME)
  const hasLayerVersionChanges = await hasLayerVersionsChanges(libsMetadata)
  if (!hasLayerVersionChanges && !event.forceUpdate) {
    console.log('No new layer versions detected.')
    return
  }
  const functionsMetadata = await getS3File(FUNCTIONS_METADATA_FILE_NAME)
}

async function getS3File(key: string) {
  const file = await s3.getObject({ Bucket: PROD_BUCKET, Key: key }).promise()
  return JSON.parse(file.Body?.toString() ?? '{}')
}

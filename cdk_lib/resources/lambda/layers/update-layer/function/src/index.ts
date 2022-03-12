import * as aws from 'aws-sdk'
import {
  FUNCTIONS_METADATA_FILE_NAME,
  LIBS_CHANGES_SUMMARY_FILE_NAME,
  LIBS_METADATA_FILE_NAME,
  PROD_BUCKET,
} from './constants'
import { hasLayerVersionsChanges, hasSummaryChanges } from './preconditions_util'
import { publishLayerVersions } from './layer_updater'
import { saveLayerVersions } from './metadata_util/save_metadata'

let s3: aws.S3
let lambda: aws.Lambda

export async function handler(event: any) {
  if (!s3) {
    s3 = new aws.S3({ apiVersion: '2006-03-01' })
  }
  if (!lambda) {
    lambda = new aws.Lambda({ apiVersion: '2015-03-31' })
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
  console.log('changesSummary: ', JSON.stringify(changesSummary, null, 2))
  console.log('libsMetadata: ', JSON.stringify(libsMetadata, null, 2))
  console.log('functionsMetadata: ', JSON.stringify(functionsMetadata, null, 2))
  const layerVersions = await publishLayerVersions(lambda, changesSummary, libsMetadata)
  await saveLayerVersions(s3, libsMetadata, layerVersions)
}

async function getS3File(key: string) {
  const file = await s3.getObject({ Bucket: PROD_BUCKET, Key: key }).promise()
  return JSON.parse(file.Body?.toString() ?? '{}')
}

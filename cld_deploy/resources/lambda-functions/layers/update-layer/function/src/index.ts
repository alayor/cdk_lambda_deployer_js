import * as aws from 'aws-sdk'
import { METADATA_FILE_NAME, LIBS_CHANGES_SUMMARY_FILE_NAME, LOCK_FILE } from './constants'
import { hasLayerVersionsChanges, hasSummaryChanges } from './preconditions_util'
import { publishLayerVersions, updateFunctionsLayers } from './layer_updater'
import { saveLayerVersions } from './metadata_util/save_metadata'
import { Metadata } from './types'

let s3: aws.S3
let lambda: aws.Lambda

export async function handler(event: any, context?: any) {
  if (!s3) {
    s3 = new aws.S3({ apiVersion: '2006-03-01' })
  }
  if (!lambda) {
    lambda = new aws.Lambda({ apiVersion: '2015-03-31' })
  }
  const { prodBucketName } = event.body
  const changesSummary = await getS3File(LIBS_CHANGES_SUMMARY_FILE_NAME, prodBucketName)
  if (!hasSummaryChanges(changesSummary)) {
    console.log('No changes detected in summary.')
    return
  }
  const metadata = (await getS3File(METADATA_FILE_NAME, prodBucketName)) as Metadata
  const hasLayerVersionChanges = await hasLayerVersionsChanges(metadata.libs)
  if (!hasLayerVersionChanges && !event.forceUpdate) {
    console.log('No new layer versions detected.')
    return
  }
  console.log('changesSummary: ', JSON.stringify(changesSummary, null, 2))
  console.log('libsMetadata: ', JSON.stringify(metadata, null, 2))
  console.log('functionsMetadata: ', JSON.stringify(metadata.functions, null, 2))
  const layerVersions = await publishLayerVersions(lambda, changesSummary, metadata, prodBucketName)
  await saveLayerVersions(s3, metadata, layerVersions, prodBucketName)
  const awsAccountId = (context?.invokedFunctionArn ?? '').split(':')[4]
  await updateFunctionsLayers(lambda, changesSummary, metadata, awsAccountId)

  console.log('layerVersions: ', JSON.stringify(layerVersions, null, 2))
  await deleteLock(prodBucketName)
  console.log('Done.')
}

async function getS3File(key: string, prodBucketName: string) {
  const file = await s3.getObject({ Bucket: prodBucketName, Key: key }).promise()
  return JSON.parse(file.Body?.toString() ?? '{}')
}

async function deleteLock(prodBucketName: string) {
  try {
    await s3
      .deleteObject({
        Bucket: prodBucketName,
        Key: LOCK_FILE,
      })
      .promise()
  } catch (err: any) {
    if (err.code === 'NoSuchKey') {
      console.log(`File not found: ${LOCK_FILE}`)
    }
    throw err
  }
}

import * as aws from 'aws-sdk'
import { LOCK_FILE } from './constants'
import { getLibsMetadata, getLibsToUpdate } from './metadata_util/get_metadata'
import { updateLayerSources } from './layer_source_update/index'
import { saveNewMetadata } from './metadata_util/save_metadata'

let s3: aws.S3

export async function handler(event: any) {
  const { stageBucketName, prodBucketName } = event.body
  if (!s3) {
    s3 = new aws.S3({ apiVersion: '2006-03-01' })
  }
  if (await isLocked(prodBucketName)) {
    console.error(
      `The current deploying process has not finished or it failed as 
 the file ${LOCK_FILE} still exists in ${prodBucketName} bucket.`,
    )
    return
  }
  const { stageMetadata, prodMetadata } = await getLibsMetadata(s3, stageBucketName, prodBucketName)
  const libsToUpdate = getLibsToUpdate(stageMetadata, prodMetadata)
  if (!libsToUpdate.length) {
    console.log('No changes detected.')
    return
  }
  console.log('stageMetadata: ', JSON.stringify(stageMetadata, null, 2))
  console.log('prodMetadata: ', JSON.stringify(prodMetadata, null, 2))
  console.log('libsToUpdate: ', JSON.stringify(libsToUpdate, null, 2))
  const newVersions = await updateLayerSources(s3, libsToUpdate, stageBucketName, prodBucketName)
  await saveNewMetadata(s3, prodBucketName, stageMetadata, prodMetadata, newVersions)
  console.log('Done.')
}

async function isLocked(prodBucketName: string): Promise<boolean> {
  try {
    await s3.getObject({ Bucket: prodBucketName, Key: LOCK_FILE }).promise()
    return true
  } catch (err: any) {
    if (err.code === 'NoSuchKey') {
      return false
    }
    throw err
  }
}

import * as aws from 'aws-sdk'
import { LOCK_FILE, PROD_BUCKET } from './constants'
import { getLibsMetadata, getLibsToUpdate } from './metadata_util/get_metadata'
import { updateLayerSources } from './layer_source_update/index'
import { saveNewMetadata } from './metadata_util/save_metadata'

let s3: aws.S3

export async function handler(_event: any) {
  if (!s3) {
    s3 = new aws.S3({ apiVersion: '2006-03-01' })
  }
  if (await isLocked()) {
    console.error(
      `The current deploying process has not finished or it failed as 
 the file ${LOCK_FILE} still exists in ${PROD_BUCKET} bucket.`,
    )
    return
  }
  const { stageMetadata, prodMetadata } = await getLibsMetadata(s3)
  const libsToUpdate = getLibsToUpdate(stageMetadata, prodMetadata)
  if (!libsToUpdate.length) {
    console.log('No changes detected.')
    return
  }
  console.log('stageMetadata: ', JSON.stringify(stageMetadata, null, 2))
  console.log('prodMetadata: ', JSON.stringify(prodMetadata, null, 2))
  console.log('libsToUpdate: ', JSON.stringify(libsToUpdate, null, 2))
  const newVersions = await updateLayerSources(s3, libsToUpdate)
  await saveNewMetadata(s3, stageMetadata, prodMetadata, newVersions)
  console.log('Done.')
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

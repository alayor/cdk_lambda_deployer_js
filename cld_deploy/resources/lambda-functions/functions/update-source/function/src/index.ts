import * as aws from 'aws-sdk'
import { LOCK_FILE, PROD_BUCKET } from './constants'
import { getMetadata } from './metadata_util/get_metadata'
import { saveNewMetadata } from './metadata_util/save_metadata'
import { createFunctionSource } from './change_handlers/create_function_source'
import { updateFunctionSource } from './change_handlers/update_function_source'
import { deleteFunctionSource } from './change_handlers/delete_function_source'
import ChangesSummary from './changes_summary'

let s3: aws.S3

export async function handler(_event: any) {
  if (!s3) {
    s3 = new aws.S3({ apiVersion: '2006-03-01' })
  }
  if (await isLocked()) {
    console.warn(
      `The current deploying process has not finished or it failed as 
 the file update_in_progress.lock still exists in ${PROD_BUCKET} bucket.`,
    )
    return
  }
  const { stageMetadata, prodMetadata } = await getMetadata(s3)
  const changesSummary = new ChangesSummary()
  await createFunctionSource(s3, stageMetadata, prodMetadata, changesSummary)
  await updateFunctionSource(s3, stageMetadata, prodMetadata, changesSummary)
  await deleteFunctionSource(s3, stageMetadata, prodMetadata, changesSummary)

  console.log('changesSummary: ', changesSummary.getChangesSummary())
  if (!changesSummary.hasChanges()) {
    console.log('No changes detected.')
    return
  }
  await saveNewMetadata(s3, stageMetadata, prodMetadata, changesSummary)
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

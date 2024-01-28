import * as aws from 'aws-sdk'
import {
  FUNCTIONS_CHANGES_SUMMARY_FILE_NAME,
  METADATA_FILE_NAME,
  LOCK_FILE,
  PROD_BUCKET,
} from './constants'
import { ChangesSummary, Metadata } from './types'
import { createFunctions } from './change_handlers/create_function'
import { updateFunctions } from './change_handlers/update_function'
import { deleteFunctions } from './change_handlers/delete_function'

let s3: aws.S3
let lambda: aws.Lambda

export async function handler(event: any) {
  if (!s3) {
    s3 = new aws.S3({ apiVersion: '2006-03-01' })
  }
  if (!lambda) {
    lambda = new aws.Lambda({ apiVersion: '2015-03-31' })
  }
  const { subnetIds, securityGroupIds, databaseProxyName } = event?.body ?? {}
  const changesSummary = await getS3File(FUNCTIONS_CHANGES_SUMMARY_FILE_NAME)
  if (!hasChanges(changesSummary)) {
    console.log('No changes detected.')
    return
  }
  const metadata = (await getS3File(METADATA_FILE_NAME)) as Metadata
  console.log({
    changesSummary: JSON.stringify(changesSummary),
    metadata: JSON.stringify(metadata),
  })
  await createFunctions(
    lambda,
    metadata.functions,
    changesSummary,
    subnetIds,
    securityGroupIds,
    databaseProxyName,
  )
  await updateFunctions(lambda, metadata.functions, changesSummary)
  await deleteFunctions(lambda, metadata.functions, changesSummary)
  await deleteLock()
  console.log('Done.')
}

function hasChanges(changesSummary: ChangesSummary): boolean {
  const { changes } = changesSummary
  const createChanges = changes?.create
  const updateChanges = changes?.update
  const deleteChanges = changes?.delete
  const hasCreateChanges = createChanges && Object.keys(createChanges).length
  const hasUpdateChanges = updateChanges && Object.keys(updateChanges).length
  const hasDeleteChanges = deleteChanges && Object.keys(deleteChanges).length

  return !!(hasCreateChanges || hasUpdateChanges || hasDeleteChanges)
}

async function getS3File(key: string) {
  const versionChangesFile = await s3.getObject({ Bucket: PROD_BUCKET, Key: key }).promise()
  return JSON.parse(versionChangesFile.Body?.toString() ?? '{}')
}

async function deleteLock() {
  try {
    await s3
      .deleteObject({
        Bucket: PROD_BUCKET,
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

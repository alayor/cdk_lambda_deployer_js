import * as aws from 'aws-sdk'
import {
  FUNCTIONS_CHANGES_SUMMARY_FILE_NAME,
  FUNCTIONS_METADATA_FILE_NAME,
  PROD_BUCKET,
} from './constants'
import { ChangesSummary } from './types'

let s3: aws.S3

export async function handler(_event: any) {
  if (!s3) {
    s3 = new aws.S3({ apiVersion: '2006-03-01' })
  }
  const changesSummary = await getS3File(FUNCTIONS_CHANGES_SUMMARY_FILE_NAME)
  if (!hasChanges(changesSummary)) {
    console.log('No changes detected.')
    return
  }
  const metadata = await getS3File(FUNCTIONS_METADATA_FILE_NAME)
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

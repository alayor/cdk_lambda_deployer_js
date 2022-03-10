import * as aws from 'aws-sdk'
import { Metadata, NewVersions } from '../types'
import { LIBS_CHANGES_SUMMARY_FILE_NAME, LIBS_METADATA_FILE_NAME, PROD_BUCKET } from '../constants'
import { LOCK_FILE } from '../constants'

export async function saveNewMetadata(
  s3: aws.S3,
  stageMetadata: Metadata,
  prodMetadata: Metadata,
  newVersions: NewVersions,
) {
  const libNames = Object.keys(stageMetadata)
  const newProdMetadata = libNames.reduce((acc, libName) => {
    acc[libName] = {
      ...stageMetadata[libName],
      s3Version: newVersions[libName] || prodMetadata[libName].s3Version,
    }
    return acc
  }, stageMetadata)
  console.log('newProdMetadata: ', JSON.stringify(newProdMetadata, null, 2))
  await s3
    .putObject({
      Bucket: PROD_BUCKET,
      Key: LIBS_METADATA_FILE_NAME,
      Body: JSON.stringify(newProdMetadata),
    })
    .promise()
  await s3
    .putObject({
      Bucket: PROD_BUCKET,
      Key: LIBS_CHANGES_SUMMARY_FILE_NAME,
      Body: JSON.stringify(Object.keys(newVersions)),
    })
    .promise()
  await s3
    .putObject({
      Bucket: PROD_BUCKET,
      Key: LOCK_FILE,
      Body: '',
    })
    .promise()
}

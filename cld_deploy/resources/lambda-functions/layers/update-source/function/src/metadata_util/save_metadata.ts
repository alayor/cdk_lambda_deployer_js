import * as aws from 'aws-sdk'
import { Metadata, NewVersions } from '../types'
import { LIBS_CHANGES_SUMMARY_FILE_NAME, METADATA_FILE_NAME } from '../constants'
import { LOCK_FILE } from '../constants'

export async function saveNewMetadata(
  s3: aws.S3,
  prodBucketName: string,
  stageMetadata: Metadata,
  prodMetadata: Metadata,
  newVersions: NewVersions,
) {
  const stageLibsMetadata = stageMetadata.libs
  const libNames = Object.keys(stageLibsMetadata)
  console.log('newVersions: ', JSON.stringify(newVersions, null, 2))
  const newProdLibsMetadata = libNames.reduce((acc, libName) => {
    acc[libName] = {
      ...stageLibsMetadata[libName],
      s3Version: newVersions[libName] || prodMetadata.libs[libName].s3Version,
    }
    return acc
  }, stageLibsMetadata)
  const newProdMetadata = {
    ...prodMetadata,
    libs: newProdLibsMetadata,
    functionGroupLibs: stageMetadata.functionGroupLibs,
  }
  console.log('newProdMetadata: ', JSON.stringify(newProdMetadata, null, 2))
  await s3
    .putObject({
      Bucket: prodBucketName,
      Key: METADATA_FILE_NAME,
      Body: JSON.stringify(newProdMetadata),
    })
    .promise()
  await s3
    .putObject({
      Bucket: prodBucketName,
      Key: LIBS_CHANGES_SUMMARY_FILE_NAME,
      Body: JSON.stringify(Object.keys(newVersions)),
    })
    .promise()
  await s3
    .putObject({
      Bucket: prodBucketName,
      Key: LOCK_FILE,
      Body: '',
    })
    .promise()
}

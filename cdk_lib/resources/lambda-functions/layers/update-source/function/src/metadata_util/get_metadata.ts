import * as aws from 'aws-sdk'
import { Metadata } from '../types'
import { STAGE_BUCKET, LIBS_METADATA_FILE_NAME } from '../constants'

export async function getLibsMetadata(s3: aws.S3): Promise<{
  stageMetadata: Metadata
  prodMetadata: Metadata
}> {
  const stageMetadata = await getMetadata(s3, STAGE_BUCKET)
  if (!stageMetadata) {
    throw new Error('The stage metadata was not found!')
  }
  const prodMetadata = (await getMetadata(s3, 'minisuper-api-functions')) || {}
  return { stageMetadata, prodMetadata }
}

async function getMetadata(s3: aws.S3, bucket: string): Promise<Metadata | null> {
  try {
    const metadataFile = await s3
      .getObject({ Bucket: bucket, Key: LIBS_METADATA_FILE_NAME })
      .promise()
    return JSON.parse(metadataFile.Body?.toString() ?? '{}')
  } catch (err: any) {
    if (err.code === 'NoSuchKey') {
      return null
    }
    throw err
  }
}

export function getLibsToUpdate(stageMetadata: Metadata, prodMetadata: Metadata) {
  const libsToUpdate = []
  const apiLibs = Object.keys(stageMetadata)
  for (const apiLib of apiLibs) {
    if (shouldUpdateLib(stageMetadata, prodMetadata, apiLib)) {
      libsToUpdate.push(apiLib)
    }
  }
  return libsToUpdate
}

function shouldUpdateLib(stageMetadata: Metadata, prodMetadata: Metadata, apiLib: string): boolean {
  if (!prodMetadata[apiLib]) {
    return true
  }
  const stageFiles = stageMetadata[apiLib].files
  const prodFiles = prodMetadata[apiLib].files
  const stageFileKeys = Object.keys(stageFiles)
  for (const fileKey of stageFileKeys) {
    if (!prodFiles[fileKey]) {
      return true
    }
    if (prodFiles[fileKey].hash !== stageFiles[fileKey].hash) {
      return true
    }
  }
  return false
}

import * as aws from 'aws-sdk'
import { Metadata } from '../types'
import { LOCK_FILE, PROD_BUCKET } from '../constants'
import ChangesSummary from '../changes_summary'

export async function saveNewMetadata(
  s3: aws.S3,
  stageMetadata: Metadata,
  prodMetadata: Metadata,
  changesSummary: ChangesSummary,
) {
  const newProdMetadata = Object.keys(stageMetadata).reduce((acc, apiName) => {
    const functionNames = Object.keys(stageMetadata[apiName])
    functionNames.forEach((functionName) => {
      const metadata = stageMetadata[apiName][functionName]
      acc[apiName][functionName] = {
        ...metadata,
        version:
          changesSummary.getNewVersion(apiName, functionName) ||
          prodMetadata[apiName]?.[functionName]?.version,
      }
    })
    return acc
  }, stageMetadata)
  console.log('newProdMetadata: ', newProdMetadata)
  assertEquals(stageMetadata, newProdMetadata)

  await s3
    .putObject({
      Bucket: PROD_BUCKET,
      Key: 'functions/metadata.json',
      Body: JSON.stringify(newProdMetadata),
    })
    .promise()
  await s3
    .putObject({
      Bucket: PROD_BUCKET,
      Key: 'functions/changes_summary.json',
      Body: changesSummary.getChangesSummary(),
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

function assertEquals(stageMetadata: Metadata, prodMetadata: Metadata) {
  const prodKeys = Object.keys(prodMetadata)
  const stageKeys = Object.keys(prodMetadata)
  if (prodKeys.length !== stageKeys.length) {
    throw new Error('Stage Metadata and new Prod Metadata are not equal!')
  }
  prodKeys.forEach((prodKey) => {
    if (stageMetadata[prodKey].hash !== prodMetadata[prodKey].hash) {
      throw new Error('Stage Metadata and new Prod Metadata are not equal!')
    }
  })
}

import * as aws from 'aws-sdk'
import { FunctionsMetadata, Metadata } from '../types'
import { LOCK_FILE, METADATA_FILE_NAME, PROD_BUCKET } from '../constants'
import ChangesSummary from '../changes_summary'

export async function saveNewMetadata(
  s3: aws.S3,
  stageMetadata: Metadata,
  prodMetadata: Metadata,
  changesSummary: ChangesSummary,
) {
  const stageFunctionsMetadata = stageMetadata.functions || {}
  const prodFunctionsMetadata = prodMetadata.functions || {}
  const newProdFunctionsMetadata = Object.keys(stageFunctionsMetadata).reduce((acc, apiName) => {
    const functionNames = Object.keys(stageFunctionsMetadata[apiName])
    functionNames.forEach((functionName) => {
      const metadata = stageFunctionsMetadata[apiName][functionName]
      acc[apiName][functionName] = {
        ...metadata,
        version:
          changesSummary.getNewVersion(apiName, functionName) ||
          prodFunctionsMetadata[apiName]?.[functionName]?.version,
      }
    })
    return acc
  }, stageFunctionsMetadata)
  const newProdMetadata = {
    ...stageMetadata,
    functions: newProdFunctionsMetadata,
  }
  console.log('newProdMetadata: ', newProdMetadata)
  console.log('stageFunctionsMetadata: ', stageFunctionsMetadata)
  assertEquals(stageFunctionsMetadata, newProdMetadata.functions)

  await s3
    .putObject({
      Bucket: PROD_BUCKET,
      Key: METADATA_FILE_NAME,
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

function assertEquals(stageMetadata: FunctionsMetadata, prodMetadata: FunctionsMetadata) {
  const prodKeys = Object.keys(prodMetadata)
  const stageKeys = Object.keys(stageMetadata)
  if (prodKeys.length !== stageKeys.length) {
    throw new Error('Stage Metadata and new Prod Metadata are not equal!')
  }
  prodKeys.forEach((prodKey) => {
    Object.keys(prodMetadata[prodKey]).forEach((functionName) => {
      if (stageMetadata[prodKey][functionName].hash !== prodMetadata[prodKey][functionName].hash) {
        throw new Error('Stage Metadata and new Prod Metadata are not equal!')
      }
    })
  })
}

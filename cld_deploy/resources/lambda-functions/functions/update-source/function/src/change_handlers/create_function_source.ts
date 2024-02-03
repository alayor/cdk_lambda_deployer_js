import * as aws from 'aws-sdk'
import { Metadata } from '../types'
import { copyFunctions } from './util'
import ChangesSummary, { CHANGE_TYPE } from '../changes_summary'

export async function createFunctionSource(
  s3: aws.S3,
  stageMetadata: Metadata,
  prodMetadata: Metadata,
  changesSummary: ChangesSummary,
  stageBucketName: string,
  prodBucketName: string,
) {
  const stageFunctionsMetadata = stageMetadata.functions || {}
  const apiNames = Object.keys(stageFunctionsMetadata)
  for await (const apiName of apiNames) {
    const functionNames = Object.keys(stageFunctionsMetadata[apiName])
    const functionsToCreate = functionNames.filter(
      (functionName) => !prodMetadata.functions?.[apiName]?.[functionName],
    )
    const changedVersions = await copyFunctions(
      s3,
      stageMetadata,
      apiName,
      functionsToCreate,
      stageBucketName,
      prodBucketName,
    )
    Object.keys(changedVersions).forEach((functionName) => {
      changesSummary.addChange(
        CHANGE_TYPE.CREATE,
        apiName,
        functionName,
        changedVersions[functionName],
      )
    })
  }
}

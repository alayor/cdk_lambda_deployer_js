import { Metadata } from '../types'
import { copyFunctions } from './util'
import ChangesSummary, { CHANGE_TYPE } from '../changes_summary'
import * as aws from 'aws-sdk'

export async function updateFunctionSource(
  s3: aws.S3,
  stageMetadata: Metadata,
  prodMetadata: Metadata,
  changesSummary: ChangesSummary,
) {
  const stageFunctionsMetadata = stageMetadata.functions || {}
  const prodFunctionsMetadata = prodMetadata.functions || {}
  const apiNames = Object.keys(stageFunctionsMetadata)
  for await (const apiName of apiNames) {
    const functionNames = Object.keys(stageFunctionsMetadata[apiName])
    const functionsToUpdate = functionNames.filter(
      (functionName) =>
        !!prodFunctionsMetadata?.[apiName]?.[functionName] &&
        prodFunctionsMetadata[apiName][functionName].hash !== stageFunctionsMetadata[apiName][functionName].hash,
    )
    const changedVersions = await copyFunctions(s3, stageMetadata, apiName, functionsToUpdate)
    Object.keys(changedVersions).forEach((functionName) => {
      changesSummary.addChange(
        CHANGE_TYPE.UPDATE,
        apiName,
        functionName,
        changedVersions[functionName],
      )
    })
  }
}

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
  const apiNames = Object.keys(stageMetadata)
  for await (const apiName of apiNames) {
    const functionNames = Object.keys(stageMetadata[apiName])
    const functionsToUpdate = functionNames.filter(
      (functionName) =>
        !!prodMetadata?.[apiName]?.[functionName] &&
        prodMetadata[apiName][functionName].hash !== stageMetadata[apiName][functionName].hash,
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

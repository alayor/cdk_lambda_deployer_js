import { Metadata } from '../types'
import ChangesSummary, { CHANGE_TYPE } from '../changes_summary'
import * as aws from 'aws-sdk'

export async function deleteFunctionSource(
  s3: aws.S3,
  stageMetadata: Metadata,
  prodMetadata: Metadata,
  changesSummary: ChangesSummary,
  prodBucketName: string,
) {
  const stageFunctionsMetadata = stageMetadata.functions || {}
  const prodFunctionsMetadata = prodMetadata.functions || {}
  const apiNames = Object.keys(stageFunctionsMetadata)
  for await (const apiName of apiNames) {
    const functionNames = prodFunctionsMetadata[apiName] || []
    const functionsToDelete = Object.keys(functionNames).filter(
      (functionName) => !stageFunctionsMetadata?.[apiName]?.[functionName],
    )
    const changedVersions = await deleteFunctions(
      s3,
      prodMetadata,
      apiName,
      functionsToDelete,
      prodBucketName,
    )
    Object.keys(changedVersions).forEach((functionName) => {
      changesSummary.addChange(
        CHANGE_TYPE.DELETE,
        apiName,
        functionName,
        changedVersions[functionName],
      )
    })
  }
}

async function deleteFunctions(
  s3: aws.S3,
  prodMetadata: Metadata,
  apiName: string,
  functionsToDelete: string[],
  prodBucketName: string,
): Promise<Record<string, string>> {
  const versions: Record<string, string> = {}
  for await (const functionName of functionsToDelete) {
    const func = prodMetadata.functions[apiName][functionName]
    const s3Response = await s3
      .deleteObject({
        Bucket: prodBucketName,
        Key: func.zipPath,
      })
      .promise()
    if (!s3Response.VersionId) {
      throw new Error('Missing version id for key: ' + functionName)
    }
    versions[functionName] = s3Response.VersionId
  }
  return versions
}

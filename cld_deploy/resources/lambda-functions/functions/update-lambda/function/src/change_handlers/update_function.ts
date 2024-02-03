import * as aws from 'aws-sdk'
import { ChangesSummary, FunctionsMetadata, MetadataBody } from '../types'

export async function updateFunctions(
  lambda: aws.Lambda,
  metadata: FunctionsMetadata,
  changesSummary: ChangesSummary,
  prodBucketName: string,
) {
  const changes = changesSummary.changes?.update ?? []
  for await (const apiName of Object.keys(changes)) {
    for await (const functionName of changes[apiName]) {
      const apiFunction = metadata[apiName][functionName]
      await updateFunction(lambda, apiName, functionName, apiFunction, prodBucketName)
    }
  }
}

async function updateFunction(
  lambda: aws.Lambda,
  apiName: string,
  functionName: string,
  apiFunction: MetadataBody,
  prodBucketName: string,
) {
  const completeFunctionName = `${apiName}_${functionName}`
  const params = {
    FunctionName: completeFunctionName,
    S3Bucket: prodBucketName,
    S3Key: apiFunction.zipPath,
    S3ObjectVersion: apiFunction.version,
  }
  console.log('function update params: ', params)
  await lambda.updateFunctionCode(params).promise()
}

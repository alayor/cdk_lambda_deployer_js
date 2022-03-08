import * as aws from 'aws-sdk'
import { ChangesSummary, Metadata, MetadataBody } from '../types'
import { PROD_BUCKET } from '../constants'

const lambda = new aws.Lambda({ apiVersion: '2015-03-31' })

export async function updateFunctions(metadata: Metadata, changesSummary: ChangesSummary) {
  const changes = changesSummary.changes?.update ?? []
  for await (const apiName of Object.keys(changes)) {
    for await (const functionName of changes[apiName]) {
      const apiFunction = metadata[apiName][functionName]
      await updateFunction(apiName, functionName, apiFunction)
    }
  }
}

async function updateFunction(apiName: string, functionName: string, apiFunction: MetadataBody) {
  const completeFunctionName = `api_${apiName}_${functionName}`
  const params = {
    FunctionName: completeFunctionName,
    S3Bucket: PROD_BUCKET,
    S3Key: apiFunction.zipPath,
    S3ObjectVersion: apiFunction.version,
  }
  console.log('function update params: ', params)
  await lambda.updateFunctionCode(params).promise()
}

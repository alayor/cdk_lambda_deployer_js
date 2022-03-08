import * as aws from 'aws-sdk'
import { MetadataBody, ChangesSummary, Metadata } from '../types'
import { PROD_BUCKET } from '../constants'

export async function createFunctions(
  lambda: aws.Lambda,
  metadata: Metadata,
  changesSummary: ChangesSummary,
) {
  const changes = changesSummary.changes?.create ?? []
  for await (const apiName of Object.keys(changes)) {
    for await (const functionName of changes[apiName]) {
      const apiFunction = metadata[apiName][functionName]
      await createFunction(lambda, apiName, functionName, apiFunction)
    }
  }
}

async function createFunction(
  lambda: aws.Lambda,
  apiName: string,
  functionName: string,
  apiFunction: MetadataBody,
) {
  const completeFunctionName = `api_${apiName}_${functionName}`
  const params = {
    Code: {
      S3Bucket: PROD_BUCKET,
      S3Key: apiFunction.zipPath,
    },
    FunctionName: completeFunctionName,
    Role: getRole(apiName) || '',
    Handler: 'function.handler',
    Runtime: 'nodejs14.x',
    //TODO: Add Layer
  }
  console.log('function create params: ', params)
  await lambda.createFunction(params).promise()
}

function getRole(apiName: string): string | undefined {
  if (apiName.startsWith('customer')) {
    return process.env.CUSTOMER_API_ROLE
  }
  if (apiName.startsWith('deliverer')) {
    return process.env.DELIVERER_API_ROLE
  }
  if (apiName.startsWith('admin')) {
    return process.env.ADMIN_API_ROLE
  }
  return void 0
}

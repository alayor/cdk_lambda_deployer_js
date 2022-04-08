import * as aws from 'aws-sdk'
import { ChangesSummary, FunctionsMetadata } from '../types'

export async function deleteFunctions(
  lambda: aws.Lambda,
  metadata: FunctionsMetadata,
  changesSummary: ChangesSummary,
) {
  const changes = changesSummary.changes?.delete ?? []
  for await (const apiName of Object.keys(changes)) {
    for await (const functionName of changes[apiName]) {
      await deleteFunction(lambda, apiName, functionName)
    }
  }
}

async function deleteFunction(lambda: aws.Lambda, apiName: string, functionName: string) {
  const completeFunctionName = `${apiName}_${functionName}`
  const params = {
    FunctionName: completeFunctionName,
  }
  console.log('function delete params: ', params)
  await lambda.deleteFunction(params).promise()
}

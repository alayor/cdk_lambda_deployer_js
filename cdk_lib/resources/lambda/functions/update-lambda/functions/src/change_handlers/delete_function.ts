import * as aws from 'aws-sdk'
import { ChangesSummary, Metadata } from '../types'

const lambda = new aws.Lambda({ apiVersion: '2015-03-31' })

export async function deleteFunctions(metadata: Metadata, changesSummary: ChangesSummary) {
  const changes = changesSummary.changes?.delete ?? []
  for await (const apiName of Object.keys(changes)) {
    for await (const functionName of changes[apiName]) {
      await deleteFunction(apiName, functionName)
    }
  }
}

async function deleteFunction(apiName: string, functionName: string) {
  const completeFunctionName = `api_${apiName}_${functionName}`
  const params = {
    FunctionName: completeFunctionName,
  }
  console.log('function delete params: ', params)
  await lambda.deleteFunction(params).promise()
}

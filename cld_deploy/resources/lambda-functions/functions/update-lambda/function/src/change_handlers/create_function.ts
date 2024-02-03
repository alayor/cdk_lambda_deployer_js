import * as aws from 'aws-sdk'
import { MetadataBody, ChangesSummary, FunctionsMetadata } from '../types'
import { Lambda } from 'aws-sdk'
import { SecurityGroupId, SubnetId } from 'aws-sdk/clients/lambda'

export async function createFunctions(
  prodBucketName: string,
  lambda: aws.Lambda,
  metadata: FunctionsMetadata,
  changesSummary: ChangesSummary,
  subnetIds: string[],
  securityGroupIds: string[],
  databaseProxyName?: string,
) {
  const changes = changesSummary.changes?.create ?? []
  for await (const apiName of Object.keys(changes)) {
    for await (const functionName of changes[apiName]) {
      const apiFunction = metadata[apiName][functionName]
      try {
        await createFunction(
          lambda,
          apiName,
          functionName,
          apiFunction,
          prodBucketName,
          subnetIds,
          securityGroupIds,
          databaseProxyName,
        )
      } catch (err: any) {
        if (err.code === 'ResourceConflictException') {
          console.log(err.errorMessage)
        } else {
          throw err
        }
      }
    }
  }
}

async function createFunction(
  lambda: aws.Lambda,
  apiName: string,
  functionName: string,
  apiFunction: MetadataBody,
  prodBucketName: string,
  subnetIds: SubnetId[],
  securityGroupIds: SecurityGroupId[],
  databaseProxyName?: string,
) {
  const completeFunctionName = `${apiName}_${functionName}`
  const params: Lambda.Types.CreateFunctionRequest = {
    Code: {
      S3Bucket: prodBucketName,
      S3Key: apiFunction.zipPath,
    },
    FunctionName: completeFunctionName,
    Role: getRole(apiName) || '',
    Handler: 'function.handler', //TODO: Get file name from Config
    Runtime: 'nodejs20.x',
    VpcConfig: {
      SubnetIds: subnetIds,
      SecurityGroupIds: securityGroupIds,
    },
    Environment: {
      Variables: {
        NODE_ENV: 'production',
        DB_PROXY_NAME: databaseProxyName ?? '',
      },
    },
  }
  console.log('function create params: ', params)
  await lambda.createFunction(params).promise()
}

function getRole(apiName: string): string | undefined {
  return process.env.LAMBDA_FUNCTION_ROLE
}

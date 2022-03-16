import * as aws from 'aws-sdk'
import { Metadata } from '../types'
import { PROD_BUCKET, STAGE_BUCKET } from '../constants'

export async function copyFunctions(
  s3: aws.S3,
  stageMetadata: Metadata,
  apiName: string,
  functionsToCreate: string[],
): Promise<Record<string, string>> {
  const versions: Record<string, string> = {}
  for await (const functionName of functionsToCreate) {
    const func = stageMetadata[apiName][functionName]
    const s3Response = await s3
      .copyObject({
        Bucket: PROD_BUCKET,
        Key: func.zipPath,
        CopySource: STAGE_BUCKET + '/' + func.zipPath,
      })
      .promise()
    if (!s3Response.VersionId) {
      throw new Error('Missing version id for key: ' + functionName)
    }
    versions[functionName] = s3Response.VersionId
  }
  return versions
}

import * as aws from 'aws-sdk'
import { Metadata } from '../types'

export async function copyFunctions(
  s3: aws.S3,
  stageMetadata: Metadata,
  apiName: string,
  functionsToCreate: string[],
  stageBucketName: string,
  prodBucketName: string,
): Promise<Record<string, string>> {
  const versions: Record<string, string> = {}
  for await (const functionName of functionsToCreate) {
    const func = stageMetadata.functions[apiName][functionName]
    const s3Response = await s3
      .copyObject({
        Bucket: prodBucketName,
        Key: func.zipPath,
        CopySource: stageBucketName + '/' + func.zipPath,
      })
      .promise()
    if (!s3Response.VersionId) {
      throw new Error('Missing version id for key: ' + functionName)
    }
    versions[functionName] = s3Response.VersionId
  }
  return versions
}

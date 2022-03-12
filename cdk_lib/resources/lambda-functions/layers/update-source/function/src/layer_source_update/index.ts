import * as aws from 'aws-sdk'
import { PROD_BUCKET, STAGE_BUCKET } from '../constants'
import { NewVersions } from '../types'

export async function updateLayerSources(s3: aws.S3, layersToUpdate: string[]): Promise<NewVersions> {
  const newVersions: NewVersions = {}
  for await (const libName of layersToUpdate) {
    const s3Response = await s3
      .copyObject({
        Bucket: PROD_BUCKET,
        Key: `libs/${libName}/nodejs.zip`,
        CopySource: `${STAGE_BUCKET}/libs/${libName}/nodejs.zip`,
      })
      .promise()
    if (!s3Response.VersionId) {
      throw new Error('Missing version id for lib: ' + libName)
    }
    newVersions[libName] = s3Response.VersionId
  }
  return newVersions
}

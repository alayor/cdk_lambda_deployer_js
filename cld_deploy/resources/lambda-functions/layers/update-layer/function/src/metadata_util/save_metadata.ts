import * as aws from 'aws-sdk'
import { METADATA_FILE_NAME, PROD_BUCKET } from '../constants'
import { LayerVersions, Metadata } from '../types'

export async function saveLayerVersions(
  s3: aws.S3,
  metadata: Metadata,
  layerVersions: LayerVersions,
) {
  const libsMetadata = metadata.libs
  const newLibsMetadata = Object.keys(libsMetadata).reduce((acc, libName) => {
    acc[libName] = {
      ...libsMetadata[libName],
      layerVersion: layerVersions[libName],
    }
    return acc
  }, libsMetadata)
  const newMetadata = {
    ...metadata,
    libs: newLibsMetadata
  }
  console.log('newMetadata: ', newMetadata)

  await s3
    .putObject({
      Bucket: PROD_BUCKET,
      Key: METADATA_FILE_NAME,
      Body: JSON.stringify(newMetadata),
    })
    .promise()
}

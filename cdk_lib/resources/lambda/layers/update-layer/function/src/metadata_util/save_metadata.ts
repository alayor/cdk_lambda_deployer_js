import * as aws from 'aws-sdk'
import { PROD_BUCKET } from '../constants'
import { LibMetadata, LayerVersions } from '../types'

export async function saveLayerVersions(s3: aws.S3, libsMetadata: LibMetadata, layerVersions: LayerVersions) {
  const newLibsMetadata = Object.keys(libsMetadata).reduce((acc, libName) => {
    acc[libName] = {
      ...libsMetadata[libName],
      layerVersion: layerVersions[libName],
    }
    return acc
  }, libsMetadata)
  console.log('newLibsMetadata: ', newLibsMetadata)

  await s3
    .putObject({
      Bucket: PROD_BUCKET,
      Key: 'libs/metadata.json',
      Body: JSON.stringify(newLibsMetadata),
    })
    .promise()
}

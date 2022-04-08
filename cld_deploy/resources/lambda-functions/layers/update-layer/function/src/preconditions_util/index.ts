import * as aws from 'aws-sdk'
import { ChangesSummary, LibMetadata } from '../types'

const lambda = new aws.Lambda({ apiVersion: '2015-03-31' })

export function hasSummaryChanges(changesSummary: ChangesSummary): boolean {
  return Object.keys(changesSummary || {}).length > 0
}

export async function hasLayerVersionsChanges(libsMetadata: LibMetadata): Promise<boolean> {
  const libNames = Object.keys(libsMetadata || {})
  for await (const libName of libNames) {
    const { layerVersion } = libsMetadata[libName]
    if (!layerVersion) {
      return true
    }
    let isPublished = await isLayerVersionPublished(libName, layerVersion)
    console.log('isPublished: ', isPublished)
    if (!isPublished) {
      return true
    }
  }
  return false
}

async function isLayerVersionPublished(layerName: string, layerVersion: number) {
  try {
    await lambda
      .getLayerVersion({
        LayerName: layerName,
        VersionNumber: layerVersion,
      })
      .promise()
  } catch (err: any) {
    if (err.code === 'ResourceNotFoundException') {
      return false
    }
    throw err
  }
  return true
}

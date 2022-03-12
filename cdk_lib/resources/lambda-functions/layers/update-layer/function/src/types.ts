type LibFile = Record<string, { hash: string }>

type LibMetadataBody = {
    files: LibFile
    s3Version: string
    layerVersion: number
}

export type LibMetadata = { [libName: string]: LibMetadataBody }

export type ChangesSummary = string[]

export type LayerVersions = { [libName: string]: number }

type ApiFunction = {
    hash: string
    zipPath: string
    version: string
}
export type FunctionMetadata = Record<string, Record<string, ApiFunction>>

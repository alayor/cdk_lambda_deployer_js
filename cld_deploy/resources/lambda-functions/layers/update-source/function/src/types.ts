export type LibFile = Record<string, { hash: string }>

type MetadataBody = {
  files: LibFile
  s3Version: string
}

export type LibsMetadata = { [libName: string]: MetadataBody }

export type FunctionGroupLibs = { [functionGroup: string]: string[] }

export type Metadata = { libs: LibsMetadata,  functionGroupLibs: FunctionGroupLibs }

export type NewVersions = { [libName: string]: string }

export type ChangesSummary = string[]

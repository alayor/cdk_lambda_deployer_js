type MetadataBody = {
  hash: string
  zipPath: string
  version: string
}
export type FunctionsMetadata = Record<string, Record<string, MetadataBody>>

export type Metadata = { functions: FunctionsMetadata }

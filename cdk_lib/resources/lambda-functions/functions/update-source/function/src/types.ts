type MetadataBody = {
    hash: string
    zipPath: string
    version: string
}
export type Metadata = Record<string, Record<string, MetadataBody>>

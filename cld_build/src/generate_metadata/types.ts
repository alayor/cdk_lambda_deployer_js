type FunctionMetadataBody = {
  hash: string
  zipPath: string
}

export type FunctionMetadata = Record<string, FunctionMetadataBody>

export type LibFile = Record<string, { hash: string }>

type LibFiles = {
  files: LibFile
}

export type LibMetadata = Record<string, LibFiles>

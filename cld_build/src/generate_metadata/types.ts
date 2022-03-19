export type FunctionMetadataDetail = {
  hash: string
  zipPath: string
}

export type FunctionMetadata = { [functionName: string]: FunctionMetadataDetail }

export type ModelFunctionMetadata = { [modelName: string]: FunctionMetadata }

export type LibFile = Record<string, { hash: string }>

type LibFiles = {
  files: LibFile
}

export type LibMetadata = Record<string, LibFiles>

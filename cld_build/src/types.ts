export type Config = {
  projectPath: string
  functionsRelativePath: string
  functionsAbsolutePath: string
  functionFileName: string
  entityNames: string[]
  libNames: string[]
  outputRelativePath: string
  outputAbsolutePath: string
}

export type FunctionMetadataDetail = {
  hash: string
  zipPath: string
}

export type FunctionMetadata = { [functionName: string]: FunctionMetadataDetail }

export type EntityFunctionMetadata = { [entityName: string]: FunctionMetadata }

export type LibFile = Record<string, { hash: string }>

type LibFiles = {
  files: LibFile
}

export type LibMetadata = Record<string, LibFiles>
export type UserConfig = {
  functionsRelativePath: string
  libsRelativePath: string
  functionFileName: string
  functionGroups: string[]
  libs: string[]
  functionGroupLibs: Record<string, Array<String>>
  outputRelativePath: string
}

export type Config = UserConfig & {
  projectPath: string
  functionsAbsolutePath: string
  libsAbsolutePath: string
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

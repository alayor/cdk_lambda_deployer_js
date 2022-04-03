import * as fs from 'fs'
import * as path from 'path'
import * as Bluebird from 'bluebird'
import * as crypto from 'crypto'
import { FunctionMetadata, LibFile, LibMetadata, EntityFunctionMetadata } from 'cld_build/types'
import { getFilePaths } from 'cld_build/util'
import { Config } from 'cld_build/types'

export async function generateFunctionsMetadata(config: Config) {
  const { functionGroups, outputAbsolutePath } = config
  const metadata = await Bluebird.reduce(
    functionGroups,
    async (acc: EntityFunctionMetadata, functionGroup) => {
      acc[functionGroup] = await generateFunctionMetadata(config, functionGroup)
      return acc
    },
    {},
  )

  fs.writeFileSync(
    path.join(outputAbsolutePath, 'functions/metadata.json'),
    JSON.stringify(metadata, null, 2),
  )
}

async function generateFunctionMetadata(config: Config, functionGroup: string) {
  const { functionsAbsolutePath, functionFileName } = config
  const pathPrefix = `${functionsAbsolutePath}/${functionGroup}/`
  const functionPaths = await getFilePaths(pathPrefix, /\.js$/)
  return functionPaths.reduce((prev: FunctionMetadata, fullPath) => {
    const functionPath = fullPath.replace(pathPrefix, '').replace(`/${functionFileName}`, '')
    const key = functionPath.replace(/\//g, '_')
    const zipPath = path.join('functions', functionGroup, functionPath, 'function.zip')
    prev[key] = {
      hash: calculateHash(fullPath),
      zipPath,
    }
    return prev
  }, {})
}

export async function generateLibsMetadata(config: Config) {
  const { libs, outputAbsolutePath } = config

  const metadata = await Bluebird.reduce(
    libs,
    async (acc: LibMetadata, lib) => {
      acc[lib] = {
        files: await generateLibFilesMetadata(config, lib),
      }
      return acc
    },
    {},
  )

  fs.writeFileSync(path.join(outputAbsolutePath, 'libs/metadata.json'), JSON.stringify(metadata, null, 2))
}

async function generateLibFilesMetadata(config: Config, libName: string) {
  const { outputAbsolutePath } = config
  const pathPrefix = `${outputAbsolutePath}/libs/${libName}/nodejs/`
  const filePaths = await getFilePaths(pathPrefix, /\.js$/)
  return filePaths.reduce((prev, fullPath) => {
    const libPath = fullPath.replace(pathPrefix, '').replace('.js', '')
    const key = libPath.replace(/\//g, '_').replace(`${libName}_`, '')
    prev[key] = {
      hash: calculateHash(fullPath),
    }
    return prev
  }, {} as LibFile)
}

function calculateHash(filePath: string) {
  const fileBuffer = fs.readFileSync(filePath)
  const hashSum = crypto.createHash('sha256')
  hashSum.update(fileBuffer)
  return hashSum.digest('hex')
}

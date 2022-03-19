import * as fs from 'fs'
import * as path from 'path'
import * as Bluebird from 'bluebird'
import * as crypto from 'crypto'
import { FunctionMetadata, LibFile, LibMetadata, EntityFunctionMetadata } from 'cld_build/types'
import { getFilePaths } from 'cld_build/util'
import { Config } from 'cld_build/types'

export async function generateFunctionsMetadata(config: Config) {
  const { entityNames, outputAbsolutePath } = config
  const metadata = await Bluebird.reduce(
    entityNames,
    async (acc: EntityFunctionMetadata, entityName) => {
      acc[entityName] = await generateFunctionMetadata(config, entityName)
      return acc
    },
    {},
  )

  fs.writeFileSync(
    path.join(outputAbsolutePath, 'functions/metadata.json'),
    JSON.stringify(metadata, null, 2),
  )
}

async function generateFunctionMetadata(config: Config, entityName: string) {
  const { functionsAbsolutePath, functionFileName } = config
  const pathPrefix = `${functionsAbsolutePath}/${entityName}/`
  const functionPaths = await getFilePaths(pathPrefix, /\.js$/)
  return functionPaths.reduce((prev: FunctionMetadata, fullPath) => {
    const functionPath = fullPath.replace(pathPrefix, '').replace(`/${functionFileName}`, '')
    const key = functionPath.replace(/\//g, '_')
    const zipPath = path.join('functions', entityName, functionPath, 'function.zip')
    prev[key] = {
      hash: calculateHash(fullPath),
      zipPath,
    }
    return prev
  }, {})
}

export async function generateLibsMetadata(config: Config) {
  const { libNames, outputAbsolutePath } = config

  const metadata = await Bluebird.reduce(
    libNames,
    async (acc: LibMetadata, libName) => {
      acc[libName] = {
        files: await generateLibFilesMetadata(config, libName),
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

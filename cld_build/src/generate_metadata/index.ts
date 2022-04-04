import * as fs from 'fs'
import * as path from 'path'
import * as Bluebird from 'bluebird'
import * as crypto from 'crypto'
import {
  FunctionMetadata,
  LibFile,
  LibMetadata,
  EntityFunctionMetadata,
  Metadata, MetadataKey
} from "cld_build/types";
import { fileExists, getFilePaths } from 'cld_build/util'
import { Config } from 'cld_build/types'

const METADATA_FILE_NAME = 'metadata.json'

export async function generateFunctionsMetadata(config: Config) {
  const { functionGroups, outputAbsolutePath } = config
  const functionsMetadata = await Bluebird.reduce(
    functionGroups,
    async (acc: FunctionMetadata, functionGroup) => {
      acc[functionGroup] = await generateFunctionMetadata(config, functionGroup)
      return acc
    },
    {},
  )
  await updateMetadata(outputAbsolutePath, 'functions', functionsMetadata)
}

async function generateFunctionMetadata(config: Config, functionGroup: string) {
  const { functionsAbsolutePath, functionFileName } = config
  const pathPrefix = `${functionsAbsolutePath}/${functionGroup}/`
  const functionPaths = await getFilePaths(pathPrefix, /\.js$/)
  return functionPaths.reduce((prev: EntityFunctionMetadata, fullPath) => {
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

  const libsMetadata = await Bluebird.reduce(
    libs,
    async (acc: LibMetadata, lib) => {
      acc[lib] = {
        files: await generateLibFilesMetadata(config, lib),
      }
      return acc
    },
    {},
  )
  await updateMetadata(outputAbsolutePath, 'libs', libsMetadata)
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

async function updateMetadata(
  outputAbsolutePath: string,
  key: MetadataKey,
  metadata: FunctionMetadata | LibMetadata,
) {
  const currentMetadata = await readMetadata(outputAbsolutePath)
  const newMetadata = buildNewMetadata(currentMetadata, key, metadata)
  await writeMetadata(outputAbsolutePath, newMetadata as Metadata)
}

function buildNewMetadata(
  currentMetadata: Metadata | null,
  key: MetadataKey,
  metadata: FunctionMetadata | LibMetadata,
) {
  return currentMetadata
    ? {
        ...currentMetadata,
        [key]: metadata,
      }
    : { [key]: metadata }
}

async function readMetadata(outputAbsolutePath: string): Promise<Metadata | null> {
  const metadataFilePath = path.join(outputAbsolutePath, METADATA_FILE_NAME)
  if (!(await fileExists(metadataFilePath))) {
    return Promise.resolve(null)
  }
  return new Promise((resolve, reject) => {
    fs.readFile(metadataFilePath, function (err, data) {
      if (err) {
        console.log({ err })
        return reject(err)
      }
      return resolve(JSON.parse(data.toString()))
    })
  })
}

async function writeMetadata(outputAbsolutePath: string, metadata: Metadata) {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      path.join(outputAbsolutePath, METADATA_FILE_NAME),
      JSON.stringify(metadata, null, 2),
      function (err) {
        if (err) {
          console.log({ err })
          return reject(err)
        }
        return resolve(null)
      },
    )
  })
}

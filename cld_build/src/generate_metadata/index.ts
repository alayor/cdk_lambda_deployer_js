import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { FunctionMetadata, LibFile, LibMetadata } from './types'
import { getFilePaths } from 'cld_build/util'
import { outputFolderName } from 'cld_build/constants'
import { Config } from 'cld_build/types'

export async function generateFunctionsMetadata(config: Config) {
  const { modelNames, outputPath } = config
  for await (const modelName of modelNames) {
    const customerMetadata = await generateFunctionMetadata(config, modelName)

    const metadata = {
      customer: customerMetadata,
    }

    fs.writeFileSync(
      path.join(outputPath, 'functions/metadata.json'),
      JSON.stringify(metadata, null, 2),
    )
  }
}

async function generateFunctionMetadata(config: Config, apiName: string) {
  const { functionsPath, functionFileName } = config
  const pathPrefix = `${functionsPath}/${apiName}/`
  const functionPaths = await getFilePaths(pathPrefix, /\.js$/)
  return functionPaths.reduce((prev: FunctionMetadata, fullPath) => {
    const functionPath = fullPath.replace(pathPrefix, '').replace(`/${functionFileName}`, '')
    const key = functionPath.replace(/\//g, '_')
    const zipPath = path.join('functions', apiName, functionPath, 'function.zip')
    prev[key] = {
      hash: calculateHash(fullPath),
      zipPath,
    }
    return prev
  }, {})
}

export async function generateLibsMetadata() {
  const customerLibFilesMetadata = await generateLibFilesMetadata('customer_lib')
  const delivererLibFilesMetadata = await generateLibFilesMetadata('deliverer_lib')
  const adminLibFilesMetadata = await generateLibFilesMetadata('admin_lib')

  const metadata: LibMetadata = {
    customer_lib: {
      files: customerLibFilesMetadata,
    },
    deliverer_lib: {
      files: delivererLibFilesMetadata,
    },
    admin_lib: {
      files: adminLibFilesMetadata,
    },
  }
  fs.writeFileSync(
    path.join(outputFolderName, 'libs/metadata.json'),
    JSON.stringify(metadata, null, 2),
  )
}

async function generateLibFilesMetadata(libName: string) {
  const pathPrefix = `${outputFolderName}/libs/${libName}/nodejs/`
  const functionPaths = await getFilePaths(pathPrefix, /\.js$/)
  return functionPaths.reduce((prev, fullPath) => {
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

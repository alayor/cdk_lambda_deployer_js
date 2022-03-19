import * as fs from 'fs'
import * as path from 'path'
import * as archiver from 'archiver'
import { getFilePaths } from 'cld_build/util'
import { makeDirPath } from 'cld_build/util'
import * as rimraf from 'rimraf'
import { Config } from 'cld_build/types'

export async function zipFunctions(config: Config) {
  const { functionsPath, outputPath } = config
  const functionPaths = await getFilePaths(functionsPath, /\.js$/)
  const zippedFunctions: string[] = []
  functionPaths.forEach((functionPath) => {
    const archive = archiver('zip')
    const dirPath = functionPath.replace('src', outputPath).replace('/function.js', '')
    makeDirPath(dirPath)
    const output = fs.createWriteStream(path.join(dirPath, '/function.zip'))
    archive.pipe(output)
    archive.append(fs.createReadStream(functionPath), { name: 'function.js' }) //TODO: Get file name from Config
    archive.finalize()
    zippedFunctions.push(functionPath)
  })
  return zippedFunctions
}

export async function zipLibs(config: Config) {
  await zipLib(config, 'customer_lib')
  await zipLib(config, 'deliverer_lib')
  await zipLib(config, 'admin_lib')
}

async function zipLib(config: Config, libName: string) {
  const { outputPath } = config
  const archive = archiver('zip')
  const dirPath = `${outputPath}/libs/${libName}`
  const output = fs.createWriteStream(path.join(dirPath, 'nodejs.zip'))
  archive.pipe(output)
  archive.directory(`${outputPath}/libs/${libName}/nodejs/`, 'nodejs')
  await archive.finalize()
  rimraf.sync(`${outputPath}/libs/${libName}/nodejs`)
}

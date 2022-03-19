import * as fs from 'fs'
import * as path from 'path'
import * as archiver from 'archiver'
import { getFilePaths } from 'cld_build/util'
import { makeDirPath } from 'cld_build/util'
import * as rimraf from 'rimraf'
import { Config } from 'cld_build/types'

export async function zipFunctions(config: Config) {
  const { projectPath, functionsAbsolutePath, functionFileName, outputRelativePath } = config
  const functionPaths = await getFilePaths(functionsAbsolutePath, /\.js$/)
  const zippedFunctions: string[] = []
  functionPaths.forEach((functionPath) => {
    const archive = archiver('zip')
    const dirPath = functionPath.replace(projectPath, outputRelativePath).replace(functionFileName, '')
    makeDirPath(dirPath)
    const output = fs.createWriteStream(path.join(dirPath, '/function.zip'))
    archive.pipe(output)
    archive.append(fs.createReadStream(functionPath), { name: functionFileName })
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
  const { outputRelativePath } = config
  const archive = archiver('zip')
  const dirPath = `${outputRelativePath}/libs/${libName}`
  const output = fs.createWriteStream(path.join(dirPath, 'nodejs.zip'))
  archive.pipe(output)
  archive.directory(`${outputRelativePath}/libs/${libName}/nodejs/`, 'nodejs')
  await archive.finalize()
  rimraf.sync(`${outputRelativePath}/libs/${libName}/nodejs`)
}
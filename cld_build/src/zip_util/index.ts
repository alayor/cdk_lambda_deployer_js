import * as fs from 'fs'
import * as path from 'path'
import * as archiver from 'archiver'
import { getFilePaths } from 'cld_build/util'
import { outputFolderName } from 'cld_build/constants'
import { makeDirPath } from 'cld_build/util'
import * as rimraf from 'rimraf'

export async function zipFunctions() {
  const functionPaths = await getFilePaths('src/functions/', /\.js$/)
  const zippedFunctions: string[] = []
  functionPaths.forEach((functionPath) => {
    const archive = archiver('zip')
    const dirPath = functionPath.replace('src', outputFolderName).replace('/function.js', '')
    makeDirPath(dirPath)
    const output = fs.createWriteStream(path.join(dirPath, '/function.zip'))
    archive.pipe(output)
    archive.append(fs.createReadStream(functionPath), { name: 'function.js' })
    archive.finalize()
    zippedFunctions.push(functionPath)
  })
  return zippedFunctions
}

export async function zipLibs() {
  await zipLib('customer_lib')
  await zipLib('deliverer_lib')
  await zipLib('admin_lib')
}

async function zipLib(libName: string) {
  const archive = archiver('zip')
  const dirPath = `${outputFolderName}/libs/${libName}`
  const output = fs.createWriteStream(path.join(dirPath, 'nodejs.zip'))
  archive.pipe(output)
  archive.directory(`${outputFolderName}/libs/${libName}/nodejs/`, 'nodejs')
  await archive.finalize()
  rimraf.sync(`${outputFolderName}/libs/${libName}/nodejs`)
}

import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import * as Bluebird from 'bluebird'
import * as child from 'child_process'
import * as rimraf from 'rimraf'
import { Config } from 'cld_build/types'
import {makeDirRecursive} from "cld_build/util";
const exec = util.promisify(child.exec)

export async function buildLibs(config: Config) {
  const { libNames } = config
  await Bluebird.each(libNames, async (libName) => {
    await buildLib(config, libName)
  })
}

export async function buildLib(config: Config, libName: string) {
  const { projectPath, libsAbsolutePath, outputAbsolutePath } = config
  const rootFolder = `${outputAbsolutePath}/libs/${libName}/nodejs`
  const libFolder = `${rootFolder}/${libName}/`
  await new Promise((resolve) => rimraf(rootFolder, resolve))
  await makeDirRecursive(libFolder)
  fs.copyFileSync(path.join(projectPath, 'package.json'), `${rootFolder}/package.json`)
  await exec(
    `rsync ${libsAbsolutePath}/${libName}/* -a --include "*/" --include="*.js" --include="*.json" --exclude="*" ${libFolder}`,
  )
  await exec(`cd ${rootFolder} && npm install --no-save --no-optional --production`)
}

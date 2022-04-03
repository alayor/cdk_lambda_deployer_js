import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import * as Bluebird from 'bluebird'
import * as child from 'child_process'
import * as rimraf from 'rimraf'
import { Config } from 'cld_build/types'
import { copyFile, makeDirRecursive } from 'cld_build/util'
const exec = util.promisify(child.exec)

export async function buildLibs(config: Config) {
  const { libs } = config
  await Bluebird.each(libs, async (lib) => {
    await buildLib(config, lib)
  })
}

export async function buildLib(config: Config, lib: string) {
  const { projectPath, libsAbsolutePath, outputAbsolutePath } = config
  const rootFolder = `${outputAbsolutePath}/libs/${lib}/nodejs`
  const libFolder = `${rootFolder}/${lib}/`
  await new Promise((resolve) => rimraf(rootFolder, resolve))
  await makeDirRecursive(libFolder)

  //TODO: Important! Use esbuild instead of copying package.json and running npm install.
  await copyFile(path.join(projectPath, 'package.json'), `${rootFolder}/package.json`)
  await exec(
    `rsync ${libsAbsolutePath}/${lib}/* -a --include "*/" --include="*.js" --include="*.json" --exclude="*" ${libFolder}`,
  )
  await exec(`cd ${rootFolder} && npm install --no-save --no-optional --production`)
}

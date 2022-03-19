import * as fs from 'fs'
import * as util from 'util'
import * as child from 'child_process'
import * as rimraf from 'rimraf'
import {Config} from "cld_build/types";
const exec = util.promisify(child.exec)

export async function buildLibs(config: Config) {
  await buildLib(config, 'customer_lib')
  await buildLib(config, 'deliverer_lib')
  await buildLib(config, 'admin_lib')
}

export async function buildLib(config: Config, libName: string) {
  const { outputAbsolutePath } = config
  const rootFolder = `${outputAbsolutePath}/libs/${libName}/nodejs`
  const libFolder = `${rootFolder}/${libName}/`
  rimraf.sync(rootFolder)
  fs.mkdirSync(libFolder, { recursive: true })
  fs.copyFileSync('package.json', `${rootFolder}/package.json`)
  await exec(
    `rsync src/libs/${libName}/* -a --include "*/" --include="*.js" --include="*.json" --exclude="*" ${libFolder}`,
  )
  await exec(`cd ${rootFolder} && npm install --no-save --no-optional --production`)
}

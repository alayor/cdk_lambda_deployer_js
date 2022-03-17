import * as fs from 'fs'
import * as util from 'util'
import * as child from 'child_process'
import * as rimraf from 'rimraf'
import { outputFolderName } from 'cld_build/constants'
const exec = util.promisify(child.exec)

export async function buildLibs() {
  await buildLib('customer_lib')
  await buildLib('deliverer_lib')
  await buildLib('admin_lib')
}

export async function buildLib(libName: string) {
  const rootFolder = `${outputFolderName}/libs/${libName}/nodejs`
  const libFolder = `${rootFolder}/${libName}/`
  rimraf.sync(rootFolder)
  fs.mkdirSync(libFolder, { recursive: true })
  fs.copyFileSync('package.json', `${rootFolder}/package.json`)
  await exec(
    `rsync src/libs/${libName}/* -a --include "*/" --include="*.js" --include="*.json" --exclude="*" ${libFolder}`,
  )
  await exec(`cd ${rootFolder} && npm install --no-save --no-optional --production`)
}

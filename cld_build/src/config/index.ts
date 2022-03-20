import * as find_package_json from 'find-package-json'
import { Config } from 'cld_build/types'

export function getConfig(): {
  config: Config
  projectPath: string
} {
  const finder = find_package_json(__dirname)
  let f = finder.next()
  const triedFiles = []
  while (!f.done) {
    const config = getConfigFromPackageJson(f.value)
    if (config) {
      console.log('Loading cld_config from: ', f.filename)
      return {
        config,
        projectPath: f.filename.replace('/package.json', ''),
      }
    }
    triedFiles.push(f.filename)
    f = finder.next()
  }
  throw new Error('Config not found on package.json. Tried files: ' + JSON.stringify(triedFiles, null, 2))
}

function getConfigFromPackageJson(pack: any): Config | undefined {
  return pack?.cld?.build
}

import * as path from 'path'
import minimist = require('minimist')
import * as find_package_json from 'find-package-json'
import { Config, UserConfig } from 'cld_build/types'

export function getConfig(): Config {
  let userConfig = getConfigFromCldJson()
  if (!userConfig) {
    userConfig = getConfigFromPackageJson()
  }
  //TODO Validate user config
  return buildConfig(userConfig.config, userConfig.configPath)
}

function getConfigFromCldJson(): { config: UserConfig; configPath: string } | undefined {
  const argv = minimist(process.argv.slice(2))
  if (argv.config) {
    const config = require(argv.config).build as UserConfig
    const configPath = argv.config.replace('/cld.json', '')
    return { config, configPath }
  }
  return void 0
}

function getConfigFromPackageJson(): { config: UserConfig; configPath: string } {
  const finder = find_package_json(__dirname)
  let f = finder.next()
  const triedFiles = []
  while (!f.done) {
    const config = f.value?.cld?.build
    if (config) {
      console.log('Loaded config from: ', f.filename)
      const configPath = f.filename.replace('/package.json', '')
      return { config, configPath }
    }
    triedFiles.push(f.filename)
    f = finder.next()
  }
  throw new Error(
    'Config not found on any of these files: ' + JSON.stringify(triedFiles, null, 2),
  )
}

function buildConfig(config: UserConfig, projectPath: string): Config {
  return {
    projectPath,
    functionsRelativePath: config.functionsRelativePath || 'src/functions',
    get functionsAbsolutePath() {
      return path.join(this.projectPath, this.functionsRelativePath)
    },
    libsRelativePath: config.libsRelativePath || 'src/libs',
    get libsAbsolutePath() {
      return path.join(this.projectPath, this.libsRelativePath)
    },
    functionFileName: config.functionFileName || 'function.js',
    entityNames: config.entityNames || [],
    libNames: config.libNames || [],
    outputRelativePath: config.outputRelativePath || 'output',
    get outputAbsolutePath() {
      return path.join(this.projectPath, this.outputRelativePath)
    },
  }
}

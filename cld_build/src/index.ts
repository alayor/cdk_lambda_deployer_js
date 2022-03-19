import * as fs from 'fs'
import * as path from 'path'
import * as rimraf from 'rimraf'
import { zipFunctions, zipLibs } from './zip_util'
import { generateFunctionsMetadata, generateLibsMetadata } from './generate_metadata'
import { buildLibs } from 'cld_build/libs'
import { Config } from 'cld_build/types'

const configArg = JSON.parse(process.argv[2]) as Config
const config: Config = {
  projectPath: __dirname, //TODO: Find first package.json with cld_config key (npm: find-package-json)
  functionsRelativePath: configArg.functionsRelativePath || 'src/functions',
  get functionsAbsolutePath() {
    return path.join(this.projectPath, this.functionsRelativePath)
  },
  functionFileName: configArg.functionsRelativePath || 'function.js',
  entityNames: configArg.entityNames || [],
  libNames: configArg.libNames || [],
  outputRelativePath: configArg.outputRelativePath || 'output',
  get outputAbsolutePath() {
    return path.join(this.projectPath, this.outputRelativePath)
  },
}
const { outputRelativePath } = config

if (fs.existsSync(outputRelativePath)) {
  rimraf.sync(outputRelativePath)
}
fs.mkdirSync(outputRelativePath)
fs.mkdirSync(path.join(outputRelativePath, 'functions'))
fs.mkdirSync(path.join(outputRelativePath, 'libs'))

zipFunctions(config).then((_result) => {
  console.log('\u2705 Functions zipped successfully')
})

generateFunctionsMetadata(config).then((_metadata) => {
  console.log('\u2705 Functions metadata generated successfully')
})

buildLibs(config).then(() => {
  console.log('\u2705 Libs built successfully')

  generateLibsMetadata(config).then((_metadata) => {
    console.log('\u2705 Libs metadata generated successfully')
  })

  zipLibs(config).then((_result) => {
    console.log('\u2705 Libs zipped successfully')
  })
})

process.on('unhandledRejection', (error) => {
  console.log(error)
  process.exit(1)
})

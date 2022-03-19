import * as fs from 'fs'
import * as path from 'path'
import * as rimraf from 'rimraf'
import { zipFunctions, zipLibs } from './zip_util'
import { generateFunctionsMetadata, generateLibsMetadata } from './generate_metadata'
import { buildLibs } from 'cld_build/libs'
import { Config } from 'cld_build/types'

const configArg = JSON.parse(process.argv[2]) as Config
const config: Config = {
  functionsPath: configArg.functionsPath || 'src/functions',
  functionFileName: configArg.functionsPath || 'function.js',
  entityNames: configArg.entityNames || [],
  libNames: configArg.libNames || [],
  outputPath: configArg.outputPath || 'output',
}
const { outputPath } = config

if (fs.existsSync(outputPath)) {
  rimraf.sync(outputPath)
}
fs.mkdirSync(outputPath)
fs.mkdirSync(path.join(outputPath, 'functions'))
fs.mkdirSync(path.join(outputPath, 'libs'))

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

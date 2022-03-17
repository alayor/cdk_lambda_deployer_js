import * as fs from 'fs'
import * as path from 'path'
import * as rimraf from 'rimraf'
import { zipFunctions, zipLibs } from './zip_util'
import { generateFunctionsMetadata, generateLibsMetadata } from './generate_metadata'
import { buildLibs } from 'cld_build/libs'
import { outputFolderName } from 'cld_build/constants'

if (fs.existsSync(outputFolderName)) {
  rimraf.sync(outputFolderName)
}
fs.mkdirSync(outputFolderName)
fs.mkdirSync(path.join(outputFolderName, 'functions'))
fs.mkdirSync(path.join(outputFolderName, 'libs'))

zipFunctions().then((_result) => {
  console.log('\u2705 Functions zipped successfully')
})

generateFunctionsMetadata().then((_metadata) => {
  console.log('\u2705 Functions metadata generated successfully')
})

buildLibs().then(() => {
  console.log('\u2705 Libs built successfully')

  generateLibsMetadata().then((_metadata) => {
    console.log('\u2705 Libs metadata generated successfully')
  })

  zipLibs().then((_result) => {
    console.log('\u2705 Libs zipped successfully')
  })
})

process.on('unhandledRejection', (error) => {
  console.log(error)
  process.exit(1)
})

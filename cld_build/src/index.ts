#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import * as rimraf from 'rimraf'
import { zipFunctions, zipLibs } from './zip_util'
import { generateFunctionsMetadata, generateLibsMetadata } from './generate_metadata'
import { buildLibs } from 'cld_build/libs'
import { getConfig } from 'cld_build/config'

const config = getConfig()

const { outputAbsolutePath } = config

if (fs.existsSync(outputAbsolutePath)) {
  rimraf.sync(outputAbsolutePath)
}
fs.mkdirSync(outputAbsolutePath)
fs.mkdirSync(path.join(outputAbsolutePath, 'functions'))
fs.mkdirSync(path.join(outputAbsolutePath, 'libs'))

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

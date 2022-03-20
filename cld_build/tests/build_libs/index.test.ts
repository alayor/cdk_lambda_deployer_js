import * as path from 'path'
import * as libs from 'cld_build/libs'
import * as rimraf from 'rimraf'
import * as Bluebird from 'bluebird'
import { fileExists } from 'cld_build/util'

let projectPath: string
let functionsRelativePath: string
let functionsAbsolutePath: string
let libsRelativePath: string
let libsAbsolutePath: string
let outputRelativePath: string
let outputAbsolutePath: string

beforeEach(async () => {
  projectPath = path.join(__dirname, 'project')
  functionsRelativePath = 'functions'
  functionsAbsolutePath = path.join(projectPath, functionsRelativePath)
  libsRelativePath = 'libs'
  libsAbsolutePath = path.join(projectPath, libsRelativePath)
  outputRelativePath = 'output'
  outputAbsolutePath = path.join(projectPath, outputRelativePath)
  await new Promise((resolve) => rimraf(outputAbsolutePath, resolve))
})

test('it builds libs.', async () => {
  //given
  const config = {
    projectPath,
    functionsRelativePath,
    functionsAbsolutePath,
    libsRelativePath,
    libsAbsolutePath,
    functionFileName: 'index.js',
    entityNames: ['customer', 'deliverer'],
    libNames: ['util', 'db'],
    outputRelativePath,
    outputAbsolutePath,
  }
  //when
  await libs.buildLibs(config)
  //then
  const expectedLibFilePaths = [
    ['libs', 'db', 'nodejs', 'package.json'],
    ['libs', 'db', 'nodejs', 'node_modules', 'lodash', 'package.json'],
    ['libs', 'util', 'nodejs', 'package.json'],
    ['libs', 'util', 'nodejs', 'node_modules', 'lodash', 'package.json'],
  ]
  await Bluebird.each(expectedLibFilePaths, async (expectedLibFilePath) => {
    expect(
      await fileExists(path.join(outputAbsolutePath, ...expectedLibFilePath)),
    ).toBeTruthy()
  })
}, 20000)

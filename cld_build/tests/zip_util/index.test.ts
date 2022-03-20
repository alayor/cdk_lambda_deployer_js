import * as fs from 'fs'
import * as path from 'path'
import * as Bluebird from 'bluebird'
import * as rimraf from 'rimraf'
import * as zip_util from 'cld_build/zip_util'
import { touchFile } from 'cld_build/util'

let projectPath: string
let functionsRelativePath: string
let functionsAbsolutePath: string
let outputRelativePath: string
let outputAbsolutePath: string

beforeEach(async () => {
  projectPath = __dirname
  functionsRelativePath = path.join('input', 'functions')
  functionsAbsolutePath = path.join(projectPath, functionsRelativePath)
  outputRelativePath = 'output'
  outputAbsolutePath = path.join(projectPath, outputRelativePath)
  await new Promise((resolve) => rimraf(outputAbsolutePath, resolve))
})

test('it generates zip files for functions.', async () => {
  //given
  const config = {
    projectPath,
    functionsRelativePath,
    functionsAbsolutePath,
    functionFileName: 'index.js',
    entityNames: ['customer', 'deliverer'],
    libNames: [],
    outputRelativePath,
    outputAbsolutePath,
  }
  //when
  await zip_util.zipFunctions(config)
  //then
  const expectedZipFilePaths = [
    ['customer', 'orders', 'place'],
    ['deliverer', 'auth', 'login'],
  ]
  await Bluebird.each(expectedZipFilePaths, async (expectedZipFilePath) => {
    expect(await fileExistsInOutput(path.join(...expectedZipFilePath, 'function.zip'))).toBeTruthy()
  })
})

function fileExistsInOutput(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.access(path.join(outputAbsolutePath, filePath), fs.constants.F_OK, (err) => {
      console.log('err: ', err)
      resolve(!err)
    })
  })
}

test('it generates zip files for libs.', async () => {
  //given
  const config = {
    projectPath,
    functionsRelativePath,
    functionsAbsolutePath,
    functionFileName: 'index.js',
    entityNames: [],
    libNames: ['db', 'util'],
    outputRelativePath,
    outputAbsolutePath,
  }
  await touchFile(path.join(outputAbsolutePath, 'libs', 'db'), 'nocommit.js')
  await touchFile(path.join(outputAbsolutePath, 'libs', 'util'), 'nocommit.js')
  //when
  await zip_util.zipLibs(config)
  //then
  const expectedZipFilePaths = [
    ['libs', 'db'],
    ['libs', 'util'],
  ]
  await Bluebird.each(expectedZipFilePaths, async (expectedZipFilePath) => {
    expect(await fileExistsInOutput(path.join(...expectedZipFilePath, 'nodejs.zip'))).toBeTruthy()
  })
})

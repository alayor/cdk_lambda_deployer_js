import * as fs from 'fs'
import * as path from 'path'
import * as Bluebird from 'bluebird'
import * as rimraf from 'rimraf'
import * as zip_util from 'cld_build/zip_util'

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
  const expectedZipFiles = [
    ['customer', 'orders', 'place'],
    ['deliverer', 'auth', 'login'],
  ]
  await Bluebird.each(expectedZipFiles, async (expectedZipFile) => {
    expect(await fileExistsInOutput(path.join(...expectedZipFile, 'function.zip'))).toBeTruthy()
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

import * as _ from 'lodash'
import * as path from 'path'
import * as libs from 'cld_build/libs'

let projectPath: string
let functionsRelativePath: string
let functionsAbsolutePath: string
let libsRelativePath: string
let libsAbsolutePath: string
let outputRelativePath: string
let outputAbsolutePath: string

beforeEach(() => {
  projectPath = __dirname
  functionsRelativePath = path.join('input', 'functions')
  functionsAbsolutePath = path.join(projectPath, functionsRelativePath)
  libsRelativePath = path.join('input', 'libs')
  libsAbsolutePath = path.join(projectPath, libsRelativePath)
  outputRelativePath = 'output'
  outputAbsolutePath = path.join(projectPath, outputRelativePath)
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
})

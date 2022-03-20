import * as _ from 'lodash'
import * as path from 'path'
import * as libs from 'cld_build/libs'
import * as rimraf from "rimraf";

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
})

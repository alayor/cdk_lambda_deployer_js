import * as zip_util from 'cld_build/zip_util'
import * as path from 'path'

let projectPath: string
let functionsRelativePath: string
let functionsAbsolutePath: string
let outputRelativePath: string
let outputAbsolutePath: string

beforeEach(() => {
  projectPath = __dirname
  functionsRelativePath = path.join('input', 'functions')
  functionsAbsolutePath = path.join(projectPath, functionsRelativePath)
  outputRelativePath = 'output'
  outputAbsolutePath = path.join(projectPath, outputRelativePath)
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
})

import * as zip_util from 'cld_build/zip_util'
import * as path from 'path'

let inputPath: string
let outputPath: string

beforeEach(() => {
  inputPath = path.join(__dirname, 'input')
  outputPath = path.join(__dirname, 'output')
})

test('it generates zip files for functions.', async () => {
  //given
  const config = {
    functionsPath: path.join(inputPath, 'functions'),
    functionFileName: 'index.js',
    entityNames: ['customer', 'deliverer'],
    libNames: [],
    outputPath,
  }
  //when
  await zip_util.zipFunctions(config)
})

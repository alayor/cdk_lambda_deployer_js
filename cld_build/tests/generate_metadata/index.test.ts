import * as path from 'path'
import * as generate_metadata from 'cld_build/generate_metadata'

test('it generates functions metadata.', async () => {
  //given
  const config = {
    functionsFolder: path.join(__dirname, 'input', 'functions'),
    modelNames: ['customer'],
    outputFolder: path.join(__dirname, 'output'),
  }
  //when
  await generate_metadata.generateFunctionsMetadata(config)
  //then
})

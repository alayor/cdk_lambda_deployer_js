import * as generate_metadata from 'cld_build/generate_metadata'

test('it generates functions metadata.', async () => {
  await generate_metadata.generateFunctionsMetadata()
})

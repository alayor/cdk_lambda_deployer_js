import * as _ from 'lodash'
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
  const metadata = require(path.join(__dirname, 'output', 'functions', 'metadata.json'))
  expect(_.get(metadata, 'customer.orders_place.hash')).toBeTruthy()
  expect(_.get(metadata, 'customer.orders_place.zipPath')).toEqual(
    'functions/customer/orders/place/function.zip',
  )
})

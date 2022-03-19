import * as _ from 'lodash'
import * as path from 'path'
import * as generate_metadata from 'cld_build/generate_metadata'

let inputPath: string
let outputPath: string

beforeEach(() => {
  inputPath = path.join(__dirname, 'input')
  outputPath = path.join(__dirname, 'output')
})

test('it generates functions metadata.', async () => {
  //given
  const config = {
    functionsPath: path.join(inputPath, 'functions'),
    functionFileName: 'index.js',
    entityNames: ['customer', 'deliverer'],
    libNames: [],
    outputPath,
  }
  //when
  await generate_metadata.generateFunctionsMetadata(config)
  //then
  const metadata = require(path.join(outputPath, 'functions', 'metadata.json'))
  expect(_.get(metadata, 'customer.orders_place.hash')).toBeTruthy()
  expect(_.get(metadata, 'customer.orders_place.zipPath')).toEqual(
    'functions/customer/orders/place/function.zip',
  )
  expect(_.get(metadata, 'deliverer.auth_login.hash')).toBeTruthy()
  expect(_.get(metadata, 'deliverer.auth_login.zipPath')).toEqual(
    'functions/deliverer/auth/login/function.zip',
  )
})

test('it generates libs metadata.', async () => {
  //given
  const config = {
    functionsPath: path.join(inputPath, 'functions'),
    functionFileName: 'index.js',
    entityNames: ['customer', 'deliverer'],
    libNames: ['db', 'util'],
    outputPath,
  }
  //when
  await generate_metadata.generateLibsMetadata(config)
  //then
  const metadata = require(path.join(outputPath, 'libs', 'metadata.json'))
  expect(_.get(metadata, 'db.files.connection.hash')).toBeTruthy()
  expect(_.get(metadata, 'util.files.util.hash')).toBeTruthy()
})

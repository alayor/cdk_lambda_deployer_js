import * as _ from 'lodash'
import * as path from 'path'
import * as generate_metadata from 'cld_build/generate_metadata'
import { makeDirRecursive, touchFile } from 'cld_build/util'
import * as rimraf from 'rimraf'
import { initializeConfig } from '../common'
import { Config } from 'cld_build/types'

let config: Config

beforeEach(async () => {
  config = initializeConfig(__dirname)
  const { outputAbsolutePath } = config

  await new Promise((resolve) => rimraf(outputAbsolutePath, resolve))
  await makeDirRecursive(path.join(outputAbsolutePath, 'functions'))
})

afterEach(async () => {
  const { outputAbsolutePath } = config
  await new Promise((resolve) => rimraf(outputAbsolutePath, resolve))
})

test('it generates functions metadata.', async () => {
  //given
  const { outputAbsolutePath } = config
  //when
  await generate_metadata.generateFunctionsMetadata(config)
  //then
  const metadata = require(path.join(outputAbsolutePath, 'functions', 'metadata.json'))
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
  const { outputAbsolutePath } = config
  await touchFile(path.join(outputAbsolutePath, 'libs', 'db', 'nodejs'), 'connection.js')
  await touchFile(path.join(outputAbsolutePath, 'libs', 'util', 'nodejs'), 'util.js')
  //when
  await generate_metadata.generateLibsMetadata(config)
  //then
  const metadata = require(path.join(outputAbsolutePath, 'libs', 'metadata.json'))
  expect(_.get(metadata, 'db.files.connection.hash')).toBeTruthy()
  expect(_.get(metadata, 'util.files.util.hash')).toBeTruthy()
})

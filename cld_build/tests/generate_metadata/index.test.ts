import * as fs from 'fs'
import * as path from 'path'
import * as _ from 'lodash'
import * as generate_metadata from 'cld_build/generate_metadata'
import { makeDirRecursive, touchFile } from 'cld_build/util'
import * as rimraf from 'rimraf'
import { initializeConfig } from '../common'
import { Config } from 'cld_build/types'
import { generateFunctionGroupLibsMetadata } from 'cld_build/generate_metadata'

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
  const metadata = JSON.parse(
    fs.readFileSync(path.join(outputAbsolutePath, 'metadata.json')).toString(),
  )
  expect(_.get(metadata, 'functions.customer.orders_place.hash')).toBeTruthy()
  expect(_.get(metadata, 'functions.customer.orders_place.zipPath')).toEqual(
    'functions/customer/orders/place/function.zip',
  )
  expect(_.get(metadata, 'functions.deliverer.auth_login.hash')).toBeTruthy()
  expect(_.get(metadata, 'functions.deliverer.auth_login.zipPath')).toEqual(
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
  const metadata = JSON.parse(
    fs.readFileSync(path.join(outputAbsolutePath, 'metadata.json')).toString(),
  )
  console.log({ metadata })
  expect(_.get(metadata, 'libs.db.files.connection.hash')).toBeTruthy()
  expect(_.get(metadata, 'libs.util.files.util.hash')).toBeTruthy()
})

test('it generates functionGroupLibs metadata.', async () => {
  //given
  const { outputAbsolutePath } = config
  //when
  await generate_metadata.generateFunctionGroupLibsMetadata(config)
  //then
  const metadata = JSON.parse(
    fs.readFileSync(path.join(outputAbsolutePath, 'metadata.json')).toString(),
  )
  console.log({ metadata })
  expect(_.get(metadata, 'functionGroupLibs.customer[0]')).toEqual('util')
  expect(_.get(metadata, 'functionGroupLibs.customer[1]')).toEqual('db')
  expect(_.get(metadata, 'functionGroupLibs.deliverer[0]')).toEqual('util')
  expect(_.get(metadata, 'functionGroupLibs.deliverer[1]')).toEqual('db')
})

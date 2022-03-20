import * as path from 'path'
import * as Bluebird from 'bluebird'
import * as rimraf from 'rimraf'
import * as zip_util from 'cld_build/zip_util'
import { fileExists, touchFile } from 'cld_build/util'
import {initializeConfig} from "../common";
import {Config} from "cld_build/types";

let config: Config

beforeEach(async () => {
  config = initializeConfig(__dirname)
  const { outputAbsolutePath } = config

  await new Promise((resolve) => rimraf(outputAbsolutePath, resolve))
})

test('it generates zip files for functions.', async () => {
  //given
  const { outputAbsolutePath } = config
  //when
  await zip_util.zipFunctions(config)
  //then
  const expectedZipFilePaths = [
    ['customer', 'orders', 'place'],
    ['deliverer', 'auth', 'login'],
  ]
  await Bluebird.each(expectedZipFilePaths, async (expectedZipFilePath) => {
    expect(
      await fileExists(path.join(outputAbsolutePath, ...expectedZipFilePath, 'function.zip')),
    ).toBeTruthy()
  })
})

test('it generates zip files for libs.', async () => {
  //given
  const { outputAbsolutePath } = config
  await touchFile(path.join(outputAbsolutePath, 'libs', 'db'), 'nocommit.js')
  await touchFile(path.join(outputAbsolutePath, 'libs', 'util'), 'nocommit.js')
  //when
  await zip_util.zipLibs(config)
  //then
  const expectedZipFilePaths = [
    ['libs', 'db'],
    ['libs', 'util'],
  ]
  await Bluebird.each(expectedZipFilePaths, async (expectedZipFilePath) => {
    expect(
      await fileExists(path.join(outputAbsolutePath, ...expectedZipFilePath, 'nodejs.zip')),
    ).toBeTruthy()
  })
})

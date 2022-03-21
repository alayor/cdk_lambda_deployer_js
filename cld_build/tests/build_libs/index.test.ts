import * as path from 'path'
import * as libs from 'cld_build/libs'
import * as rimraf from 'rimraf'
import * as Bluebird from 'bluebird'
import { fileExists } from 'cld_build/util'
import { Config } from 'cld_build/types'
import { initializeConfig } from '../common'

let config: Config

beforeEach(async () => {
  config = initializeConfig(__dirname)
  await new Promise((resolve) => rimraf(config.outputAbsolutePath, resolve))
}, 10000)

test('it builds libs.', async () => {
  //given
  const { outputAbsolutePath } = config
  //when
  await libs.buildLibs(config)
  //then
  const expectedLibFilePaths = [
    ['libs', 'db', 'nodejs', 'package.json'],
    ['libs', 'db', 'nodejs', 'node_modules', 'lodash', 'package.json'],
    ['libs', 'util', 'nodejs', 'package.json'],
    ['libs', 'util', 'nodejs', 'node_modules', 'lodash', 'package.json'],
  ]
  await Bluebird.each(expectedLibFilePaths, async (expectedLibFilePath) => {
    expect(await fileExists(path.join(outputAbsolutePath, ...expectedLibFilePath))).toBeTruthy()
  })
}, 20000)

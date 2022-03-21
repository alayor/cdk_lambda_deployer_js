import * as path from 'path'
import { initializeConfig } from '../common'
import * as rimraf from 'rimraf'
import { Config } from 'cld_build/types'
import { exec } from 'child_process'
import * as Bluebird from 'bluebird'
import { fileExists } from 'cld_build/util'

let outputAbsolutePath: string
beforeEach(async () => {
  outputAbsolutePath = path.join(__dirname, 'project', 'cld_output')
  await new Promise((resolve) => rimraf(outputAbsolutePath, resolve))
})

test('it builds the lambda functions and layer sources.', async () => {
  //when
  await new Promise((resolve, reject) => {
    exec(
      `ts-node cld_build/src/index.ts --config=${path.join(__dirname, 'project', 'cld.json')}`,
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${JSON.stringify(error, null, 2)}`)
          return reject(error)
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`)
          return reject(error)
        }
        resolve(stdout)
      },
    )
  })
  //then
  const expectedFilePaths = [
    ['functions', 'customer', 'orders', 'place', 'function.zip'],
    ['functions', 'deliverer', 'auth', 'login', 'function.zip'],
    ['functions', 'metadata.json'],
    ['libs', 'db', 'nodejs.zip'],
    ['libs', 'util', 'nodejs.zip'],
    ['libs', 'metadata.json'],
  ]
  await Bluebird.each(expectedFilePaths, async (expectedFilePath) => {
    expect(await fileExists(path.join(outputAbsolutePath, ...expectedFilePath))).toBeTruthy()
  })
}, 40000)

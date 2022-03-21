import * as path from 'path'
import { initializeConfig } from '../common'
import * as rimraf from 'rimraf'
import { Config } from 'cld_build/types'
import { exec } from 'child_process'

let config: Config

beforeEach(async () => {
  config = initializeConfig(__dirname)
  await new Promise((resolve) => rimraf(config.outputAbsolutePath, resolve))
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

}, 30000)

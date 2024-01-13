import * as fs from 'fs'
import * as path from 'path'
import * as _ from 'lodash'
import * as rimraf from 'rimraf'
import { exec } from 'child_process'
import * as Bluebird from 'bluebird'
import { fileExists } from 'cld_build/util'

let outputAbsolutePath: string
beforeEach(async () => {
  outputAbsolutePath = path.join(__dirname, 'project', 'build/cld')
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
    ['libs', 'db', 'nodejs.zip'],
    ['libs', 'util', 'nodejs.zip'],
    ['metadata.json'],
  ]
  await Bluebird.each(expectedFilePaths, async (expectedFilePath) => {
    expect(await fileExists(path.join(outputAbsolutePath, ...expectedFilePath))).toBeTruthy()
  })
  // and then
  const metadata = JSON.parse(
    fs.readFileSync(path.join(outputAbsolutePath, 'metadata.json')).toString(),
  )
  console.log({ metadata })
  expect(Object.keys(_.get(metadata, 'functions')).length).toEqual(2)
  expect(Object.keys(_.get(metadata, 'libs')).length).toEqual(2)
  expect(Object.keys(_.get(metadata, 'functionGroupLibs')).length).toEqual(2)
}, 120000)

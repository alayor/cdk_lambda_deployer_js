import { s3 } from 'cdk_lib/_util/tests/mocking/aws_sdk' // this must be at the top
import { when } from 'jest-when'
import {
  FUNCTIONS_CHANGES_SUMMARY_FILE_NAME,
  FUNCTIONS_METADATA_FILE_NAME,
  LOCK_FILE,
  PROD_BUCKET,
  STAGE_BUCKET,
} from '../src/constants'
import { handler } from '../src/index'
import {
  whenS3GetObjectReturnsBody,
  whenS3GetObjectThrowsError,
} from 'cdk_lib/_util/tests/mocking/s3'
import { Metadata } from '../src/types'
import { returnPromiseObject } from 'cdk_lib/_util/tests/mocking/promises'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.putObject).mockImplementation(returnPromiseObject({}))
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  when(s3.deleteObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  whenS3GetObjectThrowsError({ Bucket: PROD_BUCKET, Key: LOCK_FILE }, { code: 'NoSuchKey' })
})

test('Do not save metadata if changes summary has no changes.', async () => {
  //given
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod3.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler(null)
  //then
  expect(s3.putObject).not.toBeCalled()
})

test('Save -created- summary changes when prod metadata is not existing.', async () => {
  //given
  const metadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  whenS3GetObjectThrowsError(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    { code: 'NoSuchKey' },
  )
  //when
  await handler(null)
  //then
  expectNewChangesSummaryToBe(
    JSON.stringify(require('./data/changes_summary/brand_new_functions.json')),
  )
})

function expectNewChangesSummaryToBe(body: string) {
  expect(s3.putObject).toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: FUNCTIONS_CHANGES_SUMMARY_FILE_NAME,
    Body: body,
  })
}

test('Save -created- summary changes when stage metadata has new functions.', async () => {
  //given
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler(null)
  //then
  expectNewChangesSummaryToBe(JSON.stringify(require('./data/changes_summary/new_functions.json')))
})

test('Save -updated- summary changes when stage metadata has new versions.', async () => {
  //given
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '2' }))
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
      { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
      JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod2.json') as Metadata
  whenS3GetObjectReturnsBody(
      { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
      JSON.stringify(prodMetadata),
  )
  //when
  await handler(null)
  //then
  expectNewChangesSummaryToBe(JSON.stringify(require('./data/changes_summary/new_functions_versions.json')))
})

test('Save -delete- summary changes when stage metadata has no functions as in prod metadata.', async () => {
  //given
  const stageMetadata = require('./data/metadata/stage2.json') as Metadata
  whenS3GetObjectReturnsBody(
      { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
      JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod2.json') as Metadata
  whenS3GetObjectReturnsBody(
      { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
      JSON.stringify(prodMetadata),
  )
  //when
  await handler(null)
  //then
  expectNewChangesSummaryToBe(JSON.stringify(require('./data/changes_summary/deleted_functions.json')))
})

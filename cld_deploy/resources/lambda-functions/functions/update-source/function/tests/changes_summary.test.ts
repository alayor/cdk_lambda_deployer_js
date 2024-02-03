import { s3 } from 'cld_deploy/_util/tests/mocking/aws_sdk' // this must be at the top
import { when } from 'jest-when'
import {
  FUNCTIONS_CHANGES_SUMMARY_FILE_NAME,
  METADATA_FILE_NAME,
  LOCK_FILE,
} from '../src/constants'
import { handler } from '../src/index'
import {
  whenS3GetObjectReturnsBody,
  whenS3GetObjectThrowsError,
} from 'cld_deploy/_util/tests/mocking/s3'
import { Metadata } from '../src/types'
import { returnPromiseObject } from 'cld_deploy/_util/tests/mocking/promises'

const prodBucketName = 'prodBucketName'
const stageBucketName = 'stageBucketName'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.putObject).mockImplementation(returnPromiseObject({}))
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  when(s3.deleteObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  whenS3GetObjectThrowsError({ Bucket: prodBucketName, Key: LOCK_FILE }, { code: 'NoSuchKey' })
})

test('Do not save metadata if changes summary has no changes.', async () => {
  //given
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: stageBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod3.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expect(s3.putObject).not.toBeCalled()
})

test('Save -created- summary changes when prod metadata is not existing.', async () => {
  //given
  const metadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: stageBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  whenS3GetObjectThrowsError(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    { code: 'NoSuchKey' },
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expectNewChangesSummaryToBe(
    JSON.stringify(require('./data/changes_summary/brand_new_functions.json')),
  )
})

function expectNewChangesSummaryToBe(body: string) {
  expect(s3.putObject).toBeCalledWith({
    Bucket: prodBucketName,
    Key: FUNCTIONS_CHANGES_SUMMARY_FILE_NAME,
    Body: body,
  })
}

test('Save -created- summary changes when stage metadata has new functions.', async () => {
  //given
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: stageBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expectNewChangesSummaryToBe(JSON.stringify(require('./data/changes_summary/new_functions.json')))
})

test('Save -updated- summary changes when stage metadata has new versions.', async () => {
  //given
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '2' }))
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: stageBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod2.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expectNewChangesSummaryToBe(
    JSON.stringify(require('./data/changes_summary/new_functions_versions.json')),
  )
})

test('Save -delete- summary changes when stage metadata has no functions as in prod metadata.', async () => {
  //given
  const stageMetadata = require('./data/metadata/stage2.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: stageBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod2.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expectNewChangesSummaryToBe(
    JSON.stringify(require('./data/changes_summary/deleted_functions.json')),
  )
})

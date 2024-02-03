import { s3 } from 'cld_deploy/_util/tests/mocking/aws_sdk' // this must be at the top
import { when } from 'jest-when'
import { METADATA_FILE_NAME, LOCK_FILE } from '../src/constants'
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
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  when(s3.putObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
})

test('New Prod metadata is created from stage metadata.', async () => {
  //given
  whenS3GetObjectThrowsError({ Bucket: prodBucketName, Key: LOCK_FILE }, { code: 'NoSuchKey' })
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '2' }))
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: stageBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
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
  expectNewProdMetadataToBe(JSON.stringify(require('./data/metadata/new_prod_from_stage1.json')))
})

test('New Prod metadata is created from stage metadata when prod metadata has only functions.', async () => {
  //given
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '2' }))
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: stageBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod4.json') as Metadata
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
  expectNewProdMetadataToBe(JSON.stringify(require('./data/metadata/new_prod_from_stage2.json')))
})

function expectNewProdMetadataToBe(body: string) {
  expect(s3.putObject).toBeCalledWith({
    Bucket: prodBucketName,
    Key: METADATA_FILE_NAME,
    Body: body,
  })
}

test('Metadata versions are updated in prod metadata.', async () => {
  //given
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '2' }))
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
  expectNewProdMetadataToBe(
    JSON.stringify(require('./data/metadata/prod_from_stage1_and_prod3.json')),
  )
})

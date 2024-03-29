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
  when(s3.putObject).mockImplementation(returnPromiseObject({}))
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  when(s3.deleteObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  whenS3GetObjectThrowsError({ Bucket: prodBucketName, Key: LOCK_FILE }, { code: 'NoSuchKey' })
})

test('New Prod metadata is created from stage metadata.', async () => {
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
  expectNewProdMetadataToBe(JSON.stringify(require('./data/metadata/new_prod_from_stage1.json')))
})

function expectNewProdMetadataToBe(body: string) {
  expect(s3.putObject).toBeCalledWith({
    Bucket: prodBucketName,
    Key: METADATA_FILE_NAME,
    Body: body,
  })
}

test('Prod metadata is updated from stage metadata with new functions.', async () => {
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
  expectNewProdMetadataToBe(
    JSON.stringify(require('./data/metadata/updated_prod1_from_stage1.json')),
  )
})

test('Prod metadata is updated with new versions from stage metadata with updated function hash.', async () => {
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
  expectNewProdMetadataToBe(
    JSON.stringify(require('./data/metadata/updated_prod2_from_stage1.json')),
  )
})

test('Prod metadata functions are removed if they do not exist on stage metadata.', async () => {
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
  expectNewProdMetadataToBe(
    JSON.stringify(require('./data/metadata/updated_prod2_from_stage2.json')),
  )
})

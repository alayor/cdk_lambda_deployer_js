import { s3 } from 'cdk_lib/_util/tests/mocking/aws_sdk' // this must be at the top
import { LIBS_METADATA_FILE_NAME, LOCK_FILE, PROD_BUCKET, STAGE_BUCKET } from '../src/constants'
import { handler } from '../src/index'
import {
  whenS3GetObjectReturnsBody,
  whenS3GetObjectThrowsError,
} from 'cdk_lib/_util/tests/mocking/s3'
import { Metadata } from '../src/types'
import { when } from 'jest-when'
import { returnPromiseObject } from 'cdk_lib/_util/tests/mocking/promises'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  whenS3GetObjectThrowsError({ Bucket: PROD_BUCKET, Key: LOCK_FILE }, { code: 'NoSuchKey' })
})

test('Do Not Update Layer Version If No Changes In Metadata.', async () => {
  //given
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: STAGE_BUCKET, Key: LIBS_METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: LIBS_METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler(null)
  //then
  expect(s3.copyObject).not.toBeCalled()
})

test('Update Layer Version If Changes In New Functions In Metadata.', async () => {
  //given
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: STAGE_BUCKET, Key: LIBS_METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod2.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: LIBS_METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler(null)
  //then
  expect(s3.copyObject).toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: `libs/admin_lib/nodejs.zip`,
    CopySource: `${STAGE_BUCKET}/libs/admin_lib/nodejs.zip`,
  })
})

test('Update Layer Version If Changes In Hashes Are Different.', async () => {
//given
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
      { Bucket: STAGE_BUCKET, Key: LIBS_METADATA_FILE_NAME },
      JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod3.json') as Metadata
  whenS3GetObjectReturnsBody(
      { Bucket: PROD_BUCKET, Key: LIBS_METADATA_FILE_NAME },
      JSON.stringify(prodMetadata),
  )
  //when
  await handler(null)
  //then
  expect(s3.copyObject).toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: `libs/deliverer_lib/nodejs.zip`,
    CopySource: `${STAGE_BUCKET}/libs/deliverer_lib/nodejs.zip`,
  })
})

import { s3 } from 'cdk_lib/_util/tests/mocking/aws_sdk' // this must be at the top
import { LIBS_METADATA_FILE_NAME, LOCK_FILE, PROD_BUCKET, STAGE_BUCKET } from '../src/constants'
import { handler } from '../src/index'
import {
  whenS3GetObjectReturnsBody,
  whenS3GetObjectThrowsError,
} from 'cdk_lib/_util/tests/mocking/s3'
import { Metadata } from '../src/types'

beforeEach(() => {
  jest.clearAllMocks()
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
    { Bucket: STAGE_BUCKET, Key: LIBS_METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler(null)
  //then
  expect(s3.copyObject).not.toBeCalled()
})

const { s3 } = require('cdk_lib/_util/tests/mocking/aws_sdk')
import {
  FUNCTIONS_METADATA_FILE_NAME,
  LOCK_FILE,
  PROD_BUCKET,
  STAGE_BUCKET,
} from '../src/constants'
import { handler } from '../src'
import {
  whenS3GetObjectReturnsPromiseObject,
  whenS3GetObjectThrowsError,
} from 'cdk_lib/_util/tests/mocking/s3'

beforeEach(() => {
  jest.clearAllMocks()
  whenS3GetObjectReturnsPromiseObject(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    {},
  )
  whenS3GetObjectReturnsPromiseObject(
    { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    {},
  )
})

test('Do Not Get Metadata When Lock File Exists', async () => {
  //given
  whenS3GetObjectReturnsPromiseObject({ Bucket: PROD_BUCKET, Key: LOCK_FILE }, {}) // No error thrown
  //when
  await handler(null)
  //then
  expect(s3.getObject).not.toBeCalledWith({
    Bucket: STAGE_BUCKET,
    Key: FUNCTIONS_METADATA_FILE_NAME,
  })
})

test('Get Metadata When Lock File Does Not Exist', async () => {
  //given
  whenS3GetObjectThrowsError({ Bucket: PROD_BUCKET, Key: LOCK_FILE }, { code: 'NoSuchKey' })
  //when
  await handler(null)
  //then
  expect(s3.getObject).toBeCalledWith({
    Bucket: STAGE_BUCKET,
    Key: FUNCTIONS_METADATA_FILE_NAME,
  })
})

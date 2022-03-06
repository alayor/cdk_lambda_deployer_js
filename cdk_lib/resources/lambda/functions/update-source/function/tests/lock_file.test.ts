import { when } from 'jest-when'
import {
  FUNCTIONS_METADATA_FILE_NAME,
  LOCK_FILE,
  PROD_BUCKET,
  STAGE_BUCKET,
} from '../src/constants'
import {
  returnPromiseObject,
  returnPromiseObjectWithError,
} from 'cdk_lib/_util/tests/mocking/promises'
import { s3 } from 'cdk_lib/_util/tests/mocking/aws_sdk'
import { handler } from '../src'

beforeEach(() => {
  when(s3.getObject)
    .calledWith({ Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME })
    .mockImplementation(returnPromiseObject(jest.mocked({})))
  when(s3.getObject)
    .calledWith({ Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME })
    .mockImplementation(returnPromiseObject(jest.mocked({})))
})

test('Do Not Get Metadata When Lock File Exists', async () => {
  //given
  when(s3.getObject)
    .calledWith({ Bucket: PROD_BUCKET, Key: LOCK_FILE })
    .mockImplementation(returnPromiseObject()) // No error thrown
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
  when(s3.getObject)
    .calledWith({ Bucket: PROD_BUCKET, Key: LOCK_FILE })
    .mockImplementation(returnPromiseObjectWithError({ code: 'NoSuchKey' }))
  //when
  await handler(null)
  //then
  expect(s3.getObject).toBeCalledWith({
    Bucket: STAGE_BUCKET,
    Key: FUNCTIONS_METADATA_FILE_NAME,
  })
})

import { handler } from '../src'
import { when } from 'jest-when'
import {
  FUNCTIONS_METADATA_FILE_NAME,
  LOCK_FILE,
  PROD_BUCKET,
  STAGE_BUCKET,
} from '../src/constants'
import { returnPromiseObject, returnPromiseObjectWithError } from 'cdk_lib/_util/tests/mockings'

const mS3Instance = {
  getObject: jest.fn(),
  promise: jest.fn(),
}

jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn(() => mS3Instance),
  }
})

beforeEach(() => {
  when(mS3Instance.getObject)
    .calledWith({ Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME })
    .mockImplementation(returnPromiseObject(jest.mocked({})))
  when(mS3Instance.getObject)
    .calledWith({ Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME })
    .mockImplementation(returnPromiseObject(jest.mocked({})))
})

test('Do Not Get Metadata When Lock File Exists', async () => {
  //given
  when(mS3Instance.getObject)
    .calledWith({ Bucket: PROD_BUCKET, Key: LOCK_FILE })
    .mockImplementation(returnPromiseObject()) // No error thrown
  //when
  await handler(null)
  //then
  expect(mS3Instance.getObject).not.toBeCalledWith({
    Bucket: STAGE_BUCKET,
    Key: FUNCTIONS_METADATA_FILE_NAME,
  })
})

test('Get Metadata When Lock File Does Not Exist', async () => {
  //given
  when(mS3Instance.getObject)
    .calledWith({ Bucket: PROD_BUCKET, Key: LOCK_FILE })
    .mockImplementation(returnPromiseObjectWithError({ code: 'NoSuchKey' }))
  //when
  await handler(null)
  //then
  expect(mS3Instance.getObject).toBeCalledWith({
    Bucket: STAGE_BUCKET,
    Key: FUNCTIONS_METADATA_FILE_NAME,
  })
})

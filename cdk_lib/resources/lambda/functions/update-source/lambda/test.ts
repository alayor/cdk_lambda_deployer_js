import { handler } from './function'
import { when } from 'jest-when'
import {FUNCTIONS_METADATA_FILE_NAME, LOCK_FILE, PROD_BUCKET, STAGE_BUCKET} from './constants'
import { returnPromiseObject } from '../../../_util/test/mockings'

const mS3Instance = {
  getObject: jest.fn(),
  promise: jest.fn(),
}

jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn(() => mS3Instance),
  }
})

beforeEach(() => {})

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

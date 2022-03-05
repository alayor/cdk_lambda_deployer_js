import { handler } from './function'
import { when } from 'jest-when'
import { LOCK_FILE, PROD_BUCKET } from './constants'

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
    .mockImplementation(() => ({
      promise: () => Promise.resolve(), // No error thrown
    }))
  //when
  const response = await handler(null)
  //then
  expect(response).toEqual('locked')
})

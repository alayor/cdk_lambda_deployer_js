import { handler } from './function'

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

test('Test 1', async () => {
  mS3Instance.getObject.mockImplementation(() => ({
    promise: () => Promise.resolve('mock'),
  }))
  const response = await handler(null)
  expect(response).toEqual('mock')
})

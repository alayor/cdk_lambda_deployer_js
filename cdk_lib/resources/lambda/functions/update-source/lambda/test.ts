import { handler } from './function'

const mS3Instance = {
  getObject: jest.fn().mockReturnThis(),
  promise: jest.fn(),
}

jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn(() => mS3Instance),
  }
})

beforeEach(() => {})

test('Test 1', async () => {
  mS3Instance.promise.mockResolvedValueOnce('fake response')
  const response = await handler(null)
  expect(response).toEqual('fake response')
})

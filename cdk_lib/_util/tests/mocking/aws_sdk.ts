const s3 = {
  getObject: jest.fn(),
  promise: jest.fn(),
}

jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn(() => s3),
  }
})

export { s3 }

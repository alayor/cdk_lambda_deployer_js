const s3 = {
  getObject: jest.fn(),
  copyObject: jest.fn(),
  deleteObject: jest.fn(),
  putObject: jest.fn(),
  promise: jest.fn(),
}

const lambda = {
  createFunction: jest.fn(),
  updateFunctionCode: jest.fn(),
  deleteFunction: jest.fn(),
  getLayerVersion: jest.fn(),
  publishLayerVersion: jest.fn(),
  updateFunctionConfiguration: jest.fn(),
  promise: jest.fn(),
}

jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn(() => s3),
    Lambda: jest.fn(() => lambda),
  }
})

export { s3, lambda }

import { s3 } from 'cld_deploy/_util/tests/mocking/aws_sdk' // this must be at the top
import { Metadata } from '../src/types'
import { METADATA_FILE_NAME, LOCK_FILE } from '../src/constants'
import { handler } from '../src'
import {
  whenS3GetObjectReturnsBody,
  whenS3GetObjectReturnsPromiseObject,
  whenS3GetObjectThrowsError,
} from 'cld_deploy/_util/tests/mocking/s3'
import { when } from 'jest-when'
import { returnPromiseObject } from 'cld_deploy/_util/tests/mocking/promises'

const prodBucketName = 'prodBucketName'
const stageBucketName = 'stageBucketName'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.putObject).mockImplementation(returnPromiseObject({}))
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
})

test('Do Not Get Metadata When Lock File Exists', async () => {
  //given
  whenS3GetObjectReturnsPromiseObject({ Bucket: prodBucketName, Key: LOCK_FILE }, {}) // No error thrown
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expect(s3.getObject).not.toBeCalledWith({
    Bucket: stageBucketName,
    Key: METADATA_FILE_NAME,
  })
})

test('Get Metadata When Lock File Does Not Exist', async () => {
  //given
  whenS3GetObjectThrowsError({ Bucket: prodBucketName, Key: LOCK_FILE }, { code: 'NoSuchKey' })
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expect(s3.getObject).toBeCalledWith({
    Bucket: stageBucketName,
    Key: METADATA_FILE_NAME,
  })
})

test('Create lock file.', async () => {
  //given
  const metadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: stageBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  whenS3GetObjectThrowsError(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    { code: 'NoSuchKey' },
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expect(s3.putObject).toBeCalledWith({
    Bucket: prodBucketName,
    Key: LOCK_FILE,
    Body: '',
  })
})

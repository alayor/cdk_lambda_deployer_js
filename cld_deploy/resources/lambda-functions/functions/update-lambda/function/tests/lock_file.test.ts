import { lambda, s3 } from 'cld_deploy/_util/tests/mocking/aws_sdk' // this must be at the top
import { when } from 'jest-when'
import {
  FUNCTIONS_CHANGES_SUMMARY_FILE_NAME,
  METADATA_FILE_NAME,
  LOCK_FILE,
} from '../src/constants'
import { handler } from '../src/index'
import { whenS3GetObjectReturnsBody } from 'cld_deploy/_util/tests/mocking/s3'
import { Metadata } from '../src/types'
import { returnPromiseObject } from 'cld_deploy/_util/tests/mocking/promises'

const prodBucketName = 'prodBucketName'
const stageBucketName = 'stageBucketName'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.deleteObject).mockImplementation(returnPromiseObject({}))
  when(lambda.createFunction).mockImplementation(returnPromiseObject({}))
  when(lambda.updateFunctionCode).mockImplementation(returnPromiseObject({}))
  when(lambda.deleteFunction).mockImplementation(returnPromiseObject({}))
})

test('Do not get delete lock file  if changes summary has no changes.', async () => {
  //given
  const stageMetadata = require('./data/empty_summary_changes.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: FUNCTIONS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expect(s3.deleteObject).not.toBeCalledWith({
    Bucket: prodBucketName,
    Key: LOCK_FILE,
  })
})

test('Delete lock file  if changes summary has no changes.', async () => {
  //given
  const summaryChanges = require('./data/summary_changes.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: FUNCTIONS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(summaryChanges),
  )
  const metadata = require('./data/metadata1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expect(s3.deleteObject).toBeCalledWith({
    Bucket: prodBucketName,
    Key: LOCK_FILE,
  })
})

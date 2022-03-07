import { s3 } from 'cdk_lib/_util/tests/mocking/aws_sdk' // this must be at the top
import { when } from 'jest-when'
import {
  FUNCTIONS_CHANGES_SUMMARY_FILE_NAME,
  FUNCTIONS_METADATA_FILE_NAME,
  LOCK_FILE,
  PROD_BUCKET,
  STAGE_BUCKET,
} from '../src/constants'
import { handler } from '../src/index'
import {
  whenS3GetObjectReturnsBody,
  whenS3GetObjectThrowsError,
} from 'cdk_lib/_util/tests/mocking/s3'
import { Metadata } from '../src/types'
import { returnPromiseObject } from 'cdk_lib/_util/tests/mocking/promises'

beforeEach(() => {
  jest.clearAllMocks()
})

test('Do not get metadata if changes summary has no changes.', async () => {
  //given
  const stageMetadata = require('./data/no_changes_in_summary.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  //when
  await handler(null)
  //then
  expect(s3.putObject).not.toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: FUNCTIONS_METADATA_FILE_NAME,
  })
})

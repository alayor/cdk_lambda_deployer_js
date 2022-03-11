import { s3 } from 'cdk_lib/_util/tests/mocking/aws_sdk'
import { when } from 'jest-when'
import { returnPromiseObject } from 'cdk_lib/_util/tests/mocking/promises'
import { Metadata } from '../src/types'
import { whenS3GetObjectReturnsBody } from 'cdk_lib/_util/tests/mocking/s3'
import {
  LIBS_CHANGES_SUMMARY_FILE_NAME,
  LIBS_METADATA_FILE_NAME,
  PROD_BUCKET,
  STAGE_BUCKET,
} from '../src/constants'
import { handler } from '../src/index'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
})

test('Do Not Get Metadata If Changes Summary Has No Changes', async () => {
  //given
  const changesSummary = require('./data/changes_summary/no_changes.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: STAGE_BUCKET, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  //when
  await handler(null)
  //then
  expect(s3.getObject).not.toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: LIBS_METADATA_FILE_NAME,
  })
})

import { lambda, s3 } from 'cdk_lib/_util/tests/mocking/aws_sdk'
import { when } from 'jest-when'
import {
  returnPromiseObject,
  returnPromiseObjectWithError,
} from 'cdk_lib/_util/tests/mocking/promises'
import {ChangesSummary, LibMetadata} from '../src/types'
import { whenS3GetObjectReturnsBody } from 'cdk_lib/_util/tests/mocking/s3'
import {
  LIBS_CHANGES_SUMMARY_FILE_NAME,
  LIBS_METADATA_FILE_NAME,
  PROD_BUCKET,
  STAGE_BUCKET,
  FUNCTIONS_METADATA_FILE_NAME,
} from '../src/constants'
import { handler } from '../src/index'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(lambda.getLayerVersion).mockImplementation(returnPromiseObject({}))
})

test('Do Not Get Libs Metadata If Changes Summary Has No Changes', async () => {
  //given
  const changesSummary = require('./data/changes_summary/no_changes.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  //when
  await handler({})
  //then
  expect(s3.getObject).not.toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: LIBS_METADATA_FILE_NAME,
  })
})

test('Get Libs Metadata If Changes Summary Has Changes', async () => {
  //given
  const changesSummary = require('./data/changes_summary/single_change.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  //when
  await handler({})
  //then
  expect(s3.getObject).toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: LIBS_METADATA_FILE_NAME,
  })
})

test('Do Not Get Functions Metadata If Layer Versions Have Not Changed', async () => {
  //given
  const changesSummary = require('./data/changes_summary/single_change.json') as ChangesSummary
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  const libsMetadata = require('./data/metadata/libs1.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: LIBS_METADATA_FILE_NAME },
    JSON.stringify(libsMetadata),
  )
  //when
  await handler({})
  //then
  expect(s3.getObject).not.toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: FUNCTIONS_METADATA_FILE_NAME,
  })
})

test('Get Functions Metadata If Layer Versions Have Changed', async () => {
  //given
  const changesSummary = require('./data/changes_summary/single_change.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  const libsMetadata = require('./data/metadata/libs1.json') as LibMetadata
  whenS3GetObjectReturnsBody(
      { Bucket: PROD_BUCKET, Key: LIBS_METADATA_FILE_NAME },
      JSON.stringify(libsMetadata),
  )
  when(lambda.getLayerVersion).mockImplementation(
      returnPromiseObjectWithError({ code: 'ResourceNotFoundException' }),
  )
  //when
  await handler({})
  //then
  expect(s3.getObject).toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: FUNCTIONS_METADATA_FILE_NAME,
  })
})

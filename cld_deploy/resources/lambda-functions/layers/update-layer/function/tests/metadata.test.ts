import { lambda, s3 } from 'cld_deploy/_util/tests/mocking/aws_sdk'
import { when } from 'jest-when'
import {
  returnPromiseObject,
  returnPromiseObjectWithError,
} from 'cld_deploy/_util/tests/mocking/promises'
import { ChangesSummary, LibMetadata } from '../src/types'
import { whenS3GetObjectReturnsBody } from 'cld_deploy/_util/tests/mocking/s3'
import { METADATA_FILE_NAME, LIBS_CHANGES_SUMMARY_FILE_NAME, PROD_BUCKET } from '../src/constants'
import { handler } from '../src/index'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.putObject).mockImplementation(returnPromiseObject({}))
  when(lambda.publishLayerVersion).mockImplementation(returnPromiseObject({ Version: 1 }))
  when(lambda.getLayerVersion).mockImplementation(returnPromiseObject({}))
  when(lambda.updateFunctionConfiguration).mockImplementation(returnPromiseObject({}))
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
    Key: METADATA_FILE_NAME,
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
    Key: METADATA_FILE_NAME,
  })
})

test('Do Not Get Metadata If Layer Versions Have Not Changed', async () => {
  //given
  const changesSummary = require('./data/changes_summary/no_changes.json') as ChangesSummary
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  //when
  await handler({})
  //then
  expect(s3.getObject).not.toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: METADATA_FILE_NAME,
  })
})

test('Get Metadata If Layer Versions Have Changed', async () => {
  //given
  const changesSummary = require('./data/changes_summary/single_change.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  const libsMetadata = require('./data/metadata/libs_and_functions1.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: METADATA_FILE_NAME },
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
    Key: METADATA_FILE_NAME,
  })
})

test('Save New Layer Versions in Metadata', async () => {
  //given
  const changesSummary = require('./data/changes_summary/single_change.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  const metadata = require('./data/metadata/libs_and_functions1.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  when(lambda.getLayerVersion).mockImplementation(
    returnPromiseObjectWithError({ code: 'ResourceNotFoundException' }),
  )
  when(lambda.publishLayerVersion).mockImplementation(returnPromiseObject({ Version: 4 }))
  //when
  await handler({})
  //then
  const expectedLibsMetadata = require('./data/metadata/libs_with_new_versions.json') as LibMetadata
  expect(s3.putObject).toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: METADATA_FILE_NAME,
    Body: JSON.stringify(expectedLibsMetadata),
  })
})

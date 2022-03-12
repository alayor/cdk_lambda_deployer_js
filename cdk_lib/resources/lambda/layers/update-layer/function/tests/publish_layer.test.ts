import { lambda, s3 } from 'cdk_lib/_util/tests/mocking/aws_sdk'
import { when } from 'jest-when'
import {
  returnPromiseObject,
  returnPromiseObjectWithError,
} from 'cdk_lib/_util/tests/mocking/promises'
import { LibMetadata } from '../src/types'
import { whenS3GetObjectReturnsBody } from 'cdk_lib/_util/tests/mocking/s3'
import {
  FUNCTIONS_METADATA_FILE_NAME,
  LIBS_CHANGES_SUMMARY_FILE_NAME,
  LIBS_METADATA_FILE_NAME,
  PROD_BUCKET,
} from '../src/constants'
import { handler } from '../src/index'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.putObject).mockImplementation(returnPromiseObject({}))
  when(lambda.publishLayerVersion).mockImplementation(returnPromiseObject({ Version: 1 }))
  when(lambda.getLayerVersion).mockImplementation(returnPromiseObject({}))
})

test('Publish Layer Versions For Lib Changes', async () => {
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
  const functionsMetadata = require('./data/metadata/functions1.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(functionsMetadata),
  )
  //when
  await handler({})
  //then
  expect(lambda.publishLayerVersion).toBeCalledWith({
    LayerName: 'api_customer_lib',
    Content: {
      S3Bucket: PROD_BUCKET,
      S3Key: 'libs/customer_lib/nodejs.zip',
      S3ObjectVersion: '2',
    },
    CompatibleRuntimes: ['nodejs14.x'],
  })
})

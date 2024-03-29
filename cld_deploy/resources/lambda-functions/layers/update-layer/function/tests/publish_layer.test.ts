import { lambda, s3 } from 'cld_deploy/_util/tests/mocking/aws_sdk'
import { when } from 'jest-when'
import {
  returnPromiseObject,
  returnPromiseObjectWithError,
} from 'cld_deploy/_util/tests/mocking/promises'
import { LibMetadata } from '../src/types'
import { whenS3GetObjectReturnsBody } from 'cld_deploy/_util/tests/mocking/s3'
import { METADATA_FILE_NAME, LIBS_CHANGES_SUMMARY_FILE_NAME } from '../src/constants'
import { handler } from '../src/index'

const prodBucketName = 'prodBucketName'
const stageBucketName = 'stageBucketName'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.putObject).mockImplementation(returnPromiseObject({}))
  when(s3.deleteObject).mockImplementation(returnPromiseObject({}))
  when(lambda.publishLayerVersion).mockImplementation(returnPromiseObject({ Version: 1 }))
  when(lambda.getLayerVersion).mockImplementation(returnPromiseObject({}))
  when(lambda.updateFunctionConfiguration).mockImplementation(returnPromiseObject({}))
})

test('Do Not Publish Layer Versions For Lib Changes If Version is Already Published', async () => {
  //given
  const changesSummary = require('./data/changes_summary/single_change.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  const metadata = require('./data/metadata/libs_and_functions1.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  when(lambda.getLayerVersion).mockImplementation(returnPromiseObject({}))
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expect(lambda.publishLayerVersion).not.toBeCalled()
})

test('Publish Layer Versions For Lib Metadata Has No Layer Versions', async () => {
  //given
  const changesSummary = require('./data/changes_summary/single_change.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  const metadata = require('./data/metadata/libs_with_no_layer_versions.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  when(lambda.getLayerVersion).mockImplementation(returnPromiseObject({}))
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expect(lambda.publishLayerVersion).toBeCalledWith({
    LayerName: 'customer_lib',
    Content: {
      S3Bucket: prodBucketName,
      S3Key: 'libs/customer_lib/nodejs.zip',
      S3ObjectVersion: '2',
    },
    CompatibleRuntimes: ['nodejs20.x'],
  })
})

test('Publish Layer Versions For A Single Lib Change', async () => {
  //given
  const changesSummary = require('./data/changes_summary/single_change.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  const metadata = require('./data/metadata/libs_and_functions1.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  when(lambda.getLayerVersion).mockImplementation(
    returnPromiseObjectWithError({ code: 'ResourceNotFoundException' }),
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expectPublishLayerVersionToBeCalledForLib('customer_lib', '2')
})

function expectPublishLayerVersionToBeCalledForLib(libName: string, version: string) {
  expect(lambda.publishLayerVersion).toBeCalledWith({
    LayerName: `${libName}`,
    Content: {
      S3Bucket: prodBucketName,
      S3Key: `libs/${libName}/nodejs.zip`,
      S3ObjectVersion: version,
    },
    CompatibleRuntimes: ['nodejs20.x'],
  })
}

test('Publish Layer Versions For Multiple Lib Changes', async () => {
  //given
  const changesSummary = require('./data/changes_summary/multiple_changes.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  const metadata = require('./data/metadata/libs_and_functions1.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  when(lambda.getLayerVersion).mockImplementation(
    returnPromiseObjectWithError({ code: 'ResourceNotFoundException' }),
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expectPublishLayerVersionToBeCalledForLib('customer_lib', '2')
  expectPublishLayerVersionToBeCalledForLib('deliverer_lib', '1')
})

test('Update Lambda Functions Configuration With New Layer Version', async () => {
  //given
  const context = {
    invokedFunctionArn:
      'arn:aws:lambda:us-west-1:123456789012:function:CdkLambdaDeployer_UpdateLayer\n',
  }
  const changesSummary = require('./data/changes_summary/single_change.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: LIBS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(changesSummary),
  )
  const metadata = require('./data/metadata/libs_and_functions1.json') as LibMetadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  when(lambda.getLayerVersion).mockImplementation(
    returnPromiseObjectWithError({ code: 'ResourceNotFoundException' }),
  )
  when(lambda.publishLayerVersion).mockImplementation(returnPromiseObject({ Version: 4 }))
  //when
  await handler(
    {
      body: {
        prodBucketName,
        stageBucketName,
      },
    },
    context,
  )
  //then
  const functionNames = [
    'customer_orders_place',
    'customer_products_get_all',
    'customer_products_get_one',
  ]
  functionNames.forEach((functionName) => {
    expect(lambda.updateFunctionConfiguration).toBeCalledWith({
      FunctionName: functionName,
      Layers: ['arn:aws:lambda:us-west-1:123456789012:layer:customer_lib:4'],
    })
  })
})

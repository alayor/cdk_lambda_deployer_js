import { s3, lambda } from 'cdk_lib/_util/tests/mocking/aws_sdk' // this must be at the top
import { when } from 'jest-when'
import {
  FUNCTIONS_CHANGES_SUMMARY_FILE_NAME,
  FUNCTIONS_METADATA_FILE_NAME,
  PROD_BUCKET,
} from '../src/constants'
import { handler } from '../src/index'
import { whenS3GetObjectReturnsBody } from 'cdk_lib/_util/tests/mocking/s3'
import { Metadata } from '../src/types'
import { returnPromiseObject } from 'cdk_lib/_util/tests/mocking/promises'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(lambda.createFunction).mockImplementation(returnPromiseObject({}))
})

test('Do not get metadata if changes summary has no changes.', async () => {
  //given
  const stageMetadata = require('./data/empty_summary_changes.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  //when
  await handler(null)
  //then
  expect(s3.getObject).not.toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: FUNCTIONS_METADATA_FILE_NAME,
  })
})

test('Create lambda function for each -create- action in the changes summary', async () => {
  //given
  const summaryChanges = require('./data/summary_changes.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(summaryChanges),
  )
  const metadata = require('./data/metadata1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  //when
  await handler(null)
  //then
  const expectedKeysAndFunctionNames: Array<{ S3Key: string; FunctionName: string }> = [
    {
      S3Key: 'functions/customer/orders/place/function.zip',
      FunctionName: 'api_customer_orders_place',
    },
    {
      S3Key: 'functions/customer/products/get_all/function.zip',
      FunctionName: 'api_customer_products_get_all',
    },
  ]
  expectedKeysAndFunctionNames.forEach(({ S3Key, FunctionName }) => {
    expect(lambda.createFunction).toBeCalledWith({
      Code: {
        S3Bucket: PROD_BUCKET,
        S3Key,
      },
      FunctionName,
      Role: '',
      Handler: 'function.handler',
      Runtime: 'nodejs14.x',
      //TODO: Add Layer
    })
  })
})

import { s3, lambda } from 'cld_deploy/_util/tests/mocking/aws_sdk' // this must be at the top
import { when } from 'jest-when'
import {
  FUNCTIONS_CHANGES_SUMMARY_FILE_NAME,
  METADATA_FILE_NAME,
  PROD_BUCKET,
} from '../src/constants'
import { handler } from '../src/index'
import { whenS3GetObjectReturnsBody } from 'cld_deploy/_util/tests/mocking/s3'
import { Metadata } from '../src/types'
import { returnPromiseObject } from 'cld_deploy/_util/tests/mocking/promises'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.deleteObject).mockImplementation(returnPromiseObject({}))
  when(lambda.createFunction).mockImplementation(returnPromiseObject({}))
  when(lambda.updateFunctionCode).mockImplementation(returnPromiseObject({}))
  when(lambda.deleteFunction).mockImplementation(returnPromiseObject({}))
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
    Key: METADATA_FILE_NAME,
  })
})

test('Create lambda function for each -create- action in the changes summary.', async () => {
  //given
  summaryAndMetadataAreRetrieved()
  //when
  await handler({
    body: {
      securityGroupIds: [],
      subnetIds: [],
    },
  })
  //then
  const expectedKeysAndFunctionNames: Array<{ S3Key: string; FunctionName: string }> = [
    {
      S3Key: 'functions/customer/orders/place/function.zip',
      FunctionName: 'customer_orders_place',
    },
    {
      S3Key: 'functions/customer/products/get_all/function.zip',
      FunctionName: 'customer_products_get_all',
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
      Runtime: 'nodejs20.x',
      VpcConfig: {
        SecurityGroupIds: [],
        SubnetIds: [],
      },
      //TODO: Add Layer
    })
  })
})

function summaryAndMetadataAreRetrieved() {
  const summaryChanges = require('./data/summary_changes.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_CHANGES_SUMMARY_FILE_NAME },
    JSON.stringify(summaryChanges),
  )
  const metadata = require('./data/metadata1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
}

test('Update lambda function code for each -update- action in the changes summary.', async () => {
  //given
  summaryAndMetadataAreRetrieved()
  //when
  await handler(null)
  //then
  const expectedKeysAndFunctionNames: Array<{
    S3Key: string
    FunctionName: string
    S3ObjectVersion: string
  }> = [
    {
      S3Key: 'functions/customer/products/get_one/function.zip',
      FunctionName: 'customer_products_get_one',
      S3ObjectVersion: '2',
    },
    {
      S3Key: 'functions/deliverer/auth/login/function.zip',
      FunctionName: 'deliverer_auth_login',
      S3ObjectVersion: '3',
    },
  ]
  expectedKeysAndFunctionNames.forEach(({ S3Key, FunctionName, S3ObjectVersion }) => {
    expect(lambda.updateFunctionCode).toBeCalledWith({
      FunctionName,
      S3Bucket: PROD_BUCKET,
      S3Key,
      S3ObjectVersion,
    })
  })
})

test('Delete lambda function -delete- action in the changes summary.', async () => {
  //given
  summaryAndMetadataAreRetrieved()
  //when
  await handler(null)
  //then
  expect(lambda.deleteFunction).toBeCalledWith({
    FunctionName: 'deliverer_auth_register',
  })
})

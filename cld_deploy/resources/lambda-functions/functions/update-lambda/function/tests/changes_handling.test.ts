import { s3, lambda } from 'cld_deploy/_util/tests/mocking/aws_sdk' // this must be at the top
import { when } from 'jest-when'
import { FUNCTIONS_CHANGES_SUMMARY_FILE_NAME, METADATA_FILE_NAME } from '../src/constants'
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

test('Do not get metadata if changes summary has no changes.', async () => {
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
  expect(s3.getObject).not.toBeCalledWith({
    Bucket: prodBucketName,
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
      databaseProxyName: 'proxy',
      prodBucketName,
      stageBucketName,
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
        S3Bucket: prodBucketName,
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
      Environment: {
        Variables: {
          DB_PROXY_NAME: 'proxy',
          NODE_ENV: 'production',
        },
      },
      //TODO: Add Layer
    })
  })
})

function summaryAndMetadataAreRetrieved() {
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
}

test('Update lambda function code for each -update- action in the changes summary.', async () => {
  //given
  summaryAndMetadataAreRetrieved()
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
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
      S3Bucket: prodBucketName,
      S3Key,
      S3ObjectVersion,
    })
  })
})

test('Delete lambda function -delete- action in the changes summary.', async () => {
  //given
  summaryAndMetadataAreRetrieved()
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  expect(lambda.deleteFunction).toBeCalledWith({
    FunctionName: 'deliverer_auth_register',
  })
})

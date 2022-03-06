import { s3 } from 'cdk_lib/_util/tests/mocking/aws_sdk' // this must be at the top
import * as _ from 'lodash'
import { when } from 'jest-when'
import {
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
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  when(s3.deleteObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  whenS3GetObjectThrowsError({ Bucket: PROD_BUCKET, Key: LOCK_FILE }, { code: 'NoSuchKey' })
})

test('Create functions from stage metadata when prod metadata is not existing.', async () => {
  //given
  const metadata = require('./data/stageMetadata1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  whenS3GetObjectThrowsError(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    { code: 'NoSuchKey' },
  )
  //when
  await handler(null)
  //then
  const zipPaths = _.flatten(
    Object.values(metadata).map((func) => Object.values(func).map((obj) => obj.zipPath)),
  )
  zipPaths.forEach((zipPath) => {
    expect(s3.copyObject).toBeCalledWith({
      Bucket: PROD_BUCKET,
      Key: zipPath,
      CopySource: STAGE_BUCKET + '/' + zipPath,
    })
  })
})

test('Create functions from stage metadata for functions not existing in prod metadata.', async () => {
  //given
  const stageMetadata = require('./data/stageMetadata1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/prodMetadata1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler(null)
  //then
  const newFunctionZipPath = stageMetadata?.customer?.products_get_all?.zipPath
  expect(s3.copyObject).toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: newFunctionZipPath,
    CopySource: STAGE_BUCKET + '/' + newFunctionZipPath,
  })
  const existingFunctionZipPath = stageMetadata?.customer?.orders_place?.zipPath
  expect(s3.copyObject).not.toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: existingFunctionZipPath,
    CopySource: STAGE_BUCKET + '/' + existingFunctionZipPath,
  })
})

test('Updated functions are copied from stage to prod bucket', async () => {
  //given
  const stageMetadata = require('./data/stageMetadata1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/prodMetadata2.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler(null)
  //then
  const updatedZipPath = stageMetadata?.customer?.products_get_all?.zipPath
  expect(s3.copyObject).toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: updatedZipPath,
    CopySource: STAGE_BUCKET + '/' + updatedZipPath,
  })
  const existingFunctionZipPath = stageMetadata?.customer?.orders_place?.zipPath
  expect(s3.copyObject).not.toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: existingFunctionZipPath,
    CopySource: STAGE_BUCKET + '/' + existingFunctionZipPath,
  })
})

test('Functions in prod metadata but not in stage metadata are deleted from prod bucket.', async () => {
  //given
  const stageMetadata = require('./data/stageMetadata2.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/prodMetadata2.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler(null)
  //then
  const deletedZipPath = prodMetadata?.customer?.products_get_all?.zipPath
  expect(s3.deleteObject).toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: deletedZipPath,
  })
})

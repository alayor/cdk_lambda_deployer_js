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
  whenS3GetObjectReturnsPromiseObject,
  whenS3GetObjectThrowsError,
} from 'cdk_lib/_util/tests/mocking/s3'
import { Metadata } from '../src/types'
import { returnPromiseObject } from 'cdk_lib/_util/tests/mocking/promises'

beforeEach(() => {
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  whenS3GetObjectThrowsError({ Bucket: PROD_BUCKET, Key: LOCK_FILE }, { code: 'NoSuchKey' })
})

test('Create functions from stage metadata when prod metadata is not existing.', async () => {
  //given
  const metadata = require('./data/stageMetadata1.json') as Metadata
  whenS3GetObjectReturnsPromiseObject(
    { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    {
      Body: {
        toString: () => JSON.stringify(metadata),
      },
    },
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
  whenS3GetObjectReturnsPromiseObject(
      { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
      {
        Body: {
          toString: () => JSON.stringify(stageMetadata),
        },
      },
  )
  const prodMetadata = require('./data/prodMetadata1.json') as Metadata
  whenS3GetObjectReturnsPromiseObject(
      { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
      {
        Body: {
          toString: () => JSON.stringify(prodMetadata),
        },
      },
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
    CopySource: STAGE_BUCKET + '/' + newFunctionZipPath,
  })
})

test('Updated functions are copied from stage to prod bucket', async () => {})

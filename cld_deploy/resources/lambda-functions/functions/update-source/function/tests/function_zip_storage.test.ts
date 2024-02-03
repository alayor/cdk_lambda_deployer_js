import { s3 } from 'cld_deploy/_util/tests/mocking/aws_sdk' // this must be at the top
import * as _ from 'lodash'
import { when } from 'jest-when'
import { METADATA_FILE_NAME, LOCK_FILE } from '../src/constants'
import { handler } from '../src/index'
import {
  whenS3GetObjectReturnsBody,
  whenS3GetObjectThrowsError,
} from 'cld_deploy/_util/tests/mocking/s3'
import { Metadata } from '../src/types'
import { returnPromiseObject } from 'cld_deploy/_util/tests/mocking/promises'

const prodBucketName = 'prodBucketName'
const stageBucketName = 'stageBucketName'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.putObject).mockImplementation(returnPromiseObject({}))
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  when(s3.deleteObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  whenS3GetObjectThrowsError({ Bucket: prodBucketName, Key: LOCK_FILE }, { code: 'NoSuchKey' })
})

test('Create functions from stage metadata when prod metadata is not existing.', async () => {
  //given
  const metadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: stageBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(metadata),
  )
  whenS3GetObjectThrowsError(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    { code: 'NoSuchKey' },
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  const zipPaths = _.flatten(
    Object.values(metadata.functions).map((func) => Object.values(func).map((obj) => obj.zipPath)),
  )
  zipPaths.forEach((zipPath) => {
    expect(s3.copyObject).toBeCalledWith({
      Bucket: prodBucketName,
      Key: zipPath,
      CopySource: stageBucketName + '/' + zipPath,
    })
  })
})

test('Create functions from stage metadata for functions not existing in prod metadata.', async () => {
  //given
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: stageBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  const newFunctionZipPath = stageMetadata.functions?.customer?.products_get_all?.zipPath
  expect(s3.copyObject).toBeCalledWith({
    Bucket: prodBucketName,
    Key: newFunctionZipPath,
    CopySource: stageBucketName + '/' + newFunctionZipPath,
  })
  const existingFunctionZipPath = stageMetadata.functions?.customer?.orders_place?.zipPath
  expect(s3.copyObject).not.toBeCalledWith({
    Bucket: prodBucketName,
    Key: existingFunctionZipPath,
    CopySource: stageBucketName + '/' + existingFunctionZipPath,
  })
})

test('Updated functions are copied from stage to prod bucket', async () => {
  //given
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: stageBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod2.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  const updatedZipPath = stageMetadata.functions?.customer?.products_get_all?.zipPath
  expect(s3.copyObject).toBeCalledWith({
    Bucket: prodBucketName,
    Key: updatedZipPath,
    CopySource: stageBucketName + '/' + updatedZipPath,
  })
  const existingFunctionZipPath = stageMetadata.functions?.customer?.orders_place?.zipPath
  expect(s3.copyObject).not.toBeCalledWith({
    Bucket: prodBucketName,
    Key: existingFunctionZipPath,
    CopySource: stageBucketName + '/' + existingFunctionZipPath,
  })
})

test('Functions in prod metadata but not in stage metadata are deleted from prod bucket.', async () => {
  //given
  const stageMetadata = require('./data/metadata/stage2.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: stageBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod2.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: prodBucketName, Key: METADATA_FILE_NAME },
    JSON.stringify(prodMetadata),
  )
  //when
  await handler({
    body: {
      prodBucketName,
      stageBucketName,
    },
  })
  //then
  const deletedZipPath = prodMetadata.functions?.customer?.products_get_all?.zipPath
  expect(s3.deleteObject).toBeCalledWith({
    Bucket: prodBucketName,
    Key: deletedZipPath,
  })
})

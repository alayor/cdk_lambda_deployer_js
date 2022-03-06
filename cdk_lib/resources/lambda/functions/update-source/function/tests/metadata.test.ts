import { s3 } from 'cdk_lib/_util/tests/mocking/aws_sdk' // this must be at the top
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
  when(s3.putObject).mockImplementation(returnPromiseObject({}))
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  when(s3.deleteObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  whenS3GetObjectThrowsError({ Bucket: PROD_BUCKET, Key: LOCK_FILE }, { code: 'NoSuchKey' })
})

test('New Prod metadata is created from stage metadata.', async () => {
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
  const newProdMetadata = require('./data/newProdMetadataFromStage1.json') as Metadata
  expect(s3.putObject).toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: FUNCTIONS_METADATA_FILE_NAME,
    Body: JSON.stringify(newProdMetadata),
  })
})

test('Prod metadata is updated from stage metadata with new functions.', async () => {
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
  const newProdMetadata = require('./data/updatedProdMetadata1FromStage1.json') as Metadata
  expect(s3.putObject).toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: FUNCTIONS_METADATA_FILE_NAME,
    Body: JSON.stringify(newProdMetadata),
  })
})

import { s3 } from 'cld_deploy/_util/tests/mocking/aws_sdk' // this must be at the top
import { when } from 'jest-when'
import { LIBS_METADATA_FILE_NAME, LOCK_FILE, PROD_BUCKET, STAGE_BUCKET } from '../src/constants'
import { handler } from '../src/index'
import {
  whenS3GetObjectReturnsBody,
  whenS3GetObjectThrowsError,
} from 'cld_deploy/_util/tests/mocking/s3'
import { Metadata } from '../src/types'
import { returnPromiseObject } from 'cld_deploy/_util/tests/mocking/promises'

beforeEach(() => {
  jest.clearAllMocks()
  when(s3.getObject).mockImplementation(returnPromiseObject({}))
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  when(s3.putObject).mockImplementation(returnPromiseObject({ VersionId: '1' }))
  whenS3GetObjectThrowsError({ Bucket: PROD_BUCKET, Key: LOCK_FILE }, { code: 'NoSuchKey' })
})

test('New Prod metadata is created from stage metadata.', async () => {
  //given
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '2' }))
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
    { Bucket: STAGE_BUCKET, Key: LIBS_METADATA_FILE_NAME },
    JSON.stringify(stageMetadata),
  )
  whenS3GetObjectThrowsError(
    { Bucket: PROD_BUCKET, Key: LIBS_METADATA_FILE_NAME },
    { code: 'NoSuchKey' },
  )
  //when
  await handler(null)
  //then
  expectNewProdMetadataToBe(JSON.stringify(require('./data/metadata/new_prod_from_stage1.json')))
})

function expectNewProdMetadataToBe(body: string) {
  expect(s3.putObject).toBeCalledWith({
    Bucket: PROD_BUCKET,
    Key: LIBS_METADATA_FILE_NAME,
    Body: body,
  })
}

test('Metadata versions are updated in prod metadata.', async () => {
  //given
  when(s3.copyObject).mockImplementation(returnPromiseObject({ VersionId: '2' }))
  const stageMetadata = require('./data/metadata/stage1.json') as Metadata
  whenS3GetObjectReturnsBody(
      { Bucket: STAGE_BUCKET, Key: LIBS_METADATA_FILE_NAME },
      JSON.stringify(stageMetadata),
  )
  const prodMetadata = require('./data/metadata/prod3.json') as Metadata
  whenS3GetObjectReturnsBody(
      { Bucket: PROD_BUCKET, Key: LIBS_METADATA_FILE_NAME },
      JSON.stringify(prodMetadata),
  )
  //when
  await handler(null)
  //then
  expectNewProdMetadataToBe(JSON.stringify(require('./data/metadata/prod_from_stage1_and_prod3.json')))
})

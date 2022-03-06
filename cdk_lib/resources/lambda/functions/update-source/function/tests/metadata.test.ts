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

test('New functions are copied from stage to prod bucket', async () => {
  //given
  const metadata = require('./data/functionsMetadata1.json') as Metadata
  whenS3GetObjectReturnsPromiseObject(
    { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    {
      Body: {
        toString: () => JSON.stringify(metadata),
      },
    },
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

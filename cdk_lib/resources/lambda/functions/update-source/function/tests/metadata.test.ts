require('cdk_lib/_util/tests/mocking/aws_sdk')
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

beforeEach(() => {
  whenS3GetObjectThrowsError({ Bucket: PROD_BUCKET, Key: LOCK_FILE }, { code: 'NoSuchKey' })
  whenS3GetObjectReturnsPromiseObject(
    { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    {},
  )
  whenS3GetObjectReturnsPromiseObject(
    { Bucket: STAGE_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
    {},
  )
})

test('Test create functions from metadata', async () => {
  //given
  const metadata = require('./data/functionsMetadata1.json')
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
})

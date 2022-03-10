import { LIBS_METADATA_FILE_NAME, PROD_BUCKET, STAGE_BUCKET } from '../src/constants'
import {
  whenS3GetObjectReturnsBody,
  whenS3GetObjectReturnsPromiseObject,
  whenS3GetObjectThrowsError,
} from 'cdk_lib/_util/tests/mocking/s3'
import { Metadata } from '../../../../functions/update-source/function/src/types'
import { handler } from '../../../../functions/update-source/function/src/index'
import { FUNCTIONS_METADATA_FILE_NAME } from '../../../../functions/update-source/function/src/constants'
import { s3 } from '../../../../../../_util/tests/mocking/aws_sdk'

beforeEach(() => {
  jest.clearAllMocks()
  whenS3GetObjectReturnsPromiseObject({ Bucket: PROD_BUCKET, Key: LIBS_METADATA_FILE_NAME }, {})
  whenS3GetObjectReturnsPromiseObject({ Bucket: STAGE_BUCKET, Key: LIBS_METADATA_FILE_NAME }, {})
})
test('Dummy.', async () => {})

// test('New Prod metadata is created from stage metadata.', async () => {
//   //given
//   const stageMetadata = require('./data/metadata/stage1.json') as Metadata
//   whenS3GetObjectReturnsBody(
//     { Bucket: STAGE_BUCKET, Key: LIBS_METADATA_FILE_NAME },
//     JSON.stringify(stageMetadata),
//   )
//   whenS3GetObjectThrowsError(
//     { Bucket: PROD_BUCKET, Key: FUNCTIONS_METADATA_FILE_NAME },
//     { code: 'NoSuchKey' },
//   )
//   //when
//   await handler(null)
//   //then
//   expectNewProdMetadataToBe(JSON.stringify(require('./data/metadata/new_prod_from_stage1.json')))
// })
//
// function expectNewProdMetadataToBe(body: string) {
//   expect(s3.putObject).toBeCalledWith({
//     Bucket: PROD_BUCKET,
//     Key: LIBS_METADATA_FILE_NAME,
//     Body: body,
//   })
// }

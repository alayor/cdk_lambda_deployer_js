import { when } from 'jest-when'
import { s3 } from './aws_sdk'
import { returnPromiseObject, returnPromiseObjectWithError } from './promises'

export function whenS3GetObject(calledWith: any, returns: any) {
  when(s3.getObject).calledWith(calledWith).mockImplementation(returns)
}

export function whenS3GetObjectThrowsError(calledWith: any, error: any) {
  whenS3GetObject(calledWith, returnPromiseObjectWithError(error))
}

export function whenS3GetObjectReturnsPromiseObject(calledWith: any, object: any) {
  whenS3GetObject(calledWith, returnPromiseObject(jest.mocked(object)))
}

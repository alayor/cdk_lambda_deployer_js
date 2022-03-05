export function returnPromiseObject(returnedValue?: any) {
  return () => ({
    promise: () => Promise.resolve(returnedValue),
  })
}

export function returnPromiseObjectWithError(error?: any) {
  return () => ({
    promise: () => Promise.reject(error),
  })
}

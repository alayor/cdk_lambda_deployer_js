export function returnPromiseObject(returnedValue?: any) {
  return () => ({
    promise: () => Promise.resolve(returnedValue),
  })
}

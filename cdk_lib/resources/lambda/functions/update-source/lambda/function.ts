exports.handler = async function (_event: any) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { success: true },
  }
}

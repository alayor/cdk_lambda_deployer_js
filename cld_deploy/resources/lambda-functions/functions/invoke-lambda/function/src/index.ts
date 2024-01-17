import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda'

export async function handler(event: any) {
  try {
    // Extract the function name from the header
    const functionName = event.headers['X-Function-Name']

    if (!functionName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'X-Function-Name header is missing' }),
      }
    }

    // Create an AWS Lambda service object
    const client = new LambdaClient({})

    // Define parameters for the invoke API
    const input = {
      // InvocationRequest
      FunctionName: functionName,
      Payload: JSON.stringify(event.body),
    }
    const command = new InvokeCommand(input)
    const result = await client.send(command)

    return JSON.parse(new TextDecoder().decode(result.Payload))
  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }
  }
}

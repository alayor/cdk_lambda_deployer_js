import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda'

export async function handler(_event: any) {
  try {
    // Extract the function name from the header
    /*const functionName = event.headers['X-Function-Name'];

    if (!functionName) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'X-Function-Name header is missing' }),
        };
    }*/

    // Create an AWS Lambda service object
    const client = new LambdaClient({})

    // Define parameters for the invoke API
    const input = {
      // InvocationRequest
      FunctionName: 'subscriptions_tracker_add',
    }
    const command = new InvokeCommand(input)

    // Invoke the Lambda function
    const result = await client.send(command)

    // Process the result
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Function executed successfully', result: result.Payload }),
    }
  } catch (error) {
    console.error('Error:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }
  }
}

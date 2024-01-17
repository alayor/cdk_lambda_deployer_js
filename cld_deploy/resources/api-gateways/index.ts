import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import MainConstruct, { MainConstructProps } from 'cld_deploy/context/main-construct'
import { Construct } from 'constructs'
import { LambdaFunctionType } from 'cld_deploy/context/resource-types'

export type ApiGatewaysConstructProps = MainConstructProps & {}
export class ApiGatewaysConstruct extends MainConstruct {
  constructor(scope: Construct, id: string, props: ApiGatewaysConstructProps) {
    super(scope, id, props)

    const { context } = props
    const handler = context.getLambdaFunction(LambdaFunctionType.INVOKE_FUNCTION)

    const api = new apigateway.RestApi(this, 'RestApi', {
      restApiName: 'API',
    })

    const lambdaIntegration = new apigateway.LambdaIntegration(handler, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    })

    api.root.addMethod('POST', lambdaIntegration)
  }
}

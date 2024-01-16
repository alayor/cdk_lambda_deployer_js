import { Construct } from 'constructs'
import MainConstruct, { MainConstructProps } from 'cld_deploy/context/main-construct'
import { UpdateFunctionsSourceConstruct } from './functions/update-source'
import { UpdateLambdaConstruct } from './functions/update-lambda'
import { UpdateLayerSourceConstruct } from './layers/update-source'
import { UpdateLayerConstruct } from './layers/update-layer'
import { InvokeLambdaConstruct } from 'cld_deploy/resources/lambda-functions/functions/invoke-lambda'

export class LambdaFunctionsConstruct extends MainConstruct {
  constructor(scope: Construct, id: string, props: MainConstructProps) {
    super(scope, id, props)
    new UpdateFunctionsSourceConstruct(this, 'UpdateFunctionsSource', props)
    new UpdateLambdaConstruct(this, 'UpdateLambda', props)
    new UpdateLayerSourceConstruct(this, 'UpdateLayerSource', props)
    new UpdateLayerConstruct(this, 'UpdateLayer', props)
    new InvokeLambdaConstruct(this, 'InvokeLambda', props)
  }
}

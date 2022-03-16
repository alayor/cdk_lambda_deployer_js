import { Construct } from 'constructs'
import Context from 'cld_deploy/context'

export interface MainConstructProps {
  context: Context
}

export default class MainConstruct extends Construct {
  private readonly _context: Context

  constructor(scope: Construct, id: string, props: MainConstructProps) {
    super(scope, id)
    const { context } = props
    this._context = context
  }

  get context() {
    return this._context
  }
}

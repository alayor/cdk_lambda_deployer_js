export class AppResourceAlreadySetError extends Error {
  private _message: string

  constructor(resourceClass: string, resourceType?: string) {
    super()
    if (resourceType) {
      this._message = `This ${resourceClass} for ${resourceType} was already set!`
    } else {
      this._message = `This ${resourceClass} was already set!`
    }
  }
}

export class AppResourceNotSetError extends Error {
  private _message: string

  constructor(resourceClass: string, resourceType?: string) {
    super()
    if (resourceType) {
      this._message = `This ${resourceClass} for ${resourceType} has not been set!`
    } else {
      this._message = `This ${resourceClass} has not been set!`
    }
  }
}

export enum CHANGE_TYPE {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

type ApiFunctionChanges = {
  [changeType in CHANGE_TYPE]: {
    [apiName: string]: string[]
  }
}

type ApiFunctionVersions = {
  [apiName: string]: {
    [functionName: string]: string
  }
}

//TODO: Add unit tests

export default class ChangesSummary {
  private readonly _changes: ApiFunctionChanges
  private readonly _newVersions: ApiFunctionVersions

  constructor() {
    this._changes = Object.values(CHANGE_TYPE).reduce((acc, val) => {
      acc[val] = {}
      return acc
    }, {} as ApiFunctionChanges)
    this._newVersions = {}
  }

  addChange(changeType: CHANGE_TYPE, apiName: string, functionName: string, newVersion: string) {
    if (!this._changes[changeType]) {
      this._changes[changeType] = {}
    }
    const functionChanges = this._changes[changeType][apiName] || []
    this._changes[changeType][apiName] = [...functionChanges, functionName]

    if (!this._newVersions[apiName]) {
      this._newVersions[apiName] = {}
    }
    this._newVersions[apiName][functionName] = newVersion
  }

  getNewVersion(apiName: string, functionName: string): string | undefined {
    return this._newVersions?.[apiName]?.[functionName]
  }

  hasChanges() {
    return Object.values(CHANGE_TYPE).find(
      (changeType) => Object.keys(this._changes[changeType]).length > 0,
    )
  }

  getChangesSummary(): string {
    const changes = this._changes
    const newVersions = this._newVersions
    return JSON.stringify({ changes, newVersions })
  }
}

// function mapToObj(map: Map<any, any>) {
//   return Array.from(map).reduce(
//     (obj: { [apiName: string]: { [functionName: string]: string[] } }, [key, value]) => {
//       obj[key.toString()] = value
//       return obj
//     },
//     {},
//   )
// }

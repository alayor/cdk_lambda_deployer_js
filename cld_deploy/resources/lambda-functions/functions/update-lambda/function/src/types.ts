export type MetadataBody = {
    hash: string
    zipPath: string
    version: string
}
export type FunctionsMetadata = Record<string, Record<string, MetadataBody>>

export type Metadata = { functions: FunctionsMetadata }


enum CHANGE_TYPE {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
}

export type ChangesSummary = {
    changes: {
        [changeType in CHANGE_TYPE]: {
            [apiName: string]: string[]
        }
    }
}

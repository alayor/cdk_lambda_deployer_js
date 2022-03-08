export type MetadataBody = {
    hash: string
    zipPath: string
    version: string
}
export type Metadata = Record<string, Record<string, MetadataBody>>


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

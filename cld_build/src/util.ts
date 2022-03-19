import * as fs from 'fs'
import { promises as fsp } from 'fs'
import * as path from 'path'

export function makeDirRecursive(dirPath: string): Promise<undefined> {
  return new Promise(async (resolve) => {
    if (!(await fileExists(dirPath))) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    return resolve(void 0)
  })
}

function fileExists(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      console.log('err: ', err)
      return resolve(!err)
    })
  })
}

export async function getFilePaths(directoryName: string, filter: RegExp, results: string[] = []) {
  let files = await fsp.readdir(directoryName, { withFileTypes: true })
  for (let f of files) {
    let fullPath = path.join(directoryName, f.name)
    if (!fullPath.includes('node_modules')) {
      if (f.isDirectory()) {
        await getFilePaths(fullPath, filter, results)
      } else if (filter.test(fullPath)) {
        results.push(fullPath)
      }
    }
  }
  return results
}

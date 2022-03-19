import * as fs from 'fs'
import { promises as fsp } from 'fs'
import * as path from 'path'

export function makeDirRecursive(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
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

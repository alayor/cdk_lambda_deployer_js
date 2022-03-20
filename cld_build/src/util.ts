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

export function fileExists(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      return resolve(!err)
    })
  })
}

export async function touchFile(filePath: string, fileName: string): Promise<undefined> {
  await makeDirRecursive(filePath)
  return new Promise((resolve) => {
    const time = new Date()
    const file = path.join(filePath, fileName)
    fs.utimes(file, time, time, (err) => {
      if (err) {
        fs.open(file, 'w', (err, fd) => {
          if (err) throw err
          fs.close(fd, (err) => {
            if (err) throw err
          })
        })
      }
      return resolve(void 0)
    })
  })
}

export function copyFile(originPath: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.copyFile(originPath, destPath, (err) => {
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

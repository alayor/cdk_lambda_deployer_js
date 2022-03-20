import * as path from 'path'
import { Config } from 'cld_build/types'

export function initializeConfig(currentDir: string): Config {
  return {
    projectPath: path.join(currentDir, 'project'),
    functionsRelativePath: 'functions',
    get functionsAbsolutePath() {
      return path.join(this.projectPath, this.functionsRelativePath)
    },
    libsRelativePath: 'libs',
    get libsAbsolutePath() {
      return path.join(this.projectPath, this.libsRelativePath)
    },
    functionFileName: 'index.js',
    entityNames: ['customer', 'deliverer'],
    libNames: ['util', 'db'],
    outputRelativePath: 'output',
    get outputAbsolutePath() {
      return path.join(this.projectPath, this.outputRelativePath)
    },
  }
}

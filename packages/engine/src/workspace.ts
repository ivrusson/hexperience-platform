import { existsSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Workspace } from '@hexp/shared'
import { WorkspaceError } from './errors.js'

export class TempWorkspace implements Workspace {
  readonly root: string
  constructor(rootPath: string) {
    this.root = resolve(rootPath)
  }
  async create(): Promise<void> {
    try {
      await mkdir(this.root, { recursive: true })
    } catch (error) {
      throw new WorkspaceError(
        `Failed to create workspace at ${this.root}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
  exists(): boolean {
    return existsSync(this.root)
  }
  async cleanup(): Promise<void> {
    if (!this.exists()) return
    try {
      await rm(this.root, { recursive: true, force: true })
    } catch (error) {
      throw new WorkspaceError(
        `Failed to cleanup workspace at ${this.root}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
  resolvePath(relativePath: string): string {
    return join(this.root, relativePath)
  }
}
export function createWorkspace(rootPath: string): Workspace {
  return new TempWorkspace(rootPath)
}

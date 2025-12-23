import { ok, rejects, strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { WorkspaceError } from '../errors.js'
import { createWorkspace, TempWorkspace } from '../workspace.js'

describe('Workspace', () => {
  let testDir: string

  test.beforeEach(() => {
    testDir = join(tmpdir(), `workspace-test-${Date.now()}`)
  })

  test.afterEach(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  describe('create', () => {
    test('should create workspace directory', async () => {
      const workspace = createWorkspace(testDir)
      strictEqual(workspace.exists(), false)

      await workspace.create()

      strictEqual(workspace.exists(), true)
      strictEqual(existsSync(testDir), true)
    })

    test('should create nested directories recursively', async () => {
      const nestedDir = join(testDir, 'nested', 'deep', 'path')
      const workspace = createWorkspace(nestedDir)

      await workspace.create()

      strictEqual(workspace.exists(), true)
      strictEqual(existsSync(nestedDir), true)
    })

    test('should not throw if directory already exists', async () => {
      const workspace = createWorkspace(testDir)
      await mkdir(testDir, { recursive: true })

      await workspace.create()

      strictEqual(workspace.exists(), true)
    })
  })

  describe('exists', () => {
    test('should return false for non-existent directory', () => {
      const workspace = createWorkspace(testDir)
      strictEqual(workspace.exists(), false)
    })

    test('should return true for existing directory', async () => {
      const workspace = createWorkspace(testDir)
      await mkdir(testDir, { recursive: true })

      strictEqual(workspace.exists(), true)
    })
  })

  describe('cleanup', () => {
    test('should remove workspace directory', async () => {
      const workspace = createWorkspace(testDir)
      await workspace.create()
      strictEqual(workspace.exists(), true)

      await workspace.cleanup()

      strictEqual(workspace.exists(), false)
      strictEqual(existsSync(testDir), false)
    })

    test('should not throw if directory does not exist', async () => {
      const workspace = createWorkspace(testDir)
      strictEqual(workspace.exists(), false)

      await workspace.cleanup()

      strictEqual(workspace.exists(), false)
    })

    test('should remove directory with files', async () => {
      const workspace = createWorkspace(testDir)
      await workspace.create()
      const testFile = join(testDir, 'test.txt')
      await writeFile(testFile, 'test content')

      await workspace.cleanup()

      strictEqual(workspace.exists(), false)
      strictEqual(existsSync(testFile), false)
    })
  })

  describe('resolvePath', () => {
    test('should resolve relative path from workspace root', () => {
      const workspace = createWorkspace(testDir)
      const resolved = workspace.resolvePath('subdir/file.txt')

      ok(resolved.includes('subdir'))
      ok(resolved.includes('file.txt'))
      strictEqual(resolved, join(testDir, 'subdir', 'file.txt'))
    })

    test('should handle nested paths', () => {
      const workspace = createWorkspace(testDir)
      const resolved = workspace.resolvePath('a/b/c/file.txt')

      strictEqual(resolved, join(testDir, 'a', 'b', 'c', 'file.txt'))
    })

    test('should handle root path', () => {
      const workspace = createWorkspace(testDir)
      const resolved = workspace.resolvePath('.')

      strictEqual(resolved, testDir)
    })
  })

  describe('TempWorkspace', () => {
    test('should resolve absolute paths correctly', () => {
      const workspace = new TempWorkspace(testDir)
      strictEqual(workspace.root, testDir)
    })

    test('should resolve relative paths to absolute', () => {
      const relativePath = './test-workspace'
      const workspace = new TempWorkspace(relativePath)

      ok(workspace.root.includes('test-workspace'))
      ok(!workspace.root.startsWith('.'))
    })
  })
})

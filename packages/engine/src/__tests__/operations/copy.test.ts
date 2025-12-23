import { ok, rejects, strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import type { CopyOperation, ExecutionContext } from '@hexp/shared'
import { OperationError } from '../../errors.js'
import { executeCopy } from '../../operations/copy.js'

describe('Copy Operation', () => {
  let templateDir: string
  let workspaceDir: string
  let context: ExecutionContext

  test.beforeEach(async () => {
    templateDir = join(tmpdir(), `copy-test-template-${Date.now()}`)
    workspaceDir = join(tmpdir(), `copy-test-workspace-${Date.now()}`)

    await mkdir(templateDir, { recursive: true })
    await mkdir(workspaceDir, { recursive: true })

    context = {
      templateRoot: templateDir,
      workspaceRoot: workspaceDir,
      variables: {},
    }
  })

  test.afterEach(async () => {
    await rm(templateDir, { recursive: true, force: true }).catch(() => {})
    await rm(workspaceDir, { recursive: true, force: true }).catch(() => {})
  })

  describe('executeCopy', () => {
    test('should copy file from template to workspace', async () => {
      const sourceFile = join(templateDir, 'source.txt')
      const content = 'Hello, World!'
      await writeFile(sourceFile, content)

      const operation: CopyOperation = {
        type: 'copy',
        from: 'source.txt',
        to: 'destination.txt',
      }

      const result = await executeCopy(operation, context)

      strictEqual(result.success, true)
      ok(result.filesAffected?.includes('destination.txt'))
      strictEqual(existsSync(join(workspaceDir, 'destination.txt')), true)

      const copiedContent = await readFile(
        join(workspaceDir, 'destination.txt'),
        'utf-8'
      )
      strictEqual(copiedContent, content)
    })

    test('should create destination directory if it does not exist', async () => {
      const sourceFile = join(templateDir, 'file.txt')
      await writeFile(sourceFile, 'content')

      const operation: CopyOperation = {
        type: 'copy',
        from: 'file.txt',
        to: 'subdir/nested/file.txt',
      }

      const result = await executeCopy(operation, context)

      strictEqual(result.success, true)
      strictEqual(
        existsSync(join(workspaceDir, 'subdir', 'nested', 'file.txt')),
        true
      )
    })

    test('should throw error if source file does not exist', async () => {
      const operation: CopyOperation = {
        type: 'copy',
        from: 'nonexistent.txt',
        to: 'destination.txt',
      }

      await rejects(executeCopy(operation, context), (error: Error) => {
        ok(error instanceof OperationError)
        strictEqual(error.operationType, 'copy')
        return true
      })
    })

    test('should throw error if destination exists and overwrite is false', async () => {
      const sourceFile = join(templateDir, 'source.txt')
      await writeFile(sourceFile, 'source content')

      const destFile = join(workspaceDir, 'destination.txt')
      await writeFile(destFile, 'existing content')

      const operation: CopyOperation = {
        type: 'copy',
        from: 'source.txt',
        to: 'destination.txt',
        overwrite: false,
      }

      await rejects(executeCopy(operation, context), (error: Error) => {
        ok(error instanceof OperationError)
        ok(error.message.includes('already exists'))
        return true
      })
    })

    test('should overwrite destination if overwrite is true', async () => {
      const sourceFile = join(templateDir, 'source.txt')
      await writeFile(sourceFile, 'new content')

      const destFile = join(workspaceDir, 'destination.txt')
      await writeFile(destFile, 'old content')

      const operation: CopyOperation = {
        type: 'copy',
        from: 'source.txt',
        to: 'destination.txt',
        overwrite: true,
      }

      const result = await executeCopy(operation, context)

      strictEqual(result.success, true)
      const copiedContent = await readFile(destFile, 'utf-8')
      strictEqual(copiedContent, 'new content')
    })

    test('should throw error if source is a directory', async () => {
      const sourceDir = join(templateDir, 'sourcedir')
      await mkdir(sourceDir, { recursive: true })

      const operation: CopyOperation = {
        type: 'copy',
        from: 'sourcedir',
        to: 'destdir',
      }

      await rejects(executeCopy(operation, context), (error: Error) => {
        ok(error instanceof OperationError)
        ok(error.message.includes('directory'))
        return true
      })
    })

    test('should preserve file content exactly', async () => {
      const sourceFile = join(templateDir, 'data.json')
      const jsonContent = JSON.stringify({ key: 'value', number: 42 }, null, 2)
      await writeFile(sourceFile, jsonContent)

      const operation: CopyOperation = {
        type: 'copy',
        from: 'data.json',
        to: 'copied-data.json',
      }

      await executeCopy(operation, context)

      const copiedContent = await readFile(
        join(workspaceDir, 'copied-data.json'),
        'utf-8'
      )
      strictEqual(copiedContent, jsonContent)
    })
  })
})

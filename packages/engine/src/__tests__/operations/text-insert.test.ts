import { ok, rejects, strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import type { ExecutionContext, TextInsertOperation } from '@hexp/shared'
import { OperationError } from '../../errors.js'
import { executeTextInsert } from '../../operations/text-insert.js'

describe('Text Insert Operation', () => {
  let workspaceDir: string
  let context: ExecutionContext

  test.beforeEach(async () => {
    workspaceDir = join(tmpdir(), `text-insert-test-workspace-${Date.now()}`)
    await mkdir(workspaceDir, { recursive: true })

    context = {
      templateRoot: '',
      workspaceRoot: workspaceDir,
      variables: {},
    }
  })

  test.afterEach(async () => {
    await rm(workspaceDir, { recursive: true, force: true }).catch(() => {})
  })

  describe('executeTextInsert', () => {
    test('should insert text before marker', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `// @addon:auth
const existing = true;
`
      )

      const operation: TextInsertOperation = {
        type: 'textInsert',
        target: 'file.ts',
        marker: '// @addon:auth',
        content: 'import { auth } from "./auth";\n',
        position: 'before',
      }

      const result = await executeTextInsert(operation, context)

      strictEqual(result.success, true)
      ok(result.filesAffected?.includes('file.ts'))

      const content = await readFile(targetFile, 'utf-8')
      ok(content.includes('import { auth } from "./auth";'))
      ok(content.includes('// @addon:auth'))
      ok(content.includes('const existing = true;'))
      strictEqual(content.indexOf('import'), 0)
    })

    test('should insert text after marker', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `// @addon:auth
const existing = true;
`
      )

      const operation: TextInsertOperation = {
        type: 'textInsert',
        target: 'file.ts',
        marker: '// @addon:auth',
        content: '\n// Auth middleware added\n',
        position: 'after',
      }

      const result = await executeTextInsert(operation, context)

      strictEqual(result.success, true)

      const content = await readFile(targetFile, 'utf-8')
      ok(content.includes('// @addon:auth'))
      ok(content.includes('// Auth middleware added'))
      ok(content.includes('const existing = true;'))
      const markerIndex = content.indexOf('// @addon:auth')
      const insertedIndex = content.indexOf('// Auth middleware added')
      ok(insertedIndex > markerIndex)
    })

    test('should default to after position when not specified', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `// @addon:auth
const existing = true;
`
      )

      const operation: TextInsertOperation = {
        type: 'textInsert',
        target: 'file.ts',
        marker: '// @addon:auth',
        content: '\n// Default position\n',
      }

      await executeTextInsert(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      const markerIndex = content.indexOf('// @addon:auth')
      const insertedIndex = content.indexOf('// Default position')
      ok(insertedIndex > markerIndex)
    })

    test('should throw error if target file does not exist', async () => {
      const operation: TextInsertOperation = {
        type: 'textInsert',
        target: 'nonexistent.ts',
        marker: '// marker',
        content: 'content',
      }

      await rejects(executeTextInsert(operation, context), (error: Error) => {
        ok(error instanceof OperationError)
        strictEqual(error.operationType, 'textInsert')
        ok(error.message.includes('does not exist'))
        return true
      })
    })

    test('should throw error if marker is not found', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(targetFile, 'const x = 1;')

      const operation: TextInsertOperation = {
        type: 'textInsert',
        target: 'file.ts',
        marker: '// @addon:auth',
        content: 'content',
      }

      await rejects(executeTextInsert(operation, context), (error: Error) => {
        ok(error instanceof OperationError)
        ok(error.message.includes('Marker not found'))
        return true
      })
    })

    test('should handle multiple occurrences of marker (inserts at first)', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `// @addon:auth
const first = true;
// @addon:auth
const second = true;
`
      )

      const operation: TextInsertOperation = {
        type: 'textInsert',
        target: 'file.ts',
        marker: '// @addon:auth',
        content: '\n// Inserted\n',
        position: 'after',
      }

      await executeTextInsert(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      const firstMarkerIndex = content.indexOf('// @addon:auth')
      const insertedIndex = content.indexOf('// Inserted')
      const secondMarkerIndex = content.lastIndexOf('// @addon:auth')

      ok(insertedIndex > firstMarkerIndex)
      ok(insertedIndex < secondMarkerIndex)
    })

    test('should preserve file content exactly except for insertion', async () => {
      const originalContent = `function test() {
  // @addon:auth
  return true;
}`
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(targetFile, originalContent)

      const operation: TextInsertOperation = {
        type: 'textInsert',
        target: 'file.ts',
        marker: '// @addon:auth',
        content: '  const auth = true;\n',
        position: 'after',
      }

      await executeTextInsert(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      ok(content.includes('function test()'))
      ok(content.includes('// @addon:auth'))
      ok(content.includes('const auth = true;'))
      ok(content.includes('return true;'))
      ok(content.includes('}'))
    })

    test('should handle empty content insertion', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `// @addon:auth
const x = 1;`
      )

      const operation: TextInsertOperation = {
        type: 'textInsert',
        target: 'file.ts',
        marker: '// @addon:auth',
        content: '',
        position: 'after',
      }

      const result = await executeTextInsert(operation, context)

      strictEqual(result.success, true)
      const content = await readFile(targetFile, 'utf-8')
      strictEqual(
        content,
        `// @addon:auth
const x = 1;`
      )
    })
  })
})

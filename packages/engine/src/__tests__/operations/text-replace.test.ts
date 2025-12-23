import { ok, rejects, strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import type { ExecutionContext, TextReplaceOperation } from '@hexp/shared'
import { OperationError } from '../../errors.js'
import { executeTextReplace } from '../../operations/text-replace.js'

describe('Text Replace Operation', () => {
  let workspaceDir: string
  let context: ExecutionContext

  test.beforeEach(async () => {
    workspaceDir = join(tmpdir(), `text-replace-test-workspace-${Date.now()}`)
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

  describe('executeTextReplace', () => {
    test('should replace simple text pattern', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `const port = 3000;
const host = 'localhost';`
      )

      const operation: TextReplaceOperation = {
        type: 'textReplace',
        target: 'file.ts',
        pattern: '3000',
        replacement: '8080',
      }

      const result = await executeTextReplace(operation, context)

      strictEqual(result.success, true)
      ok(result.filesAffected?.includes('file.ts'))

      const content = await readFile(targetFile, 'utf-8')
      ok(content.includes('8080'))
      ok(!content.includes('3000'))
    })

    test('should replace all occurrences when not using regex', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `const x = 'old';
const y = 'old';
const z = 'old';`
      )

      const operation: TextReplaceOperation = {
        type: 'textReplace',
        target: 'file.ts',
        pattern: 'old',
        replacement: 'new',
      }

      await executeTextReplace(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      const occurrences = (content.match(/new/g) || []).length
      strictEqual(occurrences, 3)
      ok(!content.includes('old'))
    })

    test('should replace using regex pattern', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `const port1 = 3000;
const port2 = 4000;
const port3 = 5000;`
      )

      const operation: TextReplaceOperation = {
        type: 'textReplace',
        target: 'file.ts',
        pattern: 'port\\d+',
        replacement: 'PORT',
        isRegex: true,
      }

      await executeTextReplace(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      ok(content.includes('const PORT = 3000;'))
      ok(content.includes('const PORT = 4000;'))
      ok(content.includes('const PORT = 5000;'))
    })

    test('should replace with regex groups', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `const name = 'John';
const age = 30;`
      )

      const operation: TextReplaceOperation = {
        type: 'textReplace',
        target: 'file.ts',
        pattern: "const (\\w+) = '([^']+)';",
        replacement: "const $1 = '$2'; // replaced",
        isRegex: true,
      }

      await executeTextReplace(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      ok(content.includes("const name = 'John'; // replaced"))
    })

    test('should throw error if target file does not exist', async () => {
      const operation: TextReplaceOperation = {
        type: 'textReplace',
        target: 'nonexistent.ts',
        pattern: 'old',
        replacement: 'new',
      }

      await rejects(executeTextReplace(operation, context), (error: Error) => {
        ok(error instanceof OperationError)
        strictEqual(error.operationType, 'textReplace')
        ok(error.message.includes('does not exist'))
        return true
      })
    })

    test('should throw error if regex pattern is invalid', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(targetFile, 'content')

      const operation: TextReplaceOperation = {
        type: 'textReplace',
        target: 'file.ts',
        pattern: '[invalid',
        replacement: 'new',
        isRegex: true,
      }

      await rejects(executeTextReplace(operation, context), (error: Error) => {
        ok(error instanceof OperationError)
        ok(error.message.includes('Invalid regex pattern'))
        return true
      })
    })

    test('should handle empty pattern replacement', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(targetFile, 'const x = 1;')

      const operation: TextReplaceOperation = {
        type: 'textReplace',
        target: 'file.ts',
        pattern: 'const ',
        replacement: '',
      }

      await executeTextReplace(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      strictEqual(content, 'x = 1;')
    })

    test('should handle multiline replacements', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `function old() {
  return true;
}`
      )

      const operation: TextReplaceOperation = {
        type: 'textReplace',
        target: 'file.ts',
        pattern: 'function old()',
        replacement: 'function new()',
      }

      await executeTextReplace(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      ok(content.includes('function new()'))
      ok(!content.includes('function old()'))
      ok(content.includes('return true;'))
    })

    test('should preserve file content when pattern not found', async () => {
      const originalContent = `const x = 1;
const y = 2;`
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(targetFile, originalContent)

      const operation: TextReplaceOperation = {
        type: 'textReplace',
        target: 'file.ts',
        pattern: 'nonexistent',
        replacement: 'new',
      }

      await executeTextReplace(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      strictEqual(content, originalContent)
    })

    test('should handle special regex characters in non-regex mode', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `const pattern = '[test]';
const regex = '.*';`
      )

      const operation: TextReplaceOperation = {
        type: 'textReplace',
        target: 'file.ts',
        pattern: '[test]',
        replacement: '[replaced]',
        isRegex: false,
      }

      await executeTextReplace(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      ok(content.includes("const pattern = '[replaced]';"))
      ok(content.includes("const regex = '.*';"))
    })

    test('should replace with complex regex pattern', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `const API_URL = 'http://localhost:3000/api';
const WS_URL = 'ws://localhost:3000/ws';`
      )

      const operation: TextReplaceOperation = {
        type: 'textReplace',
        target: 'file.ts',
        pattern: '(http|ws)://localhost:(\\d+)',
        replacement: '$1://example.com:$2',
        isRegex: true,
      }

      await executeTextReplace(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      ok(content.includes("const API_URL = 'http://example.com:3000/api';"))
      ok(content.includes("const WS_URL = 'ws://example.com:3000/ws';"))
    })
  })
})

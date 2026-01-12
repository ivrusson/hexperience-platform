import { ok, rejects, strictEqual } from 'node:assert'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import type { CodemodOperation, ExecutionContext } from '@hexp/shared'
import { OperationError } from '../../errors'
import { executeCodemod } from '../../operations/codemod'

describe('Codemod Operation', () => {
  let workspaceDir: string
  let context: ExecutionContext

  test.beforeEach(async () => {
    workspaceDir = join(tmpdir(), `codemod-test-workspace-${Date.now()}`)
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

  describe('executeCodemod', () => {
    test('should add import statement to file', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `export function test() {
  return true;
}
`
      )

      const operation: CodemodOperation = {
        type: 'codemod',
        target: 'file.ts',
        transform: `
          sourceFile.addImportDeclaration({
            moduleSpecifier: './utils',
            namedImports: [{ name: 'helper' }]
          });
        `,
      }

      const result = await executeCodemod(operation, context)

      strictEqual(result.success, true)
      ok(result.filesAffected?.includes('file.ts'))

      const content = await readFile(targetFile, 'utf-8')
      // ts-morph may format imports differently, check for key parts
      ok(
        content.includes('helper') &&
          (content.includes("from './utils'") ||
            content.includes('from "./utils"'))
      )
      ok(content.includes('export function test()'))
    })

    test('should modify existing code', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(
        targetFile,
        `class MyClass {
  method() {
    return 'old';
  }
}
`
      )

      const operation: CodemodOperation = {
        type: 'codemod',
        target: 'file.ts',
        transform: `
          const classes = sourceFile.getClasses();
          if (classes.length > 0) {
            const method = classes[0].getMethod('method');
            if (method) {
              method.setBodyText("return 'new';");
            }
          }
        `,
      }

      await executeCodemod(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      ok(content.includes("return 'new'"))
      ok(!content.includes("return 'old'"))
    })

    test('should throw error if target file does not exist', async () => {
      const operation: CodemodOperation = {
        type: 'codemod',
        target: 'nonexistent.ts',
        transform: '// no-op',
      }

      await rejects(executeCodemod(operation, context), (error: Error) => {
        ok(error instanceof OperationError)
        strictEqual(error.operationType, 'codemod')
        ok(error.message.includes('does not exist'))
        return true
      })
    })

    test('should handle invalid transform gracefully', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(targetFile, 'const x = 1;')

      const operation: CodemodOperation = {
        type: 'codemod',
        target: 'file.ts',
        transform: `
          // Invalid code that will throw
          sourceFile.getNonExistentMethod();
        `,
      }

      await rejects(executeCodemod(operation, context), (error: Error) => {
        ok(error instanceof OperationError)
        ok(error.message.includes('Transform execution failed'))
        return true
      })
    })

    test('should preserve file structure when transform is minimal', async () => {
      const originalContent = `export function test() {
  return true;
}
`
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(targetFile, originalContent)

      const operation: CodemodOperation = {
        type: 'codemod',
        target: 'file.ts',
        transform: `
          // Minimal transform - just get the file
          const functions = sourceFile.getFunctions();
        `,
      }

      await executeCodemod(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      ok(content.includes('export function test()'))
      ok(content.includes('return true'))
    })

    test('should accept options parameter', async () => {
      const targetFile = join(workspaceDir, 'file.ts')
      await writeFile(targetFile, 'const x = 1;')

      const operation: CodemodOperation = {
        type: 'codemod',
        target: 'file.ts',
        transform: `
          // Use options if provided
          if (options && options.addComment) {
            sourceFile.insertText(0, '// Generated code\\n');
          }
        `,
        options: {
          addComment: true,
        },
      }

      await executeCodemod(operation, context)

      const content = await readFile(targetFile, 'utf-8')
      ok(content.includes('// Generated code'))
    })
  })
})

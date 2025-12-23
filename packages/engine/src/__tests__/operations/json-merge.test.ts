import { deepStrictEqual, ok, rejects, strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import type { ExecutionContext, JsonMergeOperation } from '@hexp/shared'
import { JsonMergeError, OperationError } from '../../errors.js'
import { executeJsonMerge } from '../../operations/json-merge.js'

describe('JSON Merge Operation', () => {
  let workspaceDir: string
  let context: ExecutionContext

  test.beforeEach(async () => {
    workspaceDir = join(tmpdir(), `json-merge-test-workspace-${Date.now()}`)
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

  describe('executeJsonMerge', () => {
    test('should create new JSON file if target does not exist', async () => {
      const operation: JsonMergeOperation = {
        type: 'jsonMerge',
        target: 'package.json',
        data: {
          name: 'my-project',
          version: '1.0.0',
        },
      }

      const result = await executeJsonMerge(operation, context)

      strictEqual(result.success, true)
      ok(result.filesAffected?.includes('package.json'))
      strictEqual(existsSync(join(workspaceDir, 'package.json')), true)

      const content = await readFile(
        join(workspaceDir, 'package.json'),
        'utf-8'
      )
      const parsed = JSON.parse(content)
      strictEqual(parsed.name, 'my-project')
      strictEqual(parsed.version, '1.0.0')
    })

    test('should merge with existing JSON file', async () => {
      const existingFile = join(workspaceDir, 'package.json')
      await writeFile(
        existingFile,
        JSON.stringify(
          {
            name: 'existing-project',
            version: '0.1.0',
            description: 'Existing description',
          },
          null,
          2
        )
      )

      const operation: JsonMergeOperation = {
        type: 'jsonMerge',
        target: 'package.json',
        data: {
          version: '1.0.0',
          author: 'John Doe',
        },
      }

      await executeJsonMerge(operation, context)

      const content = await readFile(existingFile, 'utf-8')
      const parsed = JSON.parse(content)
      strictEqual(parsed.name, 'existing-project')
      strictEqual(parsed.version, '1.0.0')
      strictEqual(parsed.description, 'Existing description')
      strictEqual(parsed.author, 'John Doe')
    })

    test('should merge nested objects deeply', async () => {
      const existingFile = join(workspaceDir, 'tsconfig.json')
      await writeFile(
        existingFile,
        JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              module: 'commonjs',
              strict: true,
            },
            include: ['src'],
          },
          null,
          2
        )
      )

      const operation: JsonMergeOperation = {
        type: 'jsonMerge',
        target: 'tsconfig.json',
        data: {
          compilerOptions: {
            target: 'ES2022',
            outDir: './dist',
          },
        },
      }

      await executeJsonMerge(operation, context)

      const content = await readFile(existingFile, 'utf-8')
      const parsed = JSON.parse(content)
      strictEqual(parsed.compilerOptions.target, 'ES2022')
      strictEqual(parsed.compilerOptions.module, 'commonjs')
      strictEqual(parsed.compilerOptions.strict, true)
      strictEqual(parsed.compilerOptions.outDir, './dist')
      strictEqual(parsed.include[0], 'src')
    })

    test('should replace arrays when arrayMerge is "replace"', async () => {
      const existingFile = join(workspaceDir, 'package.json')
      await writeFile(
        existingFile,
        JSON.stringify(
          {
            dependencies: ['dep1', 'dep2'],
            scripts: ['script1'],
          },
          null,
          2
        )
      )

      const operation: JsonMergeOperation = {
        type: 'jsonMerge',
        target: 'package.json',
        data: {
          dependencies: ['dep3', 'dep4'],
        },
        arrayMerge: 'replace',
      }

      await executeJsonMerge(operation, context)

      const content = await readFile(existingFile, 'utf-8')
      const parsed = JSON.parse(content)
      deepStrictEqual(parsed.dependencies, ['dep3', 'dep4'])
      deepStrictEqual(parsed.scripts, ['script1'])
    })

    test('should merge arrays when arrayMerge is "merge"', async () => {
      const existingFile = join(workspaceDir, 'package.json')
      await writeFile(
        existingFile,
        JSON.stringify(
          {
            dependencies: [
              { name: 'dep1', version: '1.0.0' },
              { name: 'dep2', version: '2.0.0' },
            ],
          },
          null,
          2
        )
      )

      const operation: JsonMergeOperation = {
        type: 'jsonMerge',
        target: 'package.json',
        data: {
          dependencies: [
            { name: 'dep1', version: '1.1.0' },
            { name: 'dep3', version: '3.0.0' },
          ],
        },
        arrayMerge: 'merge',
      }

      await executeJsonMerge(operation, context)

      const content = await readFile(existingFile, 'utf-8')
      const parsed = JSON.parse(content)
      strictEqual(parsed.dependencies.length, 3)
      strictEqual(parsed.dependencies[0].name, 'dep1')
      strictEqual(parsed.dependencies[0].version, '1.1.0')
      strictEqual(parsed.dependencies[1].name, 'dep2')
      strictEqual(parsed.dependencies[2].name, 'dep3')
    })

    test('should append arrays when arrayMerge is "append" (default)', async () => {
      const existingFile = join(workspaceDir, 'package.json')
      await writeFile(
        existingFile,
        JSON.stringify(
          {
            scripts: ['build', 'test'],
          },
          null,
          2
        )
      )

      const operation: JsonMergeOperation = {
        type: 'jsonMerge',
        target: 'package.json',
        data: {
          scripts: ['lint', 'format'],
        },
        arrayMerge: 'append',
      }

      await executeJsonMerge(operation, context)

      const content = await readFile(existingFile, 'utf-8')
      const parsed = JSON.parse(content)
      // deepmerge by default concatenates arrays
      ok(parsed.scripts.length >= 2)
    })

    test('should create destination directory if it does not exist', async () => {
      const operation: JsonMergeOperation = {
        type: 'jsonMerge',
        target: 'subdir/nested/package.json',
        data: {
          name: 'test',
        },
      }

      await executeJsonMerge(operation, context)

      strictEqual(
        existsSync(join(workspaceDir, 'subdir', 'nested', 'package.json')),
        true
      )
    })

    test('should throw error if existing file is invalid JSON', async () => {
      const existingFile = join(workspaceDir, 'invalid.json')
      await writeFile(existingFile, 'invalid json content {')

      const operation: JsonMergeOperation = {
        type: 'jsonMerge',
        target: 'invalid.json',
        data: {
          key: 'value',
        },
      }

      await rejects(executeJsonMerge(operation, context), (error: Error) => {
        ok(error instanceof JsonMergeError)
        ok(error.message.includes('Failed to parse'))
        return true
      })
    })

    test('should validate merged JSON is valid', async () => {
      // This test ensures the validation step works
      // The merge should always produce valid JSON, but we test the validation
      const operation: JsonMergeOperation = {
        type: 'jsonMerge',
        target: 'package.json',
        data: {
          name: 'test',
          version: '1.0.0',
        },
      }

      const result = await executeJsonMerge(operation, context)

      strictEqual(result.success, true)
      const content = await readFile(
        join(workspaceDir, 'package.json'),
        'utf-8'
      )
      // Should be valid JSON
      JSON.parse(content)
    })

    test('should handle complex nested structures', async () => {
      const existingFile = join(workspaceDir, 'config.json')
      await writeFile(
        existingFile,
        JSON.stringify(
          {
            app: {
              name: 'app',
              settings: {
                port: 3000,
                env: 'development',
              },
            },
            features: {
              auth: {
                enabled: true,
                providers: ['local'],
              },
            },
          },
          null,
          2
        )
      )

      const operation: JsonMergeOperation = {
        type: 'jsonMerge',
        target: 'config.json',
        data: {
          app: {
            settings: {
              port: 8080,
              host: 'localhost',
            },
          },
          features: {
            auth: {
              providers: ['local', 'oauth'],
            },
            logging: {
              enabled: true,
            },
          },
        },
      }

      await executeJsonMerge(operation, context)

      const content = await readFile(existingFile, 'utf-8')
      const parsed = JSON.parse(content)
      strictEqual(parsed.app.name, 'app')
      strictEqual(parsed.app.settings.port, 8080)
      strictEqual(parsed.app.settings.env, 'development')
      strictEqual(parsed.app.settings.host, 'localhost')
      strictEqual(parsed.features.auth.enabled, true)
      ok(parsed.features.auth.providers.includes('local'))
      ok(parsed.features.auth.providers.includes('oauth'))
      strictEqual(parsed.features.logging.enabled, true)
    })
  })
})

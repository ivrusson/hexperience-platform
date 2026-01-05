import { ok, rejects, strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import type { EnvAppendOperation, ExecutionContext } from '@hexp/shared'
import { OperationError } from '../../errors.js'
import { executeEnvAppend } from '../../operations/env-append.js'

describe('Env Append Operation', () => {
  let workspaceDir: string
  let context: ExecutionContext

  test.beforeEach(async () => {
    workspaceDir = join(tmpdir(), `env-append-test-workspace-${Date.now()}`)
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

  describe('executeEnvAppend', () => {
    test('should create new .env file with variables', async () => {
      const operation: EnvAppendOperation = {
        type: 'envAppend',
        target: '.env',
        variables: {
          DATABASE_URL: 'postgres://localhost:5432/mydb',
          API_KEY: 'secret-key-123',
        },
      }

      const result = await executeEnvAppend(operation, context)

      strictEqual(result.success, true)
      ok(result.filesAffected?.includes('.env'))
      strictEqual(existsSync(join(workspaceDir, '.env')), true)

      const content = await readFile(join(workspaceDir, '.env'), 'utf-8')
      ok(content.includes('DATABASE_URL=postgres://localhost:5432/mydb'))
      ok(content.includes('API_KEY=secret-key-123'))
    })

    test('should append variables to existing .env file', async () => {
      const existingEnv = join(workspaceDir, '.env')
      await writeFile(
        existingEnv,
        `EXISTING_VAR=existing-value
# Comment line
ANOTHER_VAR=another-value
`
      )

      const operation: EnvAppendOperation = {
        type: 'envAppend',
        target: '.env',
        variables: {
          NEW_VAR: 'new-value',
        },
      }

      const result = await executeEnvAppend(operation, context)

      strictEqual(result.success, true)

      const content = await readFile(existingEnv, 'utf-8')
      ok(content.includes('EXISTING_VAR=existing-value'))
      ok(content.includes('ANOTHER_VAR=another-value'))
      ok(content.includes('NEW_VAR=new-value'))
      ok(content.includes('# Comment line'))
    })

    test('should not duplicate existing variables', async () => {
      const existingEnv = join(workspaceDir, '.env')
      await writeFile(existingEnv, 'DATABASE_URL=existing-url\n')

      const operation: EnvAppendOperation = {
        type: 'envAppend',
        target: '.env',
        variables: {
          DATABASE_URL: 'new-url',
          NEW_VAR: 'new-value',
        },
      }

      await executeEnvAppend(operation, context)

      const content = await readFile(existingEnv, 'utf-8')
      const matches = content.match(/DATABASE_URL=/g)
      strictEqual(matches?.length, 1) // Should only appear once
      ok(content.includes('NEW_VAR=new-value'))
    })

    test('should preserve comments and empty lines', async () => {
      const existingEnv = join(workspaceDir, '.env')
      await writeFile(
        existingEnv,
        `# Database configuration
DATABASE_URL=postgres://localhost:5432/mydb

# API configuration
`
      )

      const operation: EnvAppendOperation = {
        type: 'envAppend',
        target: '.env',
        variables: {
          API_KEY: 'secret-key',
        },
      }

      await executeEnvAppend(operation, context)

      const content = await readFile(existingEnv, 'utf-8')
      ok(content.includes('# Database configuration'))
      ok(content.includes('# API configuration'))
      ok(content.includes('DATABASE_URL=postgres://localhost:5432/mydb'))
      ok(content.includes('API_KEY=secret-key'))
    })

    test('should use custom env file when specified', async () => {
      const operation: EnvAppendOperation = {
        type: 'envAppend',
        target: '.env.example',
        envFile: '.env.example',
        variables: {
          DATABASE_URL: 'postgres://localhost:5432/mydb',
        },
      }

      await executeEnvAppend(operation, context)

      strictEqual(existsSync(join(workspaceDir, '.env.example')), true)
      const content = await readFile(
        join(workspaceDir, '.env.example'),
        'utf-8'
      )
      ok(content.includes('DATABASE_URL=postgres://localhost:5432/mydb'))
    })

    test('should handle empty variables object', async () => {
      const existingEnv = join(workspaceDir, '.env')
      await writeFile(existingEnv, 'EXISTING_VAR=value\n')

      const operation: EnvAppendOperation = {
        type: 'envAppend',
        target: '.env',
        variables: {},
      }

      const result = await executeEnvAppend(operation, context)

      strictEqual(result.success, true)
      const content = await readFile(existingEnv, 'utf-8')
      strictEqual(content.trim(), 'EXISTING_VAR=value')
    })

    test('should handle variables with special characters', async () => {
      const operation: EnvAppendOperation = {
        type: 'envAppend',
        target: '.env',
        variables: {
          PASSWORD: 'p@ssw0rd!',
          URL: 'https://example.com?param=value&other=123',
        },
      }

      await executeEnvAppend(operation, context)

      const content = await readFile(join(workspaceDir, '.env'), 'utf-8')
      ok(content.includes('PASSWORD=p@ssw0rd!'))
      ok(content.includes('URL=https://example.com?param=value&other=123'))
    })

    test('should handle multiple variables correctly', async () => {
      const operation: EnvAppendOperation = {
        type: 'envAppend',
        target: '.env',
        variables: {
          VAR1: 'value1',
          VAR2: 'value2',
          VAR3: 'value3',
          VAR4: 'value4',
        },
      }

      await executeEnvAppend(operation, context)

      const content = await readFile(join(workspaceDir, '.env'), 'utf-8')
      ok(content.includes('VAR1=value1'))
      ok(content.includes('VAR2=value2'))
      ok(content.includes('VAR3=value3'))
      ok(content.includes('VAR4=value4'))
    })
  })
})

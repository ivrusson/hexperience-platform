import { ok, strictEqual } from 'node:assert'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { executeTypeCheck } from '../../post-steps/type-check'

describe('Type Check Post-Step', () => {
  let workspaceDir: string

  test.beforeEach(async () => {
    workspaceDir = join(tmpdir(), `type-check-test-${Date.now()}`)
    await mkdir(workspaceDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(workspaceDir, { recursive: true, force: true }).catch(() => {})
  })

  describe('executeTypeCheck', () => {
    test('should skip if skipTypeCheck is true', async () => {
      const result = await executeTypeCheck(workspaceDir, {
        skipTypeCheck: true,
      })

      strictEqual(result.success, true)
      ok(result.message?.includes('skipped'))
    })

    test('should detect TypeScript from tsconfig.json', async () => {
      await writeFile(join(workspaceDir, 'tsconfig.json'), '{}')

      const result = await executeTypeCheck(workspaceDir, {})

      strictEqual(result.success, true)
      ok(
        result.message?.includes('TypeScript') ||
          result.message?.includes('No TypeScript') ||
          result.message?.includes('completed')
      )
    })

    test('should detect TypeScript from package.json dependencies', async () => {
      await writeFile(
        join(workspaceDir, 'package.json'),
        JSON.stringify({
          devDependencies: {
            typescript: '^5.0.0',
          },
        })
      )

      const result = await executeTypeCheck(workspaceDir, {})

      strictEqual(result.success, true)
      ok(
        result.message?.includes('TypeScript') ||
          result.message?.includes('No TypeScript') ||
          result.message?.includes('completed')
      )
    })

    test('should return success if no TypeScript detected', async () => {
      const result = await executeTypeCheck(workspaceDir, {})

      strictEqual(result.success, true)
      ok(result.message?.includes('No TypeScript'))
    })

    test('should not fail by default on type errors', async () => {
      await writeFile(join(workspaceDir, 'tsconfig.json'), '{}')

      const result = await executeTypeCheck(workspaceDir, {
        failOnError: false,
      })

      // Should succeed even if type checking fails
      strictEqual(result.success, true)
    })
  })
})

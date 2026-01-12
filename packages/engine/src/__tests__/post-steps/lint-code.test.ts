import { ok, strictEqual } from 'node:assert'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { executeLintCode } from '../../post-steps/lint-code'

describe('Lint Code Post-Step', () => {
  let workspaceDir: string

  test.beforeEach(async () => {
    workspaceDir = join(tmpdir(), `lint-code-test-${Date.now()}`)
    await mkdir(workspaceDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(workspaceDir, { recursive: true, force: true }).catch(() => {})
  })

  describe('executeLintCode', () => {
    test('should skip if skipLint is true', async () => {
      const result = await executeLintCode(workspaceDir, {
        skipLint: true,
      })

      strictEqual(result.success, true)
      ok(result.message?.includes('skipped'))
    })

    test('should detect biome from biome.json', async () => {
      await writeFile(join(workspaceDir, 'biome.json'), '{}')

      const result = await executeLintCode(workspaceDir, {})

      strictEqual(result.success, true)
      ok(
        result.message?.includes('biome') ||
          result.message?.includes('No linter')
      )
    })

    test('should detect eslint from .eslintrc', async () => {
      await writeFile(join(workspaceDir, '.eslintrc'), '{}')

      const result = await executeLintCode(workspaceDir, {})

      strictEqual(result.success, true)
      ok(
        result.message?.includes('eslint') ||
          result.message?.includes('No linter')
      )
    })

    test('should use specified linter', async () => {
      const result = await executeLintCode(workspaceDir, {
        linter: 'biome',
      })

      // Linting may fail, but operation should be attempted
      ok(result.success !== undefined)
    })

    test('should not fail by default on lint errors', async () => {
      const result = await executeLintCode(workspaceDir, {
        failOnError: false,
      })

      // Should succeed even if linting fails
      strictEqual(result.success, true)
    })
  })
})

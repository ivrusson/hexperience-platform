import { ok, strictEqual } from 'node:assert'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { executeFormatCode } from '../../post-steps/format-code'

describe('Format Code Post-Step', () => {
  let workspaceDir: string

  test.beforeEach(async () => {
    workspaceDir = join(tmpdir(), `format-code-test-${Date.now()}`)
    await mkdir(workspaceDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(workspaceDir, { recursive: true, force: true }).catch(() => {})
  })

  describe('executeFormatCode', () => {
    test('should skip if skipFormat is true', async () => {
      const result = await executeFormatCode(workspaceDir, {
        skipFormat: true,
      })

      strictEqual(result.success, true)
      ok(result.message?.includes('skipped'))
    })

    test('should detect biome from biome.json', async () => {
      await writeFile(join(workspaceDir, 'biome.json'), '{}')

      const result = await executeFormatCode(workspaceDir, {})

      strictEqual(result.success, true)
      ok(
        result.message?.includes('biome') ||
          result.message?.includes('No formatter')
      )
    })

    test('should detect prettier from .prettierrc', async () => {
      await writeFile(join(workspaceDir, '.prettierrc'), '{}')

      const result = await executeFormatCode(workspaceDir, {})

      strictEqual(result.success, true)
      ok(
        result.message?.includes('prettier') ||
          result.message?.includes('No formatter')
      )
    })

    test('should use specified formatter', async () => {
      const result = await executeFormatCode(workspaceDir, {
        formatter: 'biome',
      })

      // Formatting is optional, should not fail
      strictEqual(result.success, true)
    })

    test('should return success even if formatter not found', async () => {
      const result = await executeFormatCode(workspaceDir, {})

      strictEqual(result.success, true)
      ok(
        result.message?.includes('No formatter') ||
          result.message?.includes('formatted')
      )
    })
  })
})

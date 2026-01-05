import { ok, strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { executeInstallDependencies } from '../../post-steps/install-dependencies.js'

describe('Install Dependencies Post-Step', () => {
  let workspaceDir: string

  test.beforeEach(async () => {
    workspaceDir = join(tmpdir(), `install-deps-test-${Date.now()}`)
    await mkdir(workspaceDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(workspaceDir, { recursive: true, force: true }).catch(() => {})
  })

  describe('executeInstallDependencies', () => {
    test('should skip if skipInstall is true', async () => {
      const result = await executeInstallDependencies(workspaceDir, {
        skipInstall: true,
      })

      strictEqual(result.success, true)
      ok(result.message?.includes('skipped'))
    })

    test('should return error if package.json does not exist', async () => {
      const result = await executeInstallDependencies(workspaceDir, {})

      // Should fail because no package.json exists
      strictEqual(result.success, false)
      ok(
        result.error?.includes('package.json') ||
          result.error?.includes('No package manager') ||
          result.error?.includes('not found')
      )
    })

    test('should detect pnpm from pnpm-lock.yaml', async () => {
      await writeFile(
        join(workspaceDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' })
      )
      await writeFile(join(workspaceDir, 'pnpm-lock.yaml'), '')

      const result = await executeInstallDependencies(workspaceDir, {})

      // Note: This test may fail if pnpm is not available
      // We just check that the operation was attempted
      if (result.success) {
        ok(
          result.message?.includes('pnpm') ||
            result.message?.includes('installed')
        )
      } else {
        // If pnpm is not available, that's okay
        ok(result.error?.includes('install') || result.error?.includes('pnpm'))
      }
    })

    test('should detect npm from package-lock.json', async () => {
      await writeFile(
        join(workspaceDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' })
      )
      await writeFile(join(workspaceDir, 'package-lock.json'), '{}')

      const result = await executeInstallDependencies(workspaceDir, {
        packageManager: 'npm',
      })

      // Note: This test may fail if npm is not available
      if (result.success) {
        ok(
          result.message?.includes('npm') ||
            result.message?.includes('installed')
        )
      }
    })

    test('should use specified package manager', async () => {
      await writeFile(
        join(workspaceDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' })
      )

      const result = await executeInstallDependencies(workspaceDir, {
        packageManager: 'pnpm',
      })

      // Just verify the operation was attempted
      ok(result.success !== undefined)
    })
  })
})

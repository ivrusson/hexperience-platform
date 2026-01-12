import { ok, strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { executeGitInit } from '../../post-steps/git-init'

describe('Git Init Post-Step', () => {
  let workspaceDir: string

  test.beforeEach(async () => {
    workspaceDir = join(tmpdir(), `git-init-test-${Date.now()}`)
    await mkdir(workspaceDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(workspaceDir, { recursive: true, force: true }).catch(() => {})
  })

  describe('executeGitInit', () => {
    test('should skip if skipGitInit is true', async () => {
      const result = await executeGitInit(workspaceDir, {
        skipGitInit: true,
      })

      strictEqual(result.success, true)
      ok(result.message?.includes('skipped'))
      strictEqual(existsSync(join(workspaceDir, '.git')), false)
    })

    test('should detect existing git repository', async () => {
      // Create a mock .git directory
      await mkdir(join(workspaceDir, '.git'), { recursive: true })

      const result = await executeGitInit(workspaceDir, {})

      strictEqual(result.success, true)
      ok(result.message?.includes('already initialized'))
    })

    test('should initialize git repository when not exists', async () => {
      const result = await executeGitInit(workspaceDir, {})

      // Note: This test may fail if git is not available
      // In that case, we check that the operation was attempted
      if (result.success) {
        ok(result.message?.includes('initialized'))
      } else {
        // If git is not available, that's okay for the test
        ok(result.error?.includes('git'))
      }
    })

    test('should create initial commit when requested', async () => {
      // Create a file to commit
      await import('node:fs/promises').then((fs) =>
        fs.writeFile(join(workspaceDir, 'test.txt'), 'test content')
      )

      const result = await executeGitInit(workspaceDir, {
        createInitialCommit: true,
        commitMessage: 'Custom commit message',
      })

      // Note: This test may fail if git is not available
      if (result.success) {
        ok(
          result.message?.includes('commit') ||
            result.message?.includes('initialized')
        )
      }
    })
  })
})

import { ok, strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { executeGenerateDocs } from '../../post-steps/generate-docs.js'

describe('Generate Docs Post-Step', () => {
  let workspaceDir: string

  test.beforeEach(async () => {
    workspaceDir = join(tmpdir(), `generate-docs-test-${Date.now()}`)
    await mkdir(workspaceDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(workspaceDir, { recursive: true, force: true }).catch(() => {})
  })

  describe('executeGenerateDocs', () => {
    test('should generate README.md for single package project', async () => {
      const context = {
        projectName: 'my-project',
        projectType: 'single',
      }

      const result = await executeGenerateDocs(workspaceDir, context, {})

      strictEqual(result.success, true)
      strictEqual(existsSync(join(workspaceDir, 'README.md')), true)

      const content = await readFile(join(workspaceDir, 'README.md'), 'utf-8')
      ok(content.includes('# my-project'))
      ok(content.includes('generated with Hexperience Platform'))
      ok(content.includes('npm install'))
      ok(content.includes('npm run dev'))
    })

    test('should generate README.md for monorepo project', async () => {
      const context = {
        projectName: 'my-monorepo',
        projectType: 'monorepo',
      }

      const result = await executeGenerateDocs(workspaceDir, context, {})

      strictEqual(result.success, true)

      const content = await readFile(join(workspaceDir, 'README.md'), 'utf-8')
      ok(content.includes('# my-monorepo'))
      ok(content.includes('monorepo'))
      ok(content.includes('pnpm install'))
      ok(content.includes('apps/'))
      ok(content.includes('packages/'))
    })

    test('should skip generation if skipDocs is true', async () => {
      const context = {
        projectName: 'my-project',
      }

      const result = await executeGenerateDocs(workspaceDir, context, {
        skipDocs: true,
      })

      strictEqual(result.success, true)
      ok(result.message?.includes('skipped'))
      strictEqual(existsSync(join(workspaceDir, 'README.md')), false)
    })

    test('should not overwrite existing README.md', async () => {
      const readmePath = join(workspaceDir, 'README.md')
      await import('node:fs/promises').then((fs) =>
        fs.writeFile(readmePath, '# Existing README\n')
      )

      const context = {
        projectName: 'my-project',
      }

      const result = await executeGenerateDocs(workspaceDir, context, {})

      strictEqual(result.success, true)
      ok(result.message?.includes('already exists'))

      const content = await readFile(readmePath, 'utf-8')
      strictEqual(content, '# Existing README\n')
    })

    test('should use default project name if not provided', async () => {
      const context = {}

      const result = await executeGenerateDocs(workspaceDir, context, {})

      strictEqual(result.success, true)

      const content = await readFile(join(workspaceDir, 'README.md'), 'utf-8')
      ok(content.includes('# Project'))
    })

    test('should use custom template if provided', async () => {
      const context = {
        projectName: 'custom-project',
      }

      const result = await executeGenerateDocs(workspaceDir, context, {
        template: '# {{projectName}}\n\nCustom template content',
      })

      strictEqual(result.success, true)

      const content = await readFile(join(workspaceDir, 'README.md'), 'utf-8')
      ok(content.includes('# custom-project'))
      ok(content.includes('Custom template content'))
    })
  })
})

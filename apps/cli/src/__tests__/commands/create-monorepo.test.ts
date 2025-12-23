import { strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { createCommand } from '../commands/create.ts'

describe('create command - monorepo generation', () => {
  let tempDir: string
  let templatesDir: string

  test.beforeEach(async () => {
    tempDir = join(tmpdir(), `create-monorepo-test-${Date.now()}`)
    templatesDir = join(tempDir, 'templates')
    await mkdir(templatesDir, { recursive: true })
    await mkdir(join(templatesDir, 'bases'), { recursive: true })
    await mkdir(join(templatesDir, 'addons'), { recursive: true })

    // Create a mock base template with monorepo projectType
    const baseDir = join(templatesDir, 'bases', 'monorepo-base')
    await mkdir(baseDir, { recursive: true })
    await mkdir(join(baseDir, 'template'), { recursive: true })
    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'monorepo-base',
        type: 'base',
        name: 'Monorepo Base',
        description: 'A monorepo base template',
        projectType: 'monorepo',
        capabilities: ['web-server'],
        ops: [
          {
            type: 'copy',
            from: 'template/**',
            to: '.',
          },
        ],
      })
    )

    // Create a simple template file
    await writeFile(join(baseDir, 'template', 'test.txt'), 'test content')
  })

  test.afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('should generate monorepo files when projectType is monorepo', async () => {
    const outputDir = join(tempDir, 'output-monorepo')
    const originalCwd = process.cwd()

    try {
      process.chdir(tempDir)

      // Suppress console output during test
      const originalLog = console.log
      const originalError = console.error
      console.log = () => {}
      console.error = () => {}

      await createCommand({
        base: 'monorepo-base',
        name: 'test-monorepo',
        output: outputDir,
      })

      console.log = originalLog
      console.error = originalError

      // Verify monorepo structure was created
      strictEqual(existsSync(join(outputDir, 'apps')), true)
      strictEqual(existsSync(join(outputDir, 'packages')), true)

      // Verify monorepo files were generated
      strictEqual(existsSync(join(outputDir, 'turbo.json')), true)
      strictEqual(existsSync(join(outputDir, 'pnpm-workspace.yaml')), true)
      strictEqual(existsSync(join(outputDir, 'tsconfig.json')), true)
    } finally {
      process.chdir(originalCwd)
    }
  })

  test('should generate monorepo files with --monorepo flag', async () => {
    const outputDir = join(tempDir, 'output-monorepo-flag')
    const originalCwd = process.cwd()

    try {
      process.chdir(tempDir)

      // Create a base without projectType
      const baseDir2 = join(templatesDir, 'bases', 'single-base')
      await mkdir(baseDir2, { recursive: true })
      await mkdir(join(baseDir2, 'template'), { recursive: true })
      await writeFile(
        join(baseDir2, 'manifest.json'),
        JSON.stringify({
          id: 'single-base',
          type: 'base',
          name: 'Single Base',
          description: 'A single package base template',
          capabilities: ['web-server'],
          ops: [
            {
              type: 'copy',
              from: 'template/**',
              to: '.',
            },
          ],
        })
      )
      await writeFile(join(baseDir2, 'template', 'test.txt'), 'test content')

      const originalLog = console.log
      const originalError = console.error
      console.log = () => {}
      console.error = () => {}

      await createCommand({
        base: 'single-base',
        name: 'test-monorepo-flag',
        monorepo: true,
        output: outputDir,
      })

      console.log = originalLog
      console.error = originalError

      // Verify monorepo structure was created even though base doesn't specify it
      strictEqual(existsSync(join(outputDir, 'apps')), true)
      strictEqual(existsSync(join(outputDir, 'packages')), true)
      strictEqual(existsSync(join(outputDir, 'turbo.json')), true)
    } finally {
      process.chdir(originalCwd)
    }
  })

  test('should not generate monorepo files when projectType is single', async () => {
    const outputDir = join(tempDir, 'output-single')
    const originalCwd = process.cwd()

    try {
      process.chdir(tempDir)

      // Create a single package base
      const baseDir3 = join(templatesDir, 'bases', 'single-package-base')
      await mkdir(baseDir3, { recursive: true })
      await mkdir(join(baseDir3, 'template'), { recursive: true })
      await writeFile(
        join(baseDir3, 'manifest.json'),
        JSON.stringify({
          id: 'single-package-base',
          type: 'base',
          name: 'Single Package Base',
          description: 'A single package base template',
          projectType: 'single',
          capabilities: ['web-server'],
          ops: [
            {
              type: 'copy',
              from: 'template/**',
              to: '.',
            },
          ],
        })
      )
      await writeFile(join(baseDir3, 'template', 'test.txt'), 'test content')

      const originalLog = console.log
      const originalError = console.error
      console.log = () => {}
      console.error = () => {}

      await createCommand({
        base: 'single-package-base',
        name: 'test-single',
        output: outputDir,
      })

      console.log = originalLog
      console.error = originalError

      // Verify monorepo structure was NOT created
      strictEqual(existsSync(join(outputDir, 'apps')), false)
      strictEqual(existsSync(join(outputDir, 'packages')), false)
      strictEqual(existsSync(join(outputDir, 'turbo.json')), false)
    } finally {
      process.chdir(originalCwd)
    }
  })
})

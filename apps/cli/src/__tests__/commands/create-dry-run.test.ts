import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, test } from 'node:test'
import { createCommand } from '../commands/create.js'

describe('create command - dry-run mode', () => {
  let tempDir: string
  let templatesDir: string

  test.beforeEach(async () => {
    tempDir = join(tmpdir(), `create-dry-run-test-${Date.now()}`)
    templatesDir = join(tempDir, 'templates')
    await mkdir(templatesDir, { recursive: true })
    await mkdir(join(templatesDir, 'bases'), { recursive: true })
    await mkdir(join(templatesDir, 'addons'), { recursive: true })

    // Create a mock base template
    const baseDir = join(templatesDir, 'bases', 'test-base')
    await mkdir(baseDir, { recursive: true })
    await mkdir(join(baseDir, 'template'), { recursive: true })
    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'A test base template',
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
  })

  test.afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('should show plan with --dry-run flag and not create files', async () => {
    const outputDir = join(tempDir, 'output')
    const originalCwd = process.cwd()

    try {
      // Change to temp directory to find templates
      process.chdir(tempDir)

      // Capture console output
      const logs: string[] = []
      const originalLog = console.log
      const originalError = console.error
      console.log = (...args: unknown[]) => {
        logs.push(args.map((a) => String(a)).join(' '))
        originalLog(...args)
      }
      console.error = (...args: unknown[]) => {
        logs.push(args.map((a) => String(a)).join(' '))
        originalError(...args)
      }

      await createCommand({
        base: 'test-base',
        name: 'test-project',
        output: outputDir,
        dryRun: true,
      })

      // Restore console
      console.log = originalLog
      console.error = originalError

      // Verify output directory was NOT created
      const outputExists = existsSync(outputDir)
      if (outputExists) {
        throw new Error('Output directory should not exist in dry-run mode')
      }

      // Verify plan was shown
      const output = logs.join('\n')
      if (!output.includes('Generation Plan (Dry Run)')) {
        throw new Error('Plan should be shown in dry-run mode')
      }
      if (!output.includes('test-base')) {
        throw new Error('Base template ID should be shown')
      }
      if (!output.includes('test-project')) {
        throw new Error('Project name should be shown')
      }
    } finally {
      process.chdir(originalCwd)
    }
  })

  test('should show plan with --preview flag (alias) and not create files', async () => {
    const outputDir = join(tempDir, 'output-preview')
    const originalCwd = process.cwd()

    try {
      process.chdir(tempDir)

      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.map((a) => String(a)).join(' '))
        originalLog(...args)
      }

      await createCommand({
        base: 'test-base',
        name: 'test-project',
        output: outputDir,
        preview: true,
      })

      console.log = originalLog

      // Verify output directory was NOT created
      const outputExists = existsSync(outputDir)
      if (outputExists) {
        throw new Error('Output directory should not exist in preview mode')
      }

      // Verify plan was shown
      const output = logs.join('\n')
      if (!output.includes('Generation Plan (Dry Run)')) {
        throw new Error('Plan should be shown in preview mode')
      }
    } finally {
      process.chdir(originalCwd)
    }
  })

  test('should show plan with operations count', async () => {
    const outputDir = join(tempDir, 'output-ops')
    const originalCwd = process.cwd()

    try {
      process.chdir(tempDir)

      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.map((a) => String(a)).join(' '))
        originalLog(...args)
      }

      await createCommand({
        base: 'test-base',
        name: 'test-project',
        output: outputDir,
        dryRun: true,
      })

      console.log = originalLog

      const output = logs.join('\n')
      // Should show operations count
      if (!output.includes('Operations:')) {
        throw new Error('Operations count should be shown')
      }
    } finally {
      process.chdir(originalCwd)
    }
  })

  test('should show project configuration in plan', async () => {
    const outputDir = join(tempDir, 'output-config')
    const originalCwd = process.cwd()

    try {
      process.chdir(tempDir)

      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.map((a) => String(a)).join(' '))
        originalLog(...args)
      }

      await createCommand({
        base: 'test-base',
        name: 'test-project',
        monorepo: true,
        output: outputDir,
        dryRun: true,
      })

      console.log = originalLog

      const output = logs.join('\n')
      // Should show project configuration
      if (!output.includes('Project Configuration')) {
        throw new Error('Project Configuration should be shown')
      }
      if (!output.includes('monorepo')) {
        throw new Error('Project type should be shown')
      }
    } finally {
      process.chdir(originalCwd)
    }
  })

  test('should show variables in plan', async () => {
    const outputDir = join(tempDir, 'output-vars')
    const originalCwd = process.cwd()

    try {
      process.chdir(tempDir)

      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.map((a) => String(a)).join(' '))
        originalLog(...args)
      }

      await createCommand({
        base: 'test-base',
        name: 'test-project',
        output: outputDir,
        dryRun: true,
      })

      console.log = originalLog

      const output = logs.join('\n')
      // Should show variables
      if (!output.includes('Variables:')) {
        throw new Error('Variables should be shown')
      }
      if (!output.includes('projectName')) {
        throw new Error('projectName variable should be shown')
      }
    } finally {
      process.chdir(originalCwd)
    }
  })

  test('should work with non-interactive mode + dry-run', async () => {
    const outputDir = join(tempDir, 'output-non-interactive')
    const originalCwd = process.cwd()

    try {
      process.chdir(tempDir)

      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.map((a) => String(a)).join(' '))
        originalLog(...args)
      }

      await createCommand({
        base: 'test-base',
        name: 'test-project',
        single: true,
        output: outputDir,
        dryRun: true,
      })

      console.log = originalLog

      // Verify no files were created
      const outputExists = existsSync(outputDir)
      if (outputExists) {
        throw new Error('Output directory should not exist in dry-run mode')
      }

      // Verify plan was shown
      const output = logs.join('\n')
      if (!output.includes('Generation Plan (Dry Run)')) {
        throw new Error('Plan should be shown')
      }
    } finally {
      process.chdir(originalCwd)
    }
  })
})

import { strictEqual } from 'node:assert'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { validateCommand } from '../../commands/validate'

describe('E2E: Validate command', () => {
  let tempDir: string
  let templatesDir: string

  test.beforeEach(async () => {
    tempDir = join(tmpdir(), `validate-command-test-${Date.now()}`)
    templatesDir = join(tempDir, 'templates')
    await mkdir(templatesDir, { recursive: true })
    await mkdir(join(templatesDir, 'bases'), { recursive: true })
    await mkdir(join(templatesDir, 'addons'), { recursive: true })
  })

  test.afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('should validate valid templates successfully', async () => {
    // Create a valid base template
    const baseDir = join(templatesDir, 'bases', 'valid-base')
    await mkdir(baseDir, { recursive: true })
    await mkdir(join(baseDir, 'template'), { recursive: true })

    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'valid-base',
        type: 'base',
        name: 'Valid Base',
        description: 'A valid base template',
        projectType: 'single',
        capabilities: ['typescript'],
        ops: [
          {
            type: 'copy',
            from: 'template/**',
            to: '.',
          },
        ],
      })
    )

    await writeFile(join(baseDir, 'template', 'test.txt'), 'test')

    // Create a valid addon
    const addonDir = join(templatesDir, 'addons', 'valid-addon')
    await mkdir(addonDir, { recursive: true })
    await mkdir(join(addonDir, 'template'), { recursive: true })

    await writeFile(
      join(addonDir, 'manifest.json'),
      JSON.stringify({
        id: 'valid-addon',
        type: 'addon',
        name: 'Valid Addon',
        description: 'A valid addon',
        requires: ['typescript'],
        provides: ['testing'],
        ops: [
          {
            type: 'copy',
            from: 'template/**',
            to: '.',
          },
        ],
      })
    )

    await writeFile(join(addonDir, 'template', 'test.config.ts'), 'test')

    const originalCwd = process.cwd()
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalExit = process.exit
    let exitCode: number | undefined

    process.exit = ((code?: number) => {
      exitCode = code
    }) as typeof process.exit

    console.log = () => {}
    console.error = () => {}
    console.warn = () => {}

    try {
      process.chdir(tempDir)

      await validateCommand({})

      // Should exit with code 0 for valid templates
      strictEqual(exitCode, 0)
    } finally {
      process.chdir(originalCwd)
      process.exit = originalExit
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })

  test('should detect invalid manifest structure', async () => {
    // Create an invalid base template (missing required fields)
    const baseDir = join(templatesDir, 'bases', 'invalid-base')
    await mkdir(baseDir, { recursive: true })

    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'invalid-base',
        // Missing type, name, etc.
      })
    )

    const originalCwd = process.cwd()
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalExit = process.exit
    let exitCode: number | undefined

    process.exit = ((code?: number) => {
      exitCode = code
    }) as typeof process.exit

    console.log = () => {}
    console.error = () => {}
    console.warn = () => {}

    try {
      process.chdir(tempDir)

      await validateCommand({})

      // Should exit with code 1 for invalid templates
      strictEqual(exitCode, 1)
    } finally {
      process.chdir(originalCwd)
      process.exit = originalExit
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })

  test('should detect missing template files referenced in ops', async () => {
    // Create a base with ops referencing non-existent files
    const baseDir = join(templatesDir, 'bases', 'missing-files-base')
    await mkdir(baseDir, { recursive: true })

    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'missing-files-base',
        type: 'base',
        name: 'Missing Files Base',
        description: 'Base with missing files',
        projectType: 'single',
        capabilities: ['typescript'],
        ops: [
          {
            type: 'copy',
            from: 'template/non-existent/**',
            to: '.',
          },
        ],
      })
    )

    const originalCwd = process.cwd()
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalExit = process.exit
    let exitCode: number | undefined

    process.exit = ((code?: number) => {
      exitCode = code
    }) as typeof process.exit

    console.log = () => {}
    console.error = () => {}
    console.warn = () => {}

    try {
      process.chdir(tempDir)

      await validateCommand({})

      // Should exit with code 1 for invalid templates
      strictEqual(exitCode, 1)
    } finally {
      process.chdir(originalCwd)
      process.exit = originalExit
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })

  test('should output JSON format when --json flag is used', async () => {
    // Create a valid template
    const baseDir = join(templatesDir, 'bases', 'json-test-base')
    await mkdir(baseDir, { recursive: true })
    await mkdir(join(baseDir, 'template'), { recursive: true })

    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'json-test-base',
        type: 'base',
        name: 'JSON Test Base',
        description: 'A test base',
        projectType: 'single',
        capabilities: ['typescript'],
        ops: [
          {
            type: 'copy',
            from: 'template/**',
            to: '.',
          },
        ],
      })
    )

    await writeFile(join(baseDir, 'template', 'test.txt'), 'test')

    const originalCwd = process.cwd()
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalExit = process.exit
    let exitCode: number | undefined
    let logOutput = ''

    process.exit = ((code?: number) => {
      exitCode = code
    }) as typeof process.exit

    console.log = ((...args: unknown[]) => {
      logOutput += args.map(String).join(' ')
    }) as typeof console.log
    console.error = () => {}
    console.warn = () => {}

    try {
      process.chdir(tempDir)

      await validateCommand({ json: true })

      // Should output JSON
      strictEqual(logOutput.includes('"isValid"'), true)
      strictEqual(logOutput.includes('"templatesValidated"'), true)
      strictEqual(exitCode, 0)
    } finally {
      process.chdir(originalCwd)
      process.exit = originalExit
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })
})

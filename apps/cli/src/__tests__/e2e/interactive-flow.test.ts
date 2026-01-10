import { strictEqual } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, mock, test } from 'node:test'
import * as clackPrompts from '@clack/prompts'
import { createCommand } from '../../commands/create.js'

describe('E2E: Interactive flow', () => {
  let tempDir: string
  let templatesDir: string
  let outputDir: string

  // Mock clack prompts
  const mockSelect = mock.fn()
  const mockMultiselect = mock.fn()
  const mockText = mock.fn()
  const mockConfirm = mock.fn()
  const mockIntro = mock.fn()
  const mockOutro = mock.fn()
  const mockSpinner = mock.fn(() => ({
    start: mock.fn(),
    stop: mock.fn(),
  }))

  test.beforeEach(async () => {
    tempDir = join(tmpdir(), `interactive-flow-test-${Date.now()}`)
    templatesDir = join(tempDir, 'templates')
    outputDir = join(tempDir, 'output-project')
    await mkdir(templatesDir, { recursive: true })
    await mkdir(join(templatesDir, 'bases'), { recursive: true })
    await mkdir(join(templatesDir, 'addons'), { recursive: true })

    // Create a base template
    const baseDir = join(templatesDir, 'bases', 'test-base')
    await mkdir(baseDir, { recursive: true })
    await mkdir(join(baseDir, 'template'), { recursive: true })
    await mkdir(join(baseDir, 'template', 'src'), { recursive: true })

    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'A test base template',
        projectType: 'single',
        capabilities: ['web-server', 'typescript'],
        prompts: [
          {
            id: 'appName',
            type: 'text',
            label: 'Application name',
            required: true,
            default: 'my-app',
          },
        ],
        ops: [
          {
            type: 'copy',
            from: 'template/**',
            to: '.',
          },
          {
            type: 'templateRender',
            files: ['package.json'],
          },
        ],
      })
    )

    // Create template files
    await writeFile(
      join(baseDir, 'template', 'package.json'),
      JSON.stringify({
        name: '{{appName}}',
        version: '1.0.0',
        type: 'module',
      })
    )
    await writeFile(
      join(baseDir, 'template', 'src', 'index.ts'),
      'console.log("Hello from {{appName}}")'
    )
    await writeFile(
      join(baseDir, 'template', 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
        },
      })
    )

    // Create an addon template
    const addonDir = join(templatesDir, 'addons', 'test-addon')
    await mkdir(addonDir, { recursive: true })
    await mkdir(join(addonDir, 'template'), { recursive: true })

    await writeFile(
      join(addonDir, 'manifest.json'),
      JSON.stringify({
        id: 'test-addon',
        type: 'addon',
        name: 'Test Addon',
        description: 'A test addon',
        requires: ['web-server'],
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

    await writeFile(
      join(addonDir, 'template', 'test.config.ts'),
      'export const testConfig = { enabled: true }'
    )

    // Setup mocks
    mock.method(clackPrompts, 'select', mockSelect)
    mock.method(clackPrompts, 'multiselect', mockMultiselect)
    mock.method(clackPrompts, 'text', mockText)
    mock.method(clackPrompts, 'confirm', mockConfirm)
    mock.method(clackPrompts, 'intro', mockIntro)
    mock.method(clackPrompts, 'outro', mockOutro)
    mock.method(clackPrompts, 'spinner', mockSpinner)

    // Reset mocks
    mockSelect.mock.resetCalls()
    mockMultiselect.mock.resetCalls()
    mockText.mock.resetCalls()
    mockConfirm.mock.resetCalls()
    mockIntro.mock.resetCalls()
    mockOutro.mock.resetCalls()
    mockSpinner.mock.resetCalls()
  })

  test.afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('should complete full interactive flow from selection to generation', async () => {
    // Mock interactive responses
    // 1. Select base template
    mockSelect.mock.mockImplementationOnce(
      () => Promise.resolve('test-base') as any
    )

    // 2. Select addons (user selects test-addon)
    mockMultiselect.mock.mockImplementationOnce(
      () => Promise.resolve(['test-addon']) as any
    )

    // 3. Enter project name
    mockText.mock.mockImplementationOnce((({
      message,
    }: {
      message: string
    }) => {
      if (message === 'Project name:') {
        return Promise.resolve('my-test-project')
      }
      return Promise.resolve('')
    }) as any)

    // 4. Enter application name (from base prompts)
    mockText.mock.mockImplementationOnce((({
      message,
    }: {
      message: string
    }) => {
      if (message === 'Application name') {
        return Promise.resolve('my-app')
      }
      return Promise.resolve('')
    }) as any)

    const originalCwd = process.cwd()
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    console.log = () => {}
    console.error = () => {}
    console.warn = () => {}

    try {
      process.chdir(tempDir)

      await createCommand({
        output: outputDir,
        // No base or name provided, so it will be interactive
      })

      // Verify intro was called
      strictEqual(mockIntro.mock.calls.length > 0, true)

      // Verify base was selected
      strictEqual(mockSelect.mock.calls.length > 0, true)

      // Verify project structure was created
      strictEqual(existsSync(outputDir), true)
      strictEqual(existsSync(join(outputDir, 'package.json')), true)
      strictEqual(existsSync(join(outputDir, 'src', 'index.ts')), true)
      strictEqual(existsSync(join(outputDir, 'tsconfig.json')), true)

      // Verify addon was applied
      strictEqual(existsSync(join(outputDir, 'test.config.ts')), true)

      // Verify template rendering worked
      const packageJson = JSON.parse(
        readFileSync(join(outputDir, 'package.json'), 'utf-8')
      )
      strictEqual(packageJson.name, 'my-app')

      // Verify source file was rendered
      const indexContent = readFileSync(
        join(outputDir, 'src', 'index.ts'),
        'utf-8'
      )
      strictEqual(indexContent.includes('my-app'), true)
    } finally {
      process.chdir(originalCwd)
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })

  test('should handle interactive flow with no addons selected', async () => {
    // Mock interactive responses
    mockSelect.mock.mockImplementationOnce(
      () => Promise.resolve('test-base') as any
    )
    mockMultiselect.mock.mockImplementationOnce(
      () => Promise.resolve([]) as any
    )

    mockText.mock.mockImplementationOnce((({
      message,
    }: {
      message: string
    }) => {
      if (message === 'Project name:') {
        return Promise.resolve('my-test-project')
      }
      return Promise.resolve('')
    }) as any)

    mockText.mock.mockImplementationOnce((({
      message,
    }: {
      message: string
    }) => {
      if (message === 'Application name') {
        return Promise.resolve('my-app')
      }
      return Promise.resolve('')
    }) as any)

    const originalCwd = process.cwd()
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    console.log = () => {}
    console.error = () => {}
    console.warn = () => {}

    try {
      process.chdir(tempDir)

      await createCommand({
        output: outputDir,
      })

      // Verify project was created
      strictEqual(existsSync(outputDir), true)
      strictEqual(existsSync(join(outputDir, 'package.json')), true)

      // Verify addon was NOT applied
      strictEqual(existsSync(join(outputDir, 'test.config.ts')), false)
    } finally {
      process.chdir(originalCwd)
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })

  test('should validate project name in interactive flow', async () => {
    // Mock interactive responses with invalid name first, then valid
    mockSelect.mock.mockImplementationOnce(
      () => Promise.resolve('test-base') as any
    )
    mockMultiselect.mock.mockImplementationOnce(
      () => Promise.resolve([]) as any
    )

    let callCount = 0
    mockText.mock.mockImplementation(({ message, validate }: any): any => {
      if (message === 'Project name:') {
        callCount++
        if (callCount === 1) {
          // First call returns invalid name, should trigger validation
          const validation = validate?.('invalid name with spaces')
          if (validation) {
            // Validation failed, return empty to simulate retry
            return Promise.resolve('')
          }
          return Promise.resolve('invalid name with spaces')
        }
        // Second call with valid name
        return Promise.resolve('valid-project-name')
      }
      if (message === 'Application name') {
        return Promise.resolve('my-app')
      }
      return Promise.resolve('')
    })

    const originalCwd = process.cwd()
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    console.log = () => {}
    console.error = () => {}
    console.warn = () => {}

    try {
      process.chdir(tempDir)

      await createCommand({
        output: outputDir,
      })

      // Verify project was created with valid name
      strictEqual(existsSync(outputDir), true)
    } finally {
      process.chdir(originalCwd)
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })
})

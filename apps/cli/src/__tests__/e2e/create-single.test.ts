import { strictEqual } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { createCommand } from '../../commands/create'

describe('E2E: Create single package', () => {
  let tempDir: string
  let templatesDir: string
  let outputDir: string

  test.beforeEach(async () => {
    tempDir = join(tmpdir(), `create-single-test-${Date.now()}`)
    templatesDir = join(tempDir, 'templates')
    outputDir = join(tempDir, 'output-single')
    await mkdir(templatesDir, { recursive: true })
    await mkdir(join(templatesDir, 'bases'), { recursive: true })
    await mkdir(join(templatesDir, 'addons'), { recursive: true })

    // Create a single package base template
    const baseDir = join(templatesDir, 'bases', 'single-base')
    await mkdir(baseDir, { recursive: true })
    await mkdir(join(baseDir, 'template'), { recursive: true })
    await mkdir(join(baseDir, 'template', 'src'), { recursive: true })

    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'single-base',
        type: 'base',
        name: 'Single Package Base',
        description: 'A single package base template',
        projectType: 'single',
        capabilities: ['typescript'],
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
            files: ['package.json', 'src/index.ts'],
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
        scripts: {
          start: 'node src/index.js',
          build: 'tsc',
        },
        devDependencies: {
          typescript: '^5.0.0',
        },
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
          module: 'ESNext',
          moduleResolution: 'node',
          outDir: './dist',
          rootDir: './src',
        },
      })
    )

    await writeFile(
      join(baseDir, 'template', '.gitignore'),
      'node_modules/\ndist/\n'
    )
  })

  test.afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('should generate single package project with all required files', async () => {
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
        base: 'single-base',
        name: 'test-single-project',
        output: outputDir,
        variables: {
          appName: 'test-app',
        },
      })

      // Verify project structure
      strictEqual(existsSync(outputDir), true)
      strictEqual(existsSync(join(outputDir, 'package.json')), true)
      strictEqual(existsSync(join(outputDir, 'src', 'index.ts')), true)
      strictEqual(existsSync(join(outputDir, 'tsconfig.json')), true)
      strictEqual(existsSync(join(outputDir, '.gitignore')), true)

      // Verify package.json content
      const packageJson = JSON.parse(
        readFileSync(join(outputDir, 'package.json'), 'utf-8')
      )
      strictEqual(packageJson.name, 'test-app')
      strictEqual(packageJson.version, '1.0.0')
      strictEqual(typeof packageJson.scripts, 'object')
      strictEqual(typeof packageJson.scripts.start, 'string')
      strictEqual(typeof packageJson.scripts.build, 'string')

      // Verify template rendering
      const indexContent = readFileSync(
        join(outputDir, 'src', 'index.ts'),
        'utf-8'
      )
      strictEqual(indexContent.includes('test-app'), true)

      // Verify tsconfig.json
      const tsconfig = JSON.parse(
        readFileSync(join(outputDir, 'tsconfig.json'), 'utf-8')
      )
      strictEqual(tsconfig.compilerOptions.target, 'ES2022')
    } finally {
      process.chdir(originalCwd)
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })

  test('should not generate monorepo files for single package', async () => {
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
        base: 'single-base',
        name: 'test-single-project',
        output: outputDir,
        variables: {
          appName: 'test-app',
        },
      })

      // Verify monorepo structure was NOT created
      strictEqual(existsSync(join(outputDir, 'apps')), false)
      strictEqual(existsSync(join(outputDir, 'packages')), false)
      strictEqual(existsSync(join(outputDir, 'turbo.json')), false)
      strictEqual(existsSync(join(outputDir, 'pnpm-workspace.yaml')), false)
    } finally {
      process.chdir(originalCwd)
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })
})

import { strictEqual } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { createCommand } from '../../commands/create'

describe('E2E: Create project with addons', () => {
  let tempDir: string
  let templatesDir: string
  let outputDir: string

  test.beforeEach(async () => {
    tempDir = join(tmpdir(), `create-with-addons-test-${Date.now()}`)
    templatesDir = join(tempDir, 'templates')
    outputDir = join(tempDir, 'output-with-addons')
    await mkdir(templatesDir, { recursive: true })
    await mkdir(join(templatesDir, 'bases'), { recursive: true })
    await mkdir(join(templatesDir, 'addons'), { recursive: true })

    // Create a base template with web-server capability
    const baseDir = join(templatesDir, 'bases', 'web-base')
    await mkdir(baseDir, { recursive: true })
    await mkdir(join(baseDir, 'template'), { recursive: true })
    await mkdir(join(baseDir, 'template', 'src'), { recursive: true })

    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'web-base',
        type: 'base',
        name: 'Web Base',
        description: 'A web server base template',
        projectType: 'single',
        capabilities: ['web-server', 'typescript'],
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
      join(baseDir, 'template', 'package.json'),
      JSON.stringify({
        name: 'web-app',
        version: '1.0.0',
        type: 'module',
        dependencies: {},
      })
    )

    await writeFile(
      join(baseDir, 'template', 'src', 'index.ts'),
      'console.log("Web server")'
    )

    // Create addon-auth
    const authAddonDir = join(templatesDir, 'addons', 'addon-auth')
    await mkdir(authAddonDir, { recursive: true })
    await mkdir(join(authAddonDir, 'template'), { recursive: true })
    await mkdir(join(authAddonDir, 'template', 'src', 'auth'), {
      recursive: true,
    })

    await writeFile(
      join(authAddonDir, 'manifest.json'),
      JSON.stringify({
        id: 'addon-auth',
        type: 'addon',
        name: 'Auth Addon',
        description: 'Authentication addon',
        requires: ['web-server'],
        provides: ['auth'],
        ops: [
          {
            type: 'copy',
            from: 'template/**',
            to: '.',
          },
          {
            type: 'jsonMerge',
            file: 'package.json',
            data: {
              dependencies: {
                '@hono/jwt': '^1.0.0',
              },
            },
          },
        ],
      })
    )

    await writeFile(
      join(authAddonDir, 'template', 'src', 'auth', 'middleware.ts'),
      'export const authMiddleware = () => {}'
    )

    // Create addon-docker
    const dockerAddonDir = join(templatesDir, 'addons', 'addon-docker')
    await mkdir(dockerAddonDir, { recursive: true })
    await mkdir(join(dockerAddonDir, 'template'), { recursive: true })

    await writeFile(
      join(dockerAddonDir, 'manifest.json'),
      JSON.stringify({
        id: 'addon-docker',
        type: 'addon',
        name: 'Docker Addon',
        description: 'Docker configuration addon',
        requires: [],
        provides: ['docker'],
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
      join(dockerAddonDir, 'template', 'Dockerfile'),
      'FROM node:20\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["npm", "start"]'
    )

    await writeFile(
      join(dockerAddonDir, 'template', 'docker-compose.yml'),
      'version: "3"\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"'
    )
  })

  test.afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('should generate project with single addon', async () => {
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
        base: 'web-base',
        addons: ['addon-auth'],
        name: 'test-with-auth',
        output: outputDir,
      })

      // Verify base files
      strictEqual(existsSync(join(outputDir, 'package.json')), true)
      strictEqual(existsSync(join(outputDir, 'src', 'index.ts')), true)

      // Verify addon files were applied
      strictEqual(
        existsSync(join(outputDir, 'src', 'auth', 'middleware.ts')),
        true
      )

      // Verify jsonMerge worked
      const packageJson = JSON.parse(
        readFileSync(join(outputDir, 'package.json'), 'utf-8')
      )
      strictEqual(typeof packageJson.dependencies['@hono/jwt'], 'string')
    } finally {
      process.chdir(originalCwd)
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })

  test('should generate project with multiple addons', async () => {
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
        base: 'web-base',
        addons: ['addon-auth', 'addon-docker'],
        name: 'test-with-multiple-addons',
        output: outputDir,
      })

      // Verify base files
      strictEqual(existsSync(join(outputDir, 'package.json')), true)

      // Verify auth addon
      strictEqual(
        existsSync(join(outputDir, 'src', 'auth', 'middleware.ts')),
        true
      )

      // Verify docker addon
      strictEqual(existsSync(join(outputDir, 'Dockerfile')), true)
      strictEqual(existsSync(join(outputDir, 'docker-compose.yml')), true)

      // Verify jsonMerge from auth addon
      const packageJson = JSON.parse(
        readFileSync(join(outputDir, 'package.json'), 'utf-8')
      )
      strictEqual(typeof packageJson.dependencies['@hono/jwt'], 'string')
    } finally {
      process.chdir(originalCwd)
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })

  test('should handle addon with no requirements', async () => {
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
        base: 'web-base',
        addons: ['addon-docker'],
        name: 'test-docker-only',
        output: outputDir,
      })

      // Verify docker files were added
      strictEqual(existsSync(join(outputDir, 'Dockerfile')), true)
      strictEqual(existsSync(join(outputDir, 'docker-compose.yml')), true)
    } finally {
      process.chdir(originalCwd)
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })
})

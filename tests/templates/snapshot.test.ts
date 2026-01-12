import { strictEqual } from 'node:assert'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { describe, test } from 'node:test'
import { createCommand } from '../../apps/cli/src/commands/create'

// Helper to get directory structure recursively
function _getDirectoryStructure(
  dir: string,
  baseDir: string = dir
): Record<string, string | Record<string, unknown>> {
  const structure: Record<string, string | Record<string, unknown>> = {}
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const relPath = relative(baseDir, fullPath)

    // Skip node_modules, .git, dist, etc.
    if (
      entry.name === 'node_modules' ||
      entry.name === '.git' ||
      entry.name === 'dist' ||
      entry.name === '.turbo' ||
      entry.name.startsWith('.')
    ) {
      continue
    }

    if (entry.isDirectory()) {
      structure[relPath] = _getDirectoryStructure(fullPath, baseDir)
    } else {
      // For files, store a hash or size indicator
      const stats = statSync(fullPath)
      structure[relPath] = `file:${stats.size}bytes`
    }
  }

  return structure
}

// Helper to get file content for key files
function getKeyFilesContent(dir: string): Record<string, string> {
  const keyFiles = [
    'package.json',
    'tsconfig.json',
    'turbo.json',
    'pnpm-workspace.yaml',
    'biome.json',
    'commitlint.config.ts',
    '.lefthook.yml',
    'src/index.ts',
    'README.md',
  ]

  const content: Record<string, string> = {}

  for (const file of keyFiles) {
    const filePath = join(dir, file)
    if (existsSync(filePath)) {
      try {
        content[file] = readFileSync(filePath, 'utf-8')
      } catch {
        // Skip if can't read
      }
    }
  }

  return content
}

describe('Template Snapshot Tests', () => {
  const projectRoot = process.cwd()
  let tempDir: string
  let outputDir: string

  test.beforeEach(async () => {
    tempDir = join(tmpdir(), `snapshot-test-${Date.now()}`)
    outputDir = join(tempDir, 'output')
    await mkdir(outputDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('base-minimal-node: should generate consistent structure', async () => {
    const originalCwd = process.cwd()
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    console.log = () => {}
    console.error = () => {}
    console.warn = () => {}

    try {
      process.chdir(projectRoot)

      const testOutputDir = join(outputDir, 'minimal-node')
      await createCommand({
        base: 'base-minimal-node',
        name: 'test-minimal',
        output: testOutputDir,
        vars: {},
      })

      // Verify structure exists
      strictEqual(existsSync(testOutputDir), true)
      strictEqual(existsSync(join(testOutputDir, 'package.json')), true)
      strictEqual(existsSync(join(testOutputDir, 'tsconfig.json')), true)
      strictEqual(existsSync(join(testOutputDir, 'src', 'index.ts')), true)

      // Get key files
      const keyFiles = getKeyFilesContent(testOutputDir)

      // Verify key files exist
      strictEqual('package.json' in keyFiles, true)
      strictEqual('tsconfig.json' in keyFiles, true)
      strictEqual('src/index.ts' in keyFiles, true)

      // Verify package.json structure
      const packageJson = JSON.parse(keyFiles['package.json'])
      strictEqual(typeof packageJson.name, 'string')
      strictEqual(typeof packageJson.version, 'string')
      strictEqual(typeof packageJson.type, 'string')

      // Verify it's a single package (no monorepo files)
      strictEqual(existsSync(join(testOutputDir, 'turbo.json')), false)
      strictEqual(existsSync(join(testOutputDir, 'apps')), false)
    } finally {
      process.chdir(originalCwd)
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })

  test('base-monorepo-turbo: should generate monorepo structure', async () => {
    const originalCwd = process.cwd()
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    console.log = () => {}
    console.error = () => {}
    console.warn = () => {}

    try {
      process.chdir(projectRoot)

      const testOutputDir = join(outputDir, 'monorepo-turbo')
      await createCommand({
        base: 'base-monorepo-turbo',
        name: 'test-monorepo',
        output: testOutputDir,
        vars: {},
      })

      // Verify monorepo structure
      strictEqual(existsSync(testOutputDir), true)
      strictEqual(existsSync(join(testOutputDir, 'turbo.json')), true)
      strictEqual(existsSync(join(testOutputDir, 'pnpm-workspace.yaml')), true)
      strictEqual(existsSync(join(testOutputDir, 'apps')), true)
      strictEqual(existsSync(join(testOutputDir, 'packages')), true)

      // Get key files
      const keyFiles = getKeyFilesContent(testOutputDir)

      // Verify turbo.json exists
      strictEqual('turbo.json' in keyFiles, true)
      const turboJson = JSON.parse(keyFiles['turbo.json'])
      strictEqual(typeof turboJson, 'object')

      // Verify pnpm-workspace.yaml exists
      strictEqual('pnpm-workspace.yaml' in keyFiles, true)

      // Verify quality standards
      strictEqual(existsSync(join(testOutputDir, 'biome.json')), true)
      strictEqual(existsSync(join(testOutputDir, 'commitlint.config.ts')), true)
    } finally {
      process.chdir(originalCwd)
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })

  test('base-hono-drizzle: should generate web server structure', async () => {
    const originalCwd = process.cwd()
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    console.log = () => {}
    console.error = () => {}
    console.warn = () => {}

    try {
      process.chdir(projectRoot)

      const testOutputDir = join(outputDir, 'hono-drizzle')
      await createCommand({
        base: 'base-hono-drizzle',
        name: 'test-hono',
        output: testOutputDir,
        vars: {
          dbUrl: 'file:./db.sqlite',
          port: '3000',
        },
      })

      // Verify structure
      strictEqual(existsSync(testOutputDir), true)
      strictEqual(existsSync(join(testOutputDir, 'package.json')), true)
      strictEqual(existsSync(join(testOutputDir, 'src', 'index.ts')), true)

      // Get key files
      const keyFiles = getKeyFilesContent(testOutputDir)

      // Verify package.json has Hono and Drizzle dependencies
      const packageJson = JSON.parse(keyFiles['package.json'])
      strictEqual(typeof packageJson.dependencies, 'object')
      // Should have hono and drizzle dependencies
      const deps = packageJson.dependencies || {}
      const hasHono = Object.keys(deps).some((k) => k.includes('hono'))
      const hasDrizzle = Object.keys(deps).some((k) => k.includes('drizzle'))

      // At least one should be present (depending on template)
      strictEqual(hasHono || hasDrizzle, true)

      // Verify database config exists
      strictEqual(existsSync(join(testOutputDir, 'drizzle.config.ts')), true)
    } finally {
      process.chdir(originalCwd)
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })

  test('base-minimal-node + addon-docker: should combine correctly', async () => {
    const originalCwd = process.cwd()
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    console.log = () => {}
    console.error = () => {}
    console.warn = () => {}

    try {
      process.chdir(projectRoot)

      const testOutputDir = join(outputDir, 'minimal-docker')
      await createCommand({
        base: 'base-minimal-node',
        addons: ['addon-docker'],
        name: 'test-docker',
        output: testOutputDir,
        vars: {},
      })

      // Verify base structure
      strictEqual(existsSync(join(testOutputDir, 'package.json')), true)

      // Verify addon files
      strictEqual(existsSync(join(testOutputDir, 'Dockerfile')), true)
      strictEqual(existsSync(join(testOutputDir, 'docker-compose.yml')), true)
    } finally {
      process.chdir(originalCwd)
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  })
})

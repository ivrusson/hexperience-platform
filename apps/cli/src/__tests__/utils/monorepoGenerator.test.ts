import { strictEqual } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import {
  generateMonorepoFiles,
  generateMonorepoStructure,
  generateMonorepoTsConfig,
  generatePnpmWorkspace,
  generateTurboJson,
} from '../../utils/monorepoGenerator.js'

describe('monorepoGenerator', () => {
  let tempDir: string

  test.beforeEach(async () => {
    tempDir = join(tmpdir(), `monorepo-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('generateMonorepoStructure', () => {
    test('should create apps/ and packages/ directories', async () => {
      await generateMonorepoStructure(tempDir)

      strictEqual(existsSync(join(tempDir, 'apps')), true)
      strictEqual(existsSync(join(tempDir, 'packages')), true)
    })
  })

  describe('generateTurboJson', () => {
    test('should generate turbo.json with correct structure', async () => {
      await generateTurboJson(tempDir)

      const turboJsonPath = join(tempDir, 'turbo.json')
      strictEqual(existsSync(turboJsonPath), true)

      const content = readFileSync(turboJsonPath, 'utf-8')
      const turboJson = JSON.parse(content)

      strictEqual(turboJson.$schema, 'https://turborepo.com/schema.json')
      strictEqual(typeof turboJson.tasks, 'object')
      strictEqual(typeof turboJson.tasks.build, 'object')
      strictEqual(Array.isArray(turboJson.tasks.build.dependsOn), true)
      strictEqual(Array.isArray(turboJson.tasks.build.outputs), true)
    })

    test('should include all standard tasks', async () => {
      await generateTurboJson(tempDir)

      const content = readFileSync(join(tempDir, 'turbo.json'), 'utf-8')
      const turboJson = JSON.parse(content)

      const expectedTasks = [
        'build',
        'dev',
        'lint',
        'format',
        'type-check',
        'test',
        'clean',
      ]
      for (const task of expectedTasks) {
        if (!(task in turboJson.tasks)) {
          throw new Error(`Task "${task}" should be in turbo.json`)
        }
      }
    })
  })

  describe('generatePnpmWorkspace', () => {
    test('should generate pnpm-workspace.yaml with correct structure', async () => {
      await generatePnpmWorkspace(tempDir)

      const workspacePath = join(tempDir, 'pnpm-workspace.yaml')
      strictEqual(existsSync(workspacePath), true)

      const content = readFileSync(workspacePath, 'utf-8')
      if (!content.includes('packages:')) {
        throw new Error('pnpm-workspace.yaml should contain "packages:"')
      }
      if (!content.includes("'apps/*'")) {
        throw new Error('pnpm-workspace.yaml should include apps/*')
      }
      if (!content.includes("'packages/*'")) {
        throw new Error('pnpm-workspace.yaml should include packages/*')
      }
    })
  })

  describe('generateMonorepoTsConfig', () => {
    test('should generate tsconfig.json with project references', async () => {
      await generateMonorepoTsConfig(tempDir)

      const tsconfigPath = join(tempDir, 'tsconfig.json')
      strictEqual(existsSync(tsconfigPath), true)

      const content = readFileSync(tsconfigPath, 'utf-8')
      const tsconfig = JSON.parse(content)

      strictEqual(typeof tsconfig.compilerOptions, 'object')
      strictEqual(Array.isArray(tsconfig.references), true)
      strictEqual(Array.isArray(tsconfig.files), true)
    })

    test('should include standard compiler options', async () => {
      await generateMonorepoTsConfig(tempDir)

      const content = readFileSync(join(tempDir, 'tsconfig.json'), 'utf-8')
      const tsconfig = JSON.parse(content)

      const requiredOptions = [
        'target',
        'module',
        'moduleResolution',
        'strict',
        'esModuleInterop',
        'skipLibCheck',
      ]
      for (const option of requiredOptions) {
        if (!(option in tsconfig.compilerOptions)) {
          throw new Error(
            `Compiler option "${option}" should be in tsconfig.json`
          )
        }
      }
    })
  })

  describe('generateMonorepoFiles', () => {
    test('should generate all monorepo files', async () => {
      await generateMonorepoFiles(tempDir)

      // Check structure
      strictEqual(existsSync(join(tempDir, 'apps')), true)
      strictEqual(existsSync(join(tempDir, 'packages')), true)

      // Check files
      strictEqual(existsSync(join(tempDir, 'turbo.json')), true)
      strictEqual(existsSync(join(tempDir, 'pnpm-workspace.yaml')), true)
      strictEqual(existsSync(join(tempDir, 'tsconfig.json')), true)
    })

    test('should generate valid JSON files', async () => {
      await generateMonorepoFiles(tempDir)

      // Verify turbo.json is valid JSON
      const turboContent = readFileSync(join(tempDir, 'turbo.json'), 'utf-8')
      JSON.parse(turboContent)

      // Verify tsconfig.json is valid JSON
      const tsconfigContent = readFileSync(
        join(tempDir, 'tsconfig.json'),
        'utf-8'
      )
      JSON.parse(tsconfigContent)
    })
  })
})

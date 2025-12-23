import { strictEqual } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import {
  generatePackageJsonScripts,
  generateQualityStandards,
  generateReadme,
} from '../../utils/qualityStandardsGenerator.js'

describe('qualityStandardsGenerator', () => {
  let tempDir: string

  test.beforeEach(async () => {
    tempDir = join(tmpdir(), `quality-standards-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('generatePackageJsonScripts', () => {
    test('should create new package.json with scripts', async () => {
      await generatePackageJsonScripts(tempDir, 'test-project')

      const packageJsonPath = join(tempDir, 'package.json')
      strictEqual(existsSync(packageJsonPath), true)

      const content = readFileSync(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)

      strictEqual(packageJson.name, 'test-project')
      strictEqual(typeof packageJson.scripts, 'object')
      strictEqual(packageJson.scripts.lint, 'biome check .')
      strictEqual(packageJson.scripts.format, 'biome format --write .')
      strictEqual(packageJson.scripts['type-check'], 'tsc --noEmit')
      strictEqual(
        packageJson.scripts.check,
        'pnpm lint && pnpm format && pnpm type-check'
      )
    })

    test('should update existing package.json with scripts', async () => {
      const existingPackageJson = {
        name: 'existing-project',
        version: '1.0.0',
        scripts: {
          dev: 'node index.js',
        },
      }
      await writeFile(
        join(tempDir, 'package.json'),
        JSON.stringify(existingPackageJson, null, 2)
      )

      await generatePackageJsonScripts(tempDir)

      const content = readFileSync(join(tempDir, 'package.json'), 'utf-8')
      const packageJson = JSON.parse(content)

      // Should preserve existing fields
      strictEqual(packageJson.name, 'existing-project')
      strictEqual(packageJson.version, '1.0.0')
      strictEqual(packageJson.scripts.dev, 'node index.js')

      // Should add quality scripts
      strictEqual(packageJson.scripts.lint, 'biome check .')
      strictEqual(packageJson.scripts.format, 'biome format --write .')
      strictEqual(packageJson.scripts['type-check'], 'tsc --noEmit')
      strictEqual(
        packageJson.scripts.check,
        'pnpm lint && pnpm format && pnpm type-check'
      )
    })

    test('should merge scripts without overwriting existing ones', async () => {
      const existingPackageJson = {
        name: 'test-project',
        scripts: {
          lint: 'eslint .',
          dev: 'node index.js',
        },
      }
      await writeFile(
        join(tempDir, 'package.json'),
        JSON.stringify(existingPackageJson, null, 2)
      )

      await generatePackageJsonScripts(tempDir)

      const content = readFileSync(join(tempDir, 'package.json'), 'utf-8')
      const packageJson = JSON.parse(content)

      // Quality scripts should overwrite existing lint
      strictEqual(packageJson.scripts.lint, 'biome check .')
      // Other scripts should be preserved
      strictEqual(packageJson.scripts.dev, 'node index.js')
    })
  })

  describe('generateReadme', () => {
    test('should generate README.md with project name', async () => {
      await generateReadme(tempDir, 'my-awesome-project')

      const readmePath = join(tempDir, 'README.md')
      strictEqual(existsSync(readmePath), true)

      const content = readFileSync(readmePath, 'utf-8')
      if (!content.includes('# my-awesome-project')) {
        throw new Error('README should include project name as title')
      }
    })

    test('should include quality standards section', async () => {
      await generateReadme(tempDir, 'test-project')

      const content = readFileSync(join(tempDir, 'README.md'), 'utf-8')
      if (!content.includes('Quality Standards')) {
        throw new Error('README should include Quality Standards section')
      }
      if (!content.includes('LeftHook')) {
        throw new Error('README should mention LeftHook')
      }
      if (!content.includes('commit-lint')) {
        throw new Error('README should mention commit-lint')
      }
      if (!content.includes('Biome')) {
        throw new Error('README should mention Biome')
      }
    })

    test('should include scripts section', async () => {
      await generateReadme(tempDir, 'test-project')

      const content = readFileSync(join(tempDir, 'README.md'), 'utf-8')
      if (!content.includes('## Scripts')) {
        throw new Error('README should include Scripts section')
      }
      if (!content.includes('pnpm lint')) {
        throw new Error('README should mention lint script')
      }
      if (!content.includes('pnpm format')) {
        throw new Error('README should mention format script')
      }
      if (!content.includes('pnpm type-check')) {
        throw new Error('README should mention type-check script')
      }
    })

    test('should include next steps section', async () => {
      await generateReadme(tempDir, 'test-project')

      const content = readFileSync(join(tempDir, 'README.md'), 'utf-8')
      if (!content.includes('## Next Steps')) {
        throw new Error('README should include Next Steps section')
      }
    })
  })

  describe('generateQualityStandards', () => {
    test('should generate all quality standards files', async () => {
      await generateQualityStandards(tempDir, 'test-project')

      // Check all standard files
      strictEqual(existsSync(join(tempDir, '.lefthook.yml')), true)
      strictEqual(existsSync(join(tempDir, 'commitlint.config.ts')), true)
      strictEqual(existsSync(join(tempDir, 'biome.json')), true)
      strictEqual(existsSync(join(tempDir, '.gitignore')), true)
      strictEqual(existsSync(join(tempDir, 'package.json')), true)
      strictEqual(existsSync(join(tempDir, 'README.md')), true)
    })

    test('should generate package.json and README with project name', async () => {
      await generateQualityStandards(tempDir, 'my-project')

      const packageJsonContent = readFileSync(
        join(tempDir, 'package.json'),
        'utf-8'
      )
      const packageJson = JSON.parse(packageJsonContent)
      strictEqual(packageJson.name, 'my-project')

      const readmeContent = readFileSync(join(tempDir, 'README.md'), 'utf-8')
      if (!readmeContent.includes('# my-project')) {
        throw new Error('README should include project name')
      }
    })

    test('should work without project name', async () => {
      await generateQualityStandards(tempDir)

      // Should still generate all files except README
      strictEqual(existsSync(join(tempDir, '.lefthook.yml')), true)
      strictEqual(existsSync(join(tempDir, 'commitlint.config.ts')), true)
      strictEqual(existsSync(join(tempDir, 'biome.json')), true)
      strictEqual(existsSync(join(tempDir, '.gitignore')), true)
      strictEqual(existsSync(join(tempDir, 'package.json')), true)
      // README should not be generated without project name
      strictEqual(existsSync(join(tempDir, 'README.md')), false)
    })
  })
})

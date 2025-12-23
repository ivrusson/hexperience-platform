import { rejects, strictEqual } from 'node:assert'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { loadConfig, mergeConfig } from '../utils/configLoader.js'

describe('configLoader', () => {
  let tempDir: string

  test.beforeEach(async () => {
    tempDir = join(tmpdir(), `config-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('loadConfig', () => {
    test('should load valid JSON config file', async () => {
      const configPath = join(tempDir, 'config.json')
      const config = {
        base: 'test-base',
        addons: ['addon1', 'addon2'],
        name: 'test-project',
        monorepo: true,
        output: './output',
        variables: {
          db: 'postgres',
        },
      }
      await writeFile(configPath, JSON.stringify(config, null, 2))

      const loaded = loadConfig(configPath)
      strictEqual(loaded.base, 'test-base')
      strictEqual(loaded.addons?.length, 2)
      strictEqual(loaded.name, 'test-project')
      strictEqual(loaded.monorepo, true)
      strictEqual(loaded.output, './output')
      strictEqual(loaded.variables?.db, 'postgres')
    })

    test('should throw error for invalid JSON', async () => {
      const configPath = join(tempDir, 'invalid.json')
      await writeFile(configPath, '{ invalid json }')

      await rejects(
        async () => {
          loadConfig(configPath)
        },
        {
          message: /Invalid JSON/,
        }
      )
    })

    test('should throw error for non-existent file', async () => {
      const configPath = join(tempDir, 'nonexistent.json')

      await rejects(
        async () => {
          loadConfig(configPath)
        },
        {
          message: /Config file not found/,
        }
      )
    })

    test('should validate config structure', async () => {
      const configPath = join(tempDir, 'invalid-structure.json')
      await writeFile(configPath, JSON.stringify({ base: 123 }))

      await rejects(
        async () => {
          loadConfig(configPath)
        },
        {
          message: /Config validation failed/,
        }
      )
    })

    test('should load valid YAML config file', async () => {
      const configPath = join(tempDir, 'config.yaml')
      const yamlContent = `base: test-base
addons:
  - addon1
  - addon2
name: test-project
monorepo: true
output: ./output
variables:
  db: postgres
`
      await writeFile(configPath, yamlContent)

      const loaded = loadConfig(configPath)
      strictEqual(loaded.base, 'test-base')
      strictEqual(loaded.addons?.length, 2)
      strictEqual(loaded.name, 'test-project')
      strictEqual(loaded.monorepo, true)
      strictEqual(loaded.output, './output')
      strictEqual(loaded.variables?.db, 'postgres')
    })

    test('should load valid YAML config file with .yml extension', async () => {
      const configPath = join(tempDir, 'config.yml')
      const yamlContent = `base: test-base
name: test-project
`
      await writeFile(configPath, yamlContent)

      const loaded = loadConfig(configPath)
      strictEqual(loaded.base, 'test-base')
      strictEqual(loaded.name, 'test-project')
    })

    test('should validate YAML config structure', async () => {
      const configPath = join(tempDir, 'invalid-structure.yaml')
      await writeFile(configPath, 'base: 123\nname: test')

      await rejects(
        async () => {
          loadConfig(configPath)
        },
        {
          message: /Config validation failed/,
        }
      )
    })

    test('should throw error for invalid YAML', async () => {
      const configPath = join(tempDir, 'invalid.yaml')
      await writeFile(configPath, 'base: test\n  invalid: indentation')

      await rejects(
        async () => {
          loadConfig(configPath)
        },
        {
          message: /Invalid YAML/,
        }
      )
    })

    test('should auto-detect YAML format by content', async () => {
      const configPath = join(tempDir, 'config.txt')
      const yamlContent = `---
base: test-base
name: test-project
`
      await writeFile(configPath, yamlContent)

      const loaded = loadConfig(configPath)
      strictEqual(loaded.base, 'test-base')
      strictEqual(loaded.name, 'test-project')
    })

    test('should auto-detect JSON format by content', async () => {
      const configPath = join(tempDir, 'config.txt')
      const jsonContent = JSON.stringify({
        base: 'test-base',
        name: 'test-project',
      })
      await writeFile(configPath, jsonContent)

      const loaded = loadConfig(configPath)
      strictEqual(loaded.base, 'test-base')
      strictEqual(loaded.name, 'test-project')
    })
  })

  describe('mergeConfig', () => {
    test('should merge config with CLI options, CLI takes precedence', () => {
      const config = {
        base: 'config-base',
        addons: ['config-addon'],
        name: 'config-name',
        monorepo: true,
        output: './config-output',
        variables: { db: 'config-db' },
      }

      const cliOptions = {
        base: 'cli-base',
        addons: ['cli-addon'],
        name: 'cli-name',
        single: true,
        output: './cli-output',
        config: 'config.json',
      }

      const merged = mergeConfig(cliOptions, config)

      strictEqual(merged.base, 'cli-base')
      strictEqual(merged.addons?.[0], 'cli-addon')
      strictEqual(merged.name, 'cli-name')
      strictEqual(merged.single, true)
      strictEqual(merged.output, './cli-output')
      strictEqual(merged.variables?.db, 'config-db')
    })

    test('should use config values when CLI options are missing', () => {
      const config = {
        base: 'config-base',
        name: 'config-name',
        monorepo: true,
      }

      const cliOptions = {}

      const merged = mergeConfig(cliOptions, config)

      strictEqual(merged.base, 'config-base')
      strictEqual(merged.name, 'config-name')
      strictEqual(merged.monorepo, true)
    })

    test('should work without config file', () => {
      const cliOptions = {
        base: 'cli-base',
        name: 'cli-name',
      }

      const merged = mergeConfig(cliOptions)

      strictEqual(merged.base, 'cli-base')
      strictEqual(merged.name, 'cli-name')
    })
  })
})

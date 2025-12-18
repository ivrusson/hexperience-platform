import { ok, rejects, strictEqual } from 'node:assert'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import {
  ManifestNotFoundError,
  ManifestParseError,
  ManifestValidationError,
} from '../errors.js'
import { ManifestLoader } from '../loader.js'

describe('ManifestLoader', () => {
  let testDir: string

  test.beforeEach(async () => {
    testDir = join(tmpdir(), `catalog-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  describe('load', () => {
    test('should load a valid base template manifest', async () => {
      const manifestPath = join(testDir, 'manifest.json')
      const manifest = {
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'A test base template',
        capabilities: ['web-server', 'typescript'],
      }

      await writeFile(manifestPath, JSON.stringify(manifest, null, 2))

      const result = await ManifestLoader.load(manifestPath)

      strictEqual(result.type, 'base')
      strictEqual(result.id, 'test-base')
      strictEqual(result.name, 'Test Base')
      ok(Array.isArray(result.capabilities))
      strictEqual(result.capabilities.length, 2)
    })

    test('should load a valid addon template manifest', async () => {
      const manifestPath = join(testDir, 'manifest.json')
      const manifest = {
        id: 'test-addon',
        type: 'addon',
        name: 'Test Addon',
        description: 'A test addon template',
        requires: ['web-server'],
        provides: ['auth'],
      }

      await writeFile(manifestPath, JSON.stringify(manifest, null, 2))

      const result = await ManifestLoader.load(manifestPath)

      strictEqual(result.type, 'addon')
      strictEqual(result.id, 'test-addon')
      ok(Array.isArray(result.requires))
      ok(Array.isArray(result.provides))
    })

    test('should throw ManifestNotFoundError for non-existent file', async () => {
      const manifestPath = join(testDir, 'nonexistent.json')

      await rejects(
        () => ManifestLoader.load(manifestPath),
        (error) => {
          return (
            error instanceof ManifestNotFoundError &&
            error.path === manifestPath
          )
        }
      )
    })

    test('should throw ManifestParseError for invalid JSON', async () => {
      const manifestPath = join(testDir, 'manifest.json')
      await writeFile(manifestPath, '{ invalid json }')

      await rejects(
        () => ManifestLoader.load(manifestPath),
        (error) => {
          return (
            error instanceof ManifestParseError && error.path === manifestPath
          )
        }
      )
    })

    test('should throw ManifestValidationError for missing required fields', async () => {
      const manifestPath = join(testDir, 'manifest.json')
      const manifest = {
        id: 'test',
        // Missing type, name, description
      }

      await writeFile(manifestPath, JSON.stringify(manifest))

      await rejects(
        () => ManifestLoader.load(manifestPath),
        (error) => {
          return (
            error instanceof ManifestValidationError &&
            error.path === manifestPath &&
            Object.keys(error.fieldErrors).length > 0
          )
        }
      )
    })

    test('should throw ManifestValidationError for invalid ID format', async () => {
      const manifestPath = join(testDir, 'manifest.json')
      const manifest = {
        id: 'Invalid_ID_Format',
        type: 'base',
        name: 'Test',
        description: 'Test',
        capabilities: ['test'],
      }

      await writeFile(manifestPath, JSON.stringify(manifest))

      await rejects(
        () => ManifestLoader.load(manifestPath),
        (error) => {
          return (
            error instanceof ManifestValidationError &&
            error.fieldErrors.id !== undefined
          )
        }
      )
    })

    test('should throw ManifestValidationError for base without capabilities', async () => {
      const manifestPath = join(testDir, 'manifest.json')
      const manifest = {
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'A test base template',
        capabilities: [],
      }

      await writeFile(manifestPath, JSON.stringify(manifest))

      await rejects(
        () => ManifestLoader.load(manifestPath),
        (error) => {
          return (
            error instanceof ManifestValidationError &&
            error.fieldErrors.capabilities !== undefined
          )
        }
      )
    })

    test('should throw ManifestValidationError for addon without requires/provides/conflicts', async () => {
      const manifestPath = join(testDir, 'manifest.json')
      const manifest = {
        id: 'test-addon',
        type: 'addon',
        name: 'Test Addon',
        description: 'A test addon template',
      }

      await writeFile(manifestPath, JSON.stringify(manifest))

      await rejects(
        () => ManifestLoader.load(manifestPath),
        (error) => {
          return error instanceof ManifestValidationError
        }
      )
    })

    test('should accept addon with only conflicts', async () => {
      const manifestPath = join(testDir, 'manifest.json')
      const manifest = {
        id: 'test-addon',
        type: 'addon',
        name: 'Test Addon',
        description: 'A test addon template',
        conflicts: ['other-addon'],
      }

      await writeFile(manifestPath, JSON.stringify(manifest))

      const result = await ManifestLoader.load(manifestPath)

      strictEqual(result.type, 'addon')
      ok(Array.isArray(result.conflicts))
      strictEqual(result.conflicts?.length, 1)
    })

    test('should load manifest with optional fields', async () => {
      const manifestPath = join(testDir, 'manifest.json')
      const manifest = {
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'A test base template',
        capabilities: ['web-server'],
        projectType: 'monorepo',
        prompts: [
          {
            id: 'projectName',
            label: 'Project Name',
            type: 'text',
            required: true,
          },
        ],
      }

      await writeFile(manifestPath, JSON.stringify(manifest))

      const result = await ManifestLoader.load(manifestPath)

      strictEqual(result.projectType, 'monorepo')
      ok(Array.isArray(result.prompts))
      strictEqual(result.prompts?.length, 1)
    })
  })
})

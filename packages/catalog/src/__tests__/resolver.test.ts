import { ok, strictEqual } from 'node:assert'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { CatalogResolver } from '../resolver.js'

describe('CatalogResolver', () => {
  let testDir: string
  let basesDir: string
  let addonsDir: string

  test.beforeEach(async () => {
    testDir = join(tmpdir(), `catalog-resolver-test-${Date.now()}`)
    basesDir = join(testDir, 'templates', 'bases')
    addonsDir = join(testDir, 'templates', 'addons')

    await mkdir(basesDir, { recursive: true })
    await mkdir(addonsDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  describe('scanTemplates', () => {
    test('should scan empty directories', async () => {
      const result = await CatalogResolver.scanTemplates(testDir)

      strictEqual(result.bases.length, 0)
      strictEqual(result.addons.length, 0)
      strictEqual(result.errors.length, 0)
    })

    test('should find and load base templates', async () => {
      const base1Dir = join(basesDir, 'base-1')
      await mkdir(base1Dir, { recursive: true })

      const manifest1 = {
        id: 'base-1',
        type: 'base',
        name: 'Base 1',
        description: 'First base template',
        capabilities: ['web-server'],
      }

      await writeFile(
        join(base1Dir, 'manifest.json'),
        JSON.stringify(manifest1)
      )

      const result = await CatalogResolver.scanTemplates(testDir)

      strictEqual(result.bases.length, 1)
      strictEqual(result.bases[0].id, 'base-1')
      strictEqual(result.addons.length, 0)
    })

    test('should find and load addon templates', async () => {
      const addon1Dir = join(addonsDir, 'addon-1')
      await mkdir(addon1Dir, { recursive: true })

      const manifest1 = {
        id: 'addon-1',
        type: 'addon',
        name: 'Addon 1',
        description: 'First addon template',
        requires: ['web-server'],
      }

      await writeFile(
        join(addon1Dir, 'manifest.json'),
        JSON.stringify(manifest1)
      )

      const result = await CatalogResolver.scanTemplates(testDir)

      strictEqual(result.addons.length, 1)
      strictEqual(result.addons[0].id, 'addon-1')
      strictEqual(result.bases.length, 0)
    })

    test('should find templates in nested directories', async () => {
      const nestedBaseDir = join(basesDir, 'category', 'nested-base')
      await mkdir(nestedBaseDir, { recursive: true })

      const manifest = {
        id: 'nested-base',
        type: 'base',
        name: 'Nested Base',
        description: 'Nested base template',
        capabilities: ['typescript'],
      }

      await writeFile(
        join(nestedBaseDir, 'manifest.json'),
        JSON.stringify(manifest)
      )

      const result = await CatalogResolver.scanTemplates(testDir)

      strictEqual(result.bases.length, 1)
      strictEqual(result.bases[0].id, 'nested-base')
    })

    test('should handle invalid manifests gracefully', async () => {
      const base1Dir = join(basesDir, 'invalid-base')
      await mkdir(base1Dir, { recursive: true })

      // Invalid manifest (missing required fields)
      await writeFile(
        join(base1Dir, 'manifest.json'),
        JSON.stringify({ id: 'invalid' })
      )

      const validBaseDir = join(basesDir, 'valid-base')
      await mkdir(validBaseDir, { recursive: true })

      const validManifest = {
        id: 'valid-base',
        type: 'base',
        name: 'Valid Base',
        description: 'Valid base template',
        capabilities: ['web-server'],
      }

      await writeFile(
        join(validBaseDir, 'manifest.json'),
        JSON.stringify(validManifest)
      )

      const result = await CatalogResolver.scanTemplates(testDir)

      // Should still load the valid one
      strictEqual(result.bases.length, 1)
      strictEqual(result.bases[0].id, 'valid-base')
      // Should have error for invalid one
      strictEqual(result.errors.length, 1)
      ok(result.errors[0].path.includes('invalid-base'))
    })

    test('should continue scanning even if one template fails', async () => {
      const base1Dir = join(basesDir, 'base-1')
      await mkdir(base1Dir, { recursive: true })

      // Invalid JSON
      await writeFile(join(base1Dir, 'manifest.json'), '{ invalid json }')

      const base2Dir = join(basesDir, 'base-2')
      await mkdir(base2Dir, { recursive: true })

      const validManifest = {
        id: 'base-2',
        type: 'base',
        name: 'Base 2',
        description: 'Second base template',
        capabilities: ['typescript'],
      }

      await writeFile(
        join(base2Dir, 'manifest.json'),
        JSON.stringify(validManifest)
      )

      const result = await CatalogResolver.scanTemplates(testDir)

      strictEqual(result.bases.length, 1)
      strictEqual(result.bases[0].id, 'base-2')
      strictEqual(result.errors.length, 1)
    })

    test('should handle missing directories gracefully', async () => {
      await rm(basesDir, { recursive: true, force: true })

      const result = await CatalogResolver.scanTemplates(testDir)

      strictEqual(result.bases.length, 0)
      strictEqual(result.addons.length, 0)
      // Should have error for missing bases directory
      ok(result.errors.length > 0)
    })

    test('should find multiple templates', async () => {
      // Create multiple bases
      for (let i = 1; i <= 3; i++) {
        const baseDir = join(basesDir, `base-${i}`)
        await mkdir(baseDir, { recursive: true })

        const manifest = {
          id: `base-${i}`,
          type: 'base',
          name: `Base ${i}`,
          description: `Base template ${i}`,
          capabilities: [`capability-${i}`],
        }

        await writeFile(
          join(baseDir, 'manifest.json'),
          JSON.stringify(manifest)
        )
      }

      // Create multiple addons
      for (let i = 1; i <= 2; i++) {
        const addonDir = join(addonsDir, `addon-${i}`)
        await mkdir(addonDir, { recursive: true })

        const manifest = {
          id: `addon-${i}`,
          type: 'addon',
          name: `Addon ${i}`,
          description: `Addon template ${i}`,
          requires: [`capability-${i}`],
        }

        await writeFile(
          join(addonDir, 'manifest.json'),
          JSON.stringify(manifest)
        )
      }

      const result = await CatalogResolver.scanTemplates(testDir)

      strictEqual(result.bases.length, 3)
      strictEqual(result.addons.length, 2)
    })
  })
})

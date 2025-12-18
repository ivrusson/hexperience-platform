import { ok, strictEqual } from 'node:assert'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { Catalog } from '../catalog.js'

describe('Catalog', () => {
  let testDir: string
  let basesDir: string
  let addonsDir: string

  test.beforeEach(async () => {
    testDir = join(tmpdir(), `catalog-test-${Date.now()}`)
    basesDir = join(testDir, 'templates', 'bases')
    addonsDir = join(testDir, 'templates', 'addons')

    await mkdir(basesDir, { recursive: true })
    await mkdir(addonsDir, { recursive: true })
  })

  test.afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  describe('getBases', () => {
    test('should return all base templates', async () => {
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

      const catalog = new Catalog(testDir)
      const bases = await catalog.getBases()

      strictEqual(bases.length, 1)
      strictEqual(bases[0].id, 'base-1')
    })

    test('should return empty array when no bases exist', async () => {
      const catalog = new Catalog(testDir)
      const bases = await catalog.getBases()

      strictEqual(bases.length, 0)
    })
  })

  describe('getAddons', () => {
    test('should return all addon templates', async () => {
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

      const catalog = new Catalog(testDir)
      const addons = await catalog.getAddons()

      strictEqual(addons.length, 1)
      strictEqual(addons[0].id, 'addon-1')
    })

    test('should return empty array when no addons exist', async () => {
      const catalog = new Catalog(testDir)
      const addons = await catalog.getAddons()

      strictEqual(addons.length, 0)
    })
  })

  describe('getTemplateById', () => {
    test('should find base template by ID', async () => {
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

      const catalog = new Catalog(testDir)
      const template = await catalog.getTemplateById('base-1')

      ok(template !== null)
      strictEqual(template?.id, 'base-1')
      strictEqual(template?.type, 'base')
    })

    test('should find addon template by ID', async () => {
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

      const catalog = new Catalog(testDir)
      const template = await catalog.getTemplateById('addon-1')

      ok(template !== null)
      strictEqual(template?.id, 'addon-1')
      strictEqual(template?.type, 'addon')
    })

    test('should return null for non-existent template', async () => {
      const catalog = new Catalog(testDir)
      const template = await catalog.getTemplateById('nonexistent')

      strictEqual(template, null)
    })
  })

  describe('cache', () => {
    test('should cache results after first call', async () => {
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

      const catalog = new Catalog(testDir)

      // First call
      const bases1 = await catalog.getBases()
      strictEqual(bases1.length, 1)

      // Remove the manifest file
      await rm(join(base1Dir, 'manifest.json'), { force: true })

      // Second call should use cache
      const bases2 = await catalog.getBases()
      strictEqual(bases2.length, 1) // Still cached
    })

    test('should refresh cache when refresh() is called', async () => {
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

      const catalog = new Catalog(testDir)

      // First call
      const bases1 = await catalog.getBases()
      strictEqual(bases1.length, 1)

      // Remove the manifest file
      await rm(join(base1Dir, 'manifest.json'), { force: true })

      // Refresh cache
      await catalog.refresh()

      // Should now return empty
      const bases2 = await catalog.getBases()
      strictEqual(bases2.length, 0)
    })
  })

  describe('getErrors', () => {
    test('should return errors from scan', async () => {
      const invalidBaseDir = join(basesDir, 'invalid-base')
      await mkdir(invalidBaseDir, { recursive: true })

      // Invalid manifest
      await writeFile(
        join(invalidBaseDir, 'manifest.json'),
        JSON.stringify({ id: 'invalid' })
      )

      const catalog = new Catalog(testDir)
      const errors = await catalog.getErrors()

      ok(errors.length > 0)
      ok(errors.some((e) => e.path.includes('invalid-base')))
    })
  })
})

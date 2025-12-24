import { ok, strictEqual } from 'node:assert'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import type { AddonTemplate, BaseTemplate } from '@hexp/catalog'
import { Catalog } from '@hexp/catalog'
import { validateGenerationPlan } from '../utils/validation.js'

describe('validation integration', () => {
  let tempDir: string
  let templatesDir: string

  test.beforeEach(async () => {
    const tempPrefix = join(tmpdir(), `hexp-validation-test-${Date.now()}`)
    tempDir = await mkdir(tempPrefix, {
      recursive: true,
    })
    templatesDir = join(tempDir, 'templates')
    await mkdir(join(templatesDir, 'bases'), { recursive: true })
    await mkdir(join(templatesDir, 'addons'), { recursive: true })
  })

  test.afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('should validate compatible base and addons', async () => {
    // Create base template
    const baseDir = join(templatesDir, 'bases', 'test-base')
    await mkdir(baseDir, { recursive: true })
    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'Test base',
        capabilities: ['web-server', 'orm'],
      })
    )

    // Create addon template
    const addonDir = join(templatesDir, 'addons', 'test-addon')
    await mkdir(addonDir, { recursive: true })
    await writeFile(
      join(addonDir, 'manifest.json'),
      JSON.stringify({
        id: 'test-addon',
        type: 'addon',
        name: 'Test Addon',
        description: 'Test addon',
        requires: ['web-server'],
      })
    )

    const catalog = new Catalog(tempDir)
    const bases = await catalog.getBases()
    const addons = await catalog.getAddons()

    const base = bases.find((b: BaseTemplate) => b.id === 'test-base')
    const addon = addons.find((a: AddonTemplate) => a.id === 'test-addon')

    ok(base)
    ok(addon)

    const result = validateGenerationPlan(
      base,
      [addon],
      base.ops || [],
      [{ addon, ops: addon.ops || [] }]
    )

    strictEqual(result.isValid, true)
    strictEqual(result.compatibility.isCompatible, true)
    strictEqual(result.conflicts.hasConflicts, false)
    strictEqual(result.dependencies.hasCycles, false)
  })

  test('should detect incompatible addons', async () => {
    // Create base template
    const baseDir = join(templatesDir, 'bases', 'test-base')
    await mkdir(baseDir, { recursive: true })
    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'Test base',
        capabilities: ['web-server'],
      })
    )

    // Create addon that requires capability not provided by base
    const addonDir = join(templatesDir, 'addons', 'test-addon')
    await mkdir(addonDir, { recursive: true })
    await writeFile(
      join(addonDir, 'manifest.json'),
      JSON.stringify({
        id: 'test-addon',
        type: 'addon',
        name: 'Test Addon',
        description: 'Test addon',
        requires: ['orm'], // Not provided by base
      })
    )

    const catalog = new Catalog(tempDir)
    const bases = await catalog.getBases()
    const addons = await catalog.getAddons()

    const base = bases.find((b: BaseTemplate) => b.id === 'test-base')
    const addon = addons.find((a: AddonTemplate) => a.id === 'test-addon')

    ok(base)
    ok(addon)

    const result = validateGenerationPlan(
      base,
      [addon],
      base.ops || [],
      [{ addon, ops: addon.ops || [] }]
    )

    strictEqual(result.isValid, false)
    strictEqual(result.compatibility.isCompatible, false)
    strictEqual(result.errors.length, 1)
    ok(result.errors[0].includes('test-addon'))
    ok(result.errors[0].includes('orm'))
  })

  test('should detect conflicts between addons', async () => {
    // Create base template
    const baseDir = join(templatesDir, 'bases', 'test-base')
    await mkdir(baseDir, { recursive: true })
    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'Test base',
        capabilities: ['web-server'],
      })
    )

    // Create conflicting addons
    const addon1Dir = join(templatesDir, 'addons', 'addon-1')
    await mkdir(addon1Dir, { recursive: true })
    await writeFile(
      join(addon1Dir, 'manifest.json'),
      JSON.stringify({
        id: 'addon-1',
        type: 'addon',
        name: 'Addon 1',
        description: 'Test addon',
        conflicts: ['addon-2'],
      })
    )

    const addon2Dir = join(templatesDir, 'addons', 'addon-2')
    await mkdir(addon2Dir, { recursive: true })
    await writeFile(
      join(addon2Dir, 'manifest.json'),
      JSON.stringify({
        id: 'addon-2',
        type: 'addon',
        name: 'Addon 2',
        description: 'Test addon',
      })
    )

    const catalog = new Catalog(tempDir)
    const bases = await catalog.getBases()
    const addons = await catalog.getAddons()

    const base = bases.find((b: BaseTemplate) => b.id === 'test-base')
    const addon1 = addons.find((a: AddonTemplate) => a.id === 'addon-1')
    const addon2 = addons.find((a: AddonTemplate) => a.id === 'addon-2')

    ok(base)
    ok(addon1)
    ok(addon2)

    const result = validateGenerationPlan(
      base,
      [addon1, addon2],
      base.ops || [],
      [
        { addon: addon1, ops: addon1.ops || [] },
        { addon: addon2, ops: addon2.ops || [] },
      ]
    )

    strictEqual(result.isValid, false)
    strictEqual(result.conflicts.hasConflicts, true)
    strictEqual(result.errors.length, 1)
    ok(result.errors[0].includes('addon-1'))
    ok(result.errors[0].includes('addon-2'))
  })

  test('should resolve addon order based on dependencies', async () => {
    // Create base template
    const baseDir = join(templatesDir, 'bases', 'test-base')
    await mkdir(baseDir, { recursive: true })
    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'Test base',
        capabilities: ['base-cap'],
      })
    )

    // Create addons with dependencies
    const addonADir = join(templatesDir, 'addons', 'addon-a')
    await mkdir(addonADir, { recursive: true })
    await writeFile(
      join(addonADir, 'manifest.json'),
      JSON.stringify({
        id: 'addon-a',
        type: 'addon',
        name: 'Addon A',
        description: 'Test addon',
        requires: ['base-cap'],
        provides: ['cap-a'],
      })
    )

    const addonBDir = join(templatesDir, 'addons', 'addon-b')
    await mkdir(addonBDir, { recursive: true })
    await writeFile(
      join(addonBDir, 'manifest.json'),
      JSON.stringify({
        id: 'addon-b',
        type: 'addon',
        name: 'Addon B',
        description: 'Test addon',
        requires: ['cap-a'], // Depends on addon-a
        provides: ['cap-b'],
      })
    )

    const catalog = new Catalog(tempDir)
    const bases = await catalog.getBases()
    const addons = await catalog.getAddons()

    const base = bases.find((b: BaseTemplate) => b.id === 'test-base')
    const addonA = addons.find((a: AddonTemplate) => a.id === 'addon-a')
    const addonB = addons.find((a: AddonTemplate) => a.id === 'addon-b')

    ok(base)
    ok(addonA)
    ok(addonB)

    // Pass addons in wrong order
    const result = validateGenerationPlan(
      base,
      [addonB, addonA], // Wrong order
      base.ops || [],
      [
        { addon: addonB, ops: addonB.ops || [] },
        { addon: addonA, ops: addonA.ops || [] },
      ]
    )

    strictEqual(result.isValid, true)
    strictEqual(result.dependencies.hasCycles, false)
    // Should be reordered: addon-a before addon-b
    const indexA = result.dependencies.orderedAddons.findIndex(
      (a) => a.id === 'addon-a'
    )
    const indexB = result.dependencies.orderedAddons.findIndex(
      (a) => a.id === 'addon-b'
    )
    ok(indexA < indexB)
  })
})

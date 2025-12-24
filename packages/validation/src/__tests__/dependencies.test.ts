import { strictEqual, ok } from 'node:assert'
import { describe, test } from 'node:test'
import type { AddonTemplate } from '@hexp/catalog'
import { DependencyResolver } from '../dependencies.js'

describe('DependencyResolver', () => {
  test('should resolve simple linear order', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-a',
        type: 'addon',
        name: 'Addon A',
        description: 'Test addon',
        requires: ['base-cap'],
        provides: ['cap-a'],
      },
      {
        id: 'addon-b',
        type: 'addon',
        name: 'Addon B',
        description: 'Test addon',
        requires: ['cap-a'],
        provides: ['cap-b'],
      },
      {
        id: 'addon-c',
        type: 'addon',
        name: 'Addon C',
        description: 'Test addon',
        requires: ['cap-b'],
        provides: ['cap-c'],
      },
    ]

    const result = DependencyResolver.resolve(addons, ['base-cap'])

    strictEqual(result.hasCycles, false)
    strictEqual(result.orderedAddons.length, 3)
    strictEqual(result.orderedAddons[0].id, 'addon-a')
    strictEqual(result.orderedAddons[1].id, 'addon-b')
    strictEqual(result.orderedAddons[2].id, 'addon-c')
  })

  test('should handle multiple independent branches', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-a',
        type: 'addon',
        name: 'Addon A',
        description: 'Test addon',
        requires: ['base-cap'],
        provides: ['cap-a'],
      },
      {
        id: 'addon-b',
        type: 'addon',
        name: 'Addon B',
        description: 'Test addon',
        requires: ['base-cap'],
        provides: ['cap-b'],
      },
      {
        id: 'addon-c',
        type: 'addon',
        name: 'Addon C',
        description: 'Test addon',
        requires: ['cap-a'],
      },
    ]

    const result = DependencyResolver.resolve(addons, ['base-cap'])

    strictEqual(result.hasCycles, false)
    strictEqual(result.orderedAddons.length, 3)
    // addon-a and addon-b can be in any order (both depend on base)
    // but addon-c must come after addon-a
    const indexA = result.orderedAddons.findIndex((a) => a.id === 'addon-a')
    const indexC = result.orderedAddons.findIndex((a) => a.id === 'addon-c')
    ok(indexA < indexC)
  })

  test('should handle transitive dependencies', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-a',
        type: 'addon',
        name: 'Addon A',
        description: 'Test addon',
        requires: ['base-cap'],
        provides: ['cap-a'],
      },
      {
        id: 'addon-b',
        type: 'addon',
        name: 'Addon B',
        description: 'Test addon',
        requires: ['cap-a'],
        provides: ['cap-b'],
      },
      {
        id: 'addon-c',
        type: 'addon',
        name: 'Addon C',
        description: 'Test addon',
        requires: ['cap-b'], // Depends on cap-b, which depends on cap-a
      },
    ]

    const result = DependencyResolver.resolve(addons, ['base-cap'])

    strictEqual(result.hasCycles, false)
    const indexA = result.orderedAddons.findIndex((a) => a.id === 'addon-a')
    const indexB = result.orderedAddons.findIndex((a) => a.id === 'addon-b')
    const indexC = result.orderedAddons.findIndex((a) => a.id === 'addon-c')
    ok(indexA < indexB)
    ok(indexB < indexC)
  })

  test('should detect direct cycles', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-a',
        type: 'addon',
        name: 'Addon A',
        description: 'Test addon',
        requires: ['cap-b'],
        provides: ['cap-a'],
      },
      {
        id: 'addon-b',
        type: 'addon',
        name: 'Addon B',
        description: 'Test addon',
        requires: ['cap-a'],
        provides: ['cap-b'],
      },
    ]

    const result = DependencyResolver.resolve(addons, [])

    strictEqual(result.hasCycles, true)
    strictEqual(result.cycles.length, 1)
    ok(result.cycles[0].includes('addon-a'))
    ok(result.cycles[0].includes('addon-b'))
  })

  test('should detect complex cycles', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-a',
        type: 'addon',
        name: 'Addon A',
        description: 'Test addon',
        requires: ['cap-c'],
        provides: ['cap-a'],
      },
      {
        id: 'addon-b',
        type: 'addon',
        name: 'Addon B',
        description: 'Test addon',
        requires: ['cap-a'],
        provides: ['cap-b'],
      },
      {
        id: 'addon-c',
        type: 'addon',
        name: 'Addon C',
        description: 'Test addon',
        requires: ['cap-b'],
        provides: ['cap-c'],
      },
    ]

    const result = DependencyResolver.resolve(addons, [])

    strictEqual(result.hasCycles, true)
    strictEqual(result.cycles.length, 1)
    const cycle = result.cycles[0]
    ok(cycle.includes('addon-a'))
    ok(cycle.includes('addon-b'))
    ok(cycle.includes('addon-c'))
  })

  test('should handle addons without dependencies', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-a',
        type: 'addon',
        name: 'Addon A',
        description: 'Test addon',
        provides: ['cap-a'],
      },
      {
        id: 'addon-b',
        type: 'addon',
        name: 'Addon B',
        description: 'Test addon',
        provides: ['cap-b'],
      },
    ]

    const result = DependencyResolver.resolve(addons, [])

    strictEqual(result.hasCycles, false)
    strictEqual(result.orderedAddons.length, 2)
    // Order can be arbitrary when there are no dependencies
  })

  test('should generate error message for cycles', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-a',
        type: 'addon',
        name: 'Addon A',
        description: 'Test addon',
        requires: ['cap-b'],
        provides: ['cap-a'],
      },
      {
        id: 'addon-b',
        type: 'addon',
        name: 'Addon B',
        description: 'Test addon',
        requires: ['cap-a'],
        provides: ['cap-b'],
      },
    ]

    const result = DependencyResolver.resolve(addons, [])
    const errorMessage = DependencyResolver.getErrorMessage(result)

    ok(errorMessage.includes('Cycle'))
    ok(errorMessage.includes('addon-a') || errorMessage.includes('addon-b'))
  })
})

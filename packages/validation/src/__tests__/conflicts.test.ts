import { strictEqual, ok } from 'node:assert'
import { describe, test } from 'node:test'
import type { AddonTemplate } from '@hexp/catalog'
import { ConflictDetector } from '../conflicts.js'

describe('ConflictDetector', () => {
  test('should return no conflicts when addons are compatible', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-1',
        type: 'addon',
        name: 'Addon 1',
        description: 'Test addon',
        provides: ['auth'],
      },
      {
        id: 'addon-2',
        type: 'addon',
        name: 'Addon 2',
        description: 'Test addon',
        provides: ['docker'],
      },
    ]

    const result = ConflictDetector.check(addons)

    strictEqual(result.hasConflicts, false)
    strictEqual(result.conflicts.length, 0)
  })

  test('should detect direct conflicts', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-1',
        type: 'addon',
        name: 'Addon 1',
        description: 'Test addon',
        conflicts: ['addon-2'],
      },
      {
        id: 'addon-2',
        type: 'addon',
        name: 'Addon 2',
        description: 'Test addon',
      },
    ]

    const result = ConflictDetector.check(addons)

    strictEqual(result.hasConflicts, true)
    strictEqual(result.conflicts.length, 1)
    strictEqual(result.conflicts[0].addon1, 'addon-1')
    strictEqual(result.conflicts[0].addon2, 'addon-2')
  })

  test('should detect bidirectional conflicts', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-1',
        type: 'addon',
        name: 'Addon 1',
        description: 'Test addon',
        conflicts: ['addon-2'],
      },
      {
        id: 'addon-2',
        type: 'addon',
        name: 'Addon 2',
        description: 'Test addon',
        conflicts: ['addon-1'],
      },
    ]

    const result = ConflictDetector.check(addons)

    strictEqual(result.hasConflicts, true)
    // Should detect both directions but avoid duplicates
    ok(result.conflicts.length >= 1)
    ok(
      result.conflicts.some(
        (c) =>
          (c.addon1 === 'addon-1' && c.addon2 === 'addon-2') ||
          (c.addon1 === 'addon-2' && c.addon2 === 'addon-1')
      )
    )
  })

  test('should detect multiple conflicts', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-1',
        type: 'addon',
        name: 'Addon 1',
        description: 'Test addon',
        conflicts: ['addon-2', 'addon-3'],
      },
      {
        id: 'addon-2',
        type: 'addon',
        name: 'Addon 2',
        description: 'Test addon',
      },
      {
        id: 'addon-3',
        type: 'addon',
        name: 'Addon 3',
        description: 'Test addon',
      },
    ]

    const result = ConflictDetector.check(addons)

    strictEqual(result.hasConflicts, true)
    strictEqual(result.conflicts.length, 2)
  })

  test('should suggest alternatives for conflicting addons', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-1',
        type: 'addon',
        name: 'Addon 1',
        description: 'Test addon',
        conflicts: ['addon-2'],
        provides: ['auth'],
      },
      {
        id: 'addon-2',
        type: 'addon',
        name: 'Addon 2',
        description: 'Test addon',
        provides: ['auth'], // Same capability as addon-1
      },
      {
        id: 'addon-3',
        type: 'addon',
        name: 'Addon 3',
        description: 'Alternative addon',
        provides: ['auth'], // Alternative that doesn't conflict with addon-1
      },
    ]

    const result = ConflictDetector.check(addons)

    strictEqual(result.hasConflicts, true)
    const suggestions = result.suggestions.get('addon-2')
    ok(suggestions !== undefined)
    ok(suggestions.includes('addon-3'))
  })

  test('should generate error message correctly', () => {
    const addons: AddonTemplate[] = [
      {
        id: 'addon-1',
        type: 'addon',
        name: 'Addon 1',
        description: 'Test addon',
        conflicts: ['addon-2'],
      },
      {
        id: 'addon-2',
        type: 'addon',
        name: 'Addon 2',
        description: 'Test addon',
      },
    ]

    const result = ConflictDetector.check(addons)
    const errorMessage = ConflictDetector.getErrorMessage(result)

    ok(errorMessage.includes('addon-1'))
    ok(errorMessage.includes('addon-2'))
  })
})

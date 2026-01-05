import { ok, strictEqual } from 'node:assert'
import { describe, test } from 'node:test'
import type { AddonTemplate, BaseTemplate } from '@hexp/catalog'
import { CompatibilityChecker } from '../compatibility.js'

describe('CompatibilityChecker', () => {
  test('should return compatible when base provides all required capabilities', () => {
    const base: BaseTemplate = {
      id: 'test-base',
      type: 'base',
      name: 'Test Base',
      description: 'Test base template',
      capabilities: ['web-server', 'orm', 'typescript'],
    }

    const addons: AddonTemplate[] = [
      {
        id: 'addon-1',
        type: 'addon',
        name: 'Addon 1',
        description: 'Test addon',
        requires: ['web-server'],
      },
      {
        id: 'addon-2',
        type: 'addon',
        name: 'Addon 2',
        description: 'Test addon',
        requires: ['orm'],
      },
    ]

    const result = CompatibilityChecker.check(base, addons)

    strictEqual(result.isCompatible, true)
    strictEqual(result.missingCapabilities.size, 0)
    strictEqual(result.compatibilityMatrix.get('addon-1'), true)
    strictEqual(result.compatibilityMatrix.get('addon-2'), true)
  })

  test('should detect missing capabilities', () => {
    const base: BaseTemplate = {
      id: 'test-base',
      type: 'base',
      name: 'Test Base',
      description: 'Test base template',
      capabilities: ['web-server'],
    }

    const addons: AddonTemplate[] = [
      {
        id: 'addon-1',
        type: 'addon',
        name: 'Addon 1',
        description: 'Test addon',
        requires: ['orm'], // Not provided by base
      },
    ]

    const result = CompatibilityChecker.check(base, addons)

    strictEqual(result.isCompatible, false)
    strictEqual(result.missingCapabilities.size, 1)
    ok(result.missingCapabilities.has('addon-1'))
    strictEqual(result.missingCapabilities.get('addon-1')?.includes('orm'), true)
    strictEqual(result.compatibilityMatrix.get('addon-1'), false)
  })

  test('should consider capabilities provided by other addons', () => {
    const base: BaseTemplate = {
      id: 'test-base',
      type: 'base',
      name: 'Test Base',
      description: 'Test base template',
      capabilities: ['web-server'],
    }

    const addons: AddonTemplate[] = [
      {
        id: 'addon-orm',
        type: 'addon',
        name: 'ORM Addon',
        description: 'Provides ORM',
        requires: ['web-server'],
        provides: ['orm'],
      },
      {
        id: 'addon-auth',
        type: 'addon',
        name: 'Auth Addon',
        description: 'Requires ORM',
        requires: ['orm'], // Provided by addon-orm
      },
    ]

    const result = CompatibilityChecker.check(base, addons)

    strictEqual(result.isCompatible, true)
    strictEqual(result.missingCapabilities.size, 0)
    strictEqual(result.compatibilityMatrix.get('addon-orm'), true)
    strictEqual(result.compatibilityMatrix.get('addon-auth'), true)
    strictEqual(result.allCapabilities.has('orm'), true)
  })

  test('should handle multiple addons with different requirements', () => {
    const base: BaseTemplate = {
      id: 'test-base',
      type: 'base',
      name: 'Test Base',
      description: 'Test base template',
      capabilities: ['web-server', 'typescript'],
    }

    const addons: AddonTemplate[] = [
      {
        id: 'addon-1',
        type: 'addon',
        name: 'Addon 1',
        description: 'Test addon',
        requires: ['web-server'],
      },
      {
        id: 'addon-2',
        type: 'addon',
        name: 'Addon 2',
        description: 'Test addon',
        requires: ['orm'], // Missing
      },
      {
        id: 'addon-3',
        type: 'addon',
        name: 'Addon 3',
        description: 'Test addon',
        requires: ['typescript'],
      },
    ]

    const result = CompatibilityChecker.check(base, addons)

    strictEqual(result.isCompatible, false)
    strictEqual(result.missingCapabilities.size, 1)
    strictEqual(result.compatibilityMatrix.get('addon-1'), true)
    strictEqual(result.compatibilityMatrix.get('addon-2'), false)
    strictEqual(result.compatibilityMatrix.get('addon-3'), true)
  })

  test('should generate error message correctly', () => {
    const base: BaseTemplate = {
      id: 'test-base',
      type: 'base',
      name: 'Test Base',
      description: 'Test base template',
      capabilities: ['web-server'],
    }

    const addons: AddonTemplate[] = [
      {
        id: 'addon-1',
        type: 'addon',
        name: 'Addon 1',
        description: 'Test addon',
        requires: ['orm', 'database'],
      },
    ]

    const result = CompatibilityChecker.check(base, addons)
    const errorMessage = CompatibilityChecker.getErrorMessage(result, base)

    ok(errorMessage.includes('addon-1'))
    ok(errorMessage.includes('orm'))
    ok(errorMessage.includes('database'))
    ok(errorMessage.includes('test-base'))
  })
})

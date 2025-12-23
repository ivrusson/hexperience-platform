import { strictEqual } from 'node:assert'
import { describe, test } from 'node:test'
import type { AddonTemplate, BaseTemplate } from '@hexp/catalog'
import {
  validateCompatibility,
  validateProjectName,
} from '../utils/validators.js'

describe('validators', () => {
  describe('validateProjectName', () => {
    test('should accept valid project names', () => {
      const result = validateProjectName('my-project')
      strictEqual(result.valid, true)
    })

    test('should reject empty names', () => {
      const result = validateProjectName('')
      strictEqual(result.valid, false)
      strictEqual(result.error, 'Project name cannot be empty')
    })

    test('should reject names with uppercase letters', () => {
      const result = validateProjectName('MyProject')
      strictEqual(result.valid, false)
    })

    test('should reject names with special characters', () => {
      const result = validateProjectName('my_project')
      strictEqual(result.valid, false)
    })

    test('should accept names with numbers and hyphens', () => {
      const result = validateProjectName('my-project-123')
      strictEqual(result.valid, true)
    })
  })

  describe('validateCompatibility', () => {
    test('should validate compatible base and addons', () => {
      const base: BaseTemplate = {
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'Test',
        capabilities: ['web-server', 'orm'],
        ops: [],
      }

      const addons: AddonTemplate[] = [
        {
          id: 'test-addon',
          type: 'addon',
          name: 'Test Addon',
          description: 'Test',
          requires: ['web-server'],
          ops: [],
        },
      ]

      const result = validateCompatibility(base, addons)
      strictEqual(result.valid, true)
      strictEqual(result.errors.length, 0)
    })

    test('should reject addons with missing requirements', () => {
      const base: BaseTemplate = {
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'Test',
        capabilities: ['web-server'],
        ops: [],
      }

      const addons: AddonTemplate[] = [
        {
          id: 'test-addon',
          type: 'addon',
          name: 'Test Addon',
          description: 'Test',
          requires: ['web-server', 'orm'],
          ops: [],
        },
      ]

      const result = validateCompatibility(base, addons)
      strictEqual(result.valid, false)
      strictEqual(result.errors.length, 1)
      strictEqual(result.errors[0].includes('orm'), true)
    })

    test('should detect conflicts between addons', () => {
      const base: BaseTemplate = {
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'Test',
        capabilities: ['web-server'],
        ops: [],
      }

      const addons: AddonTemplate[] = [
        {
          id: 'addon1',
          type: 'addon',
          name: 'Addon 1',
          description: 'Test',
          conflicts: ['addon2'],
          ops: [],
        },
        {
          id: 'addon2',
          type: 'addon',
          name: 'Addon 2',
          description: 'Test',
          ops: [],
        },
      ]

      const result = validateCompatibility(base, addons)
      strictEqual(result.valid, false)
      strictEqual(result.errors.length, 1)
      strictEqual(result.errors[0].includes('conflicts'), true)
    })

    test('should accept addons without requirements', () => {
      const base: BaseTemplate = {
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'Test',
        capabilities: [],
        ops: [],
      }

      const addons: AddonTemplate[] = [
        {
          id: 'test-addon',
          type: 'addon',
          name: 'Test Addon',
          description: 'Test',
          ops: [],
        },
      ]

      const result = validateCompatibility(base, addons)
      strictEqual(result.valid, true)
    })
  })
})

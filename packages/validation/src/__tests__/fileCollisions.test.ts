import { strictEqual, ok } from 'node:assert'
import { describe, test } from 'node:test'
import type { Operation } from '@hexp/shared'
import { FileCollisionDetector, type TemplateWithOps } from '../fileCollisions.js'

describe('FileCollisionDetector', () => {
  test('should return no collisions when files are unique', () => {
    const base: TemplateWithOps = {
      templateDir: '/base',
      ops: [
        {
          type: 'copy',
          from: 'file1.txt',
          to: 'file1.txt',
        },
      ],
    }

    const addons: TemplateWithOps[] = [
      {
        templateDir: '/addon1',
        ops: [
          {
            type: 'copy',
            from: 'file2.txt',
            to: 'file2.txt',
          },
        ],
      },
    ]

    const result = FileCollisionDetector.check(base, addons)

    strictEqual(result.hasCollisions, false)
    strictEqual(result.collisions.length, 0)
  })

  test('should detect copy operation collisions', () => {
    const base: TemplateWithOps = {
      templateDir: '/base',
      ops: [
        {
          type: 'copy',
          from: 'file1.txt',
          to: 'same-file.txt',
        },
      ],
    }

    const addons: TemplateWithOps[] = [
      {
        templateDir: '/addon1',
        ops: [
          {
            type: 'copy',
            from: 'file2.txt',
            to: 'same-file.txt', // Same destination
          },
        ],
      },
    ]

    const result = FileCollisionDetector.check(base, addons)

    strictEqual(result.hasCollisions, true)
    strictEqual(result.collisions.length, 1)
    strictEqual(result.collisions[0].file, 'same-file.txt')
    strictEqual(result.collisions[0].operations.length, 2)
  })

  test('should detect templateRender collisions', () => {
    const base: TemplateWithOps = {
      templateDir: '/base',
      ops: [
        {
          type: 'templateRender',
          from: 'template1.txt',
          to: 'output.txt',
        },
      ],
    }

    const addons: TemplateWithOps[] = [
      {
        templateDir: '/addon1',
        ops: [
          {
            type: 'templateRender',
            from: 'template2.txt',
            to: 'output.txt', // Same destination
          },
        ],
      },
    ]

    const result = FileCollisionDetector.check(base, addons)

    strictEqual(result.hasCollisions, true)
    strictEqual(result.collisions.length, 1)
    strictEqual(result.collisions[0].file, 'output.txt')
  })

  test('should allow jsonMerge operations on same target', () => {
    const base: TemplateWithOps = {
      templateDir: '/base',
      ops: [
        {
          type: 'jsonMerge',
          target: 'package.json',
          data: { name: 'test' },
        },
      ],
    }

    const addons: TemplateWithOps[] = [
      {
        templateDir: '/addon1',
        ops: [
          {
            type: 'jsonMerge',
            target: 'package.json', // Same target, but merging is allowed
            data: { version: '1.0.0' },
          },
        ],
      },
    ]

    const result = FileCollisionDetector.check(base, addons)

    strictEqual(result.hasCollisions, false)
    strictEqual(result.collisions.length, 0)
  })

  test('should allow overwrite when explicitly set', () => {
    const base: TemplateWithOps = {
      templateDir: '/base',
      ops: [
        {
          type: 'copy',
          from: 'file1.txt',
          to: 'output.txt',
          overwrite: true,
        },
      ],
    }

    const addons: TemplateWithOps[] = [
      {
        templateDir: '/addon1',
        ops: [
          {
            type: 'copy',
            from: 'file2.txt',
            to: 'output.txt',
            overwrite: true,
          },
        ],
      },
    ]

    const result = FileCollisionDetector.check(base, addons)

    strictEqual(result.hasCollisions, false)
  })

  test('should detect textInsert on file that will be copied', () => {
    const base: TemplateWithOps = {
      templateDir: '/base',
      ops: [
        {
          type: 'textInsert',
          target: 'file.txt',
          marker: '// marker',
          content: 'new content',
        },
      ],
    }

    const addons: TemplateWithOps[] = [
      {
        templateDir: '/addon1',
        ops: [
          {
            type: 'copy',
            from: 'other-file.txt',
            to: 'file.txt', // Will overwrite the file that was modified
          },
        ],
      },
    ]

    const result = FileCollisionDetector.check(base, addons)

    strictEqual(result.hasCollisions, true)
    strictEqual(result.collisions.length, 1)
  })

  test('should track sources correctly', () => {
    const base: TemplateWithOps = {
      templateDir: '/base',
      ops: [
        {
          type: 'copy',
          from: 'file1.txt',
          to: 'collision.txt',
        },
      ],
    }

    const addons: TemplateWithOps[] = [
      {
        templateDir: '/addon1',
        ops: [
          {
            type: 'copy',
            from: 'file2.txt',
            to: 'collision.txt',
          },
        ],
      },
    ]

    const result = FileCollisionDetector.check(base, addons)

    strictEqual(result.collisions[0].sources.length, 2)
    ok(result.collisions[0].sources.includes('/base'))
    ok(result.collisions[0].sources.includes('/addon1'))
  })

  test('should generate error message correctly', () => {
    const base: TemplateWithOps = {
      templateDir: '/base',
      ops: [
        {
          type: 'copy',
          from: 'file1.txt',
          to: 'collision.txt',
        },
      ],
    }

    const addons: TemplateWithOps[] = [
      {
        templateDir: '/addon1',
        ops: [
          {
            type: 'copy',
            from: 'file2.txt',
            to: 'collision.txt',
          },
        ],
      },
    ]

    const result = FileCollisionDetector.check(base, addons)
    const errorMessage = FileCollisionDetector.getErrorMessage(result)

    ok(errorMessage.includes('collision.txt'))
    ok(errorMessage.includes('copy'))
  })
})

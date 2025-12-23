import { ok, rejects, strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import type {
  CopyOperation,
  ExecutionContext,
  JsonMergeOperation,
  TemplateRenderOperation,
  TextInsertOperation,
} from '@hexp/shared'
import { createEngine, Engine } from '../engine.js'
import { OperationError } from '../errors.js'
import { createWorkspace } from '../workspace.js'

describe('Engine', () => {
  let templateDir: string
  let workspaceDir: string
  let context: ExecutionContext

  test.beforeEach(async () => {
    templateDir = join(tmpdir(), `engine-test-template-${Date.now()}`)
    workspaceDir = join(tmpdir(), `engine-test-workspace-${Date.now()}`)

    await mkdir(templateDir, { recursive: true })
    await mkdir(workspaceDir, { recursive: true })

    context = {
      templateRoot: templateDir,
      workspaceRoot: workspaceDir,
      variables: {
        projectName: 'test-project',
        version: '1.0.0',
      },
    }
  })

  test.afterEach(async () => {
    await rm(templateDir, { recursive: true, force: true }).catch(() => {})
    await rm(workspaceDir, { recursive: true, force: true }).catch(() => {})
  })

  describe('applyBase', () => {
    test('should apply base template operations', async () => {
      const sourceFile = join(templateDir, 'base-file.txt')
      await writeFile(sourceFile, 'Base content')

      const workspace = createWorkspace(workspaceDir)
      const engine = createEngine(workspace, context)

      const base = {
        templateDir,
        ops: [
          {
            type: 'copy',
            from: 'base-file.txt',
            to: 'copied-file.txt',
          } as CopyOperation,
        ],
      }

      const results = await engine.applyBase(base)

      strictEqual(results.length, 1)
      strictEqual(results[0].success, true)
      strictEqual(existsSync(join(workspaceDir, 'copied-file.txt')), true)
    })

    test('should apply multiple operations in sequence', async () => {
      const file1 = join(templateDir, 'file1.txt')
      const file2 = join(templateDir, 'file2.txt')
      await writeFile(file1, 'Content 1')
      await writeFile(file2, 'Content 2')

      const workspace = createWorkspace(workspaceDir)
      const engine = createEngine(workspace, context)

      const base = {
        templateDir,
        ops: [
          {
            type: 'copy',
            from: 'file1.txt',
            to: 'copied1.txt',
          } as CopyOperation,
          {
            type: 'copy',
            from: 'file2.txt',
            to: 'copied2.txt',
          } as CopyOperation,
        ],
      }

      const results = await engine.applyBase(base)

      strictEqual(results.length, 2)
      strictEqual(results[0].success, true)
      strictEqual(results[1].success, true)
      strictEqual(existsSync(join(workspaceDir, 'copied1.txt')), true)
      strictEqual(existsSync(join(workspaceDir, 'copied2.txt')), true)
    })

    test('should throw error if operation fails', async () => {
      const workspace = createWorkspace(workspaceDir)
      const engine = createEngine(workspace, context)

      const base = {
        templateDir,
        ops: [
          {
            type: 'copy',
            from: 'nonexistent.txt',
            to: 'dest.txt',
          } as CopyOperation,
        ],
      }

      await rejects(engine.applyBase(base), (error: Error) => {
        ok(error instanceof OperationError)
        ok(error.message.includes('Failed to apply base template operation'))
        return true
      })
    })

    test('should use template root from base context', async () => {
      const baseTemplateDir = join(tmpdir(), `base-template-${Date.now()}`)
      await mkdir(baseTemplateDir, { recursive: true })
      const baseFile = join(baseTemplateDir, 'base.txt')
      await writeFile(baseFile, 'Base content')

      const workspace = createWorkspace(workspaceDir)
      const engine = createEngine(workspace, context)

      const base = {
        templateDir: baseTemplateDir,
        ops: [
          {
            type: 'copy',
            from: 'base.txt',
            to: 'copied.txt',
          } as CopyOperation,
        ],
      }

      await engine.applyBase(base)

      strictEqual(existsSync(join(workspaceDir, 'copied.txt')), true)
      const content = await readFile(join(workspaceDir, 'copied.txt'), 'utf-8')
      strictEqual(content, 'Base content')

      await rm(baseTemplateDir, { recursive: true, force: true }).catch(
        () => {}
      )
    })
  })

  describe('applyAddon', () => {
    test('should apply addon operations', async () => {
      const addonTemplateDir = join(tmpdir(), `addon-template-${Date.now()}`)
      await mkdir(addonTemplateDir, { recursive: true })
      const addonFile = join(addonTemplateDir, 'addon.txt')
      await writeFile(addonFile, 'Addon content')

      const workspace = createWorkspace(workspaceDir)
      const engine = createEngine(workspace, context)

      const addon = {
        templateDir: addonTemplateDir,
        ops: [
          {
            type: 'copy',
            from: 'addon.txt',
            to: 'addon-file.txt',
          } as CopyOperation,
        ],
      }

      const results = await engine.applyAddon(addon)

      strictEqual(results.length, 1)
      strictEqual(results[0].success, true)
      strictEqual(existsSync(join(workspaceDir, 'addon-file.txt')), true)

      await rm(addonTemplateDir, { recursive: true, force: true }).catch(
        () => {}
      )
    })

    test('should apply multiple addon operations', async () => {
      const addonTemplateDir = join(tmpdir(), `addon-template-${Date.now()}`)
      await mkdir(addonTemplateDir, { recursive: true })
      const file1 = join(addonTemplateDir, 'file1.txt')
      const file2 = join(addonTemplateDir, 'file2.txt')
      await writeFile(file1, 'File 1')
      await writeFile(file2, 'File 2')

      const workspace = createWorkspace(workspaceDir)
      const engine = createEngine(workspace, context)

      const addon = {
        templateDir: addonTemplateDir,
        ops: [
          {
            type: 'copy',
            from: 'file1.txt',
            to: 'addon1.txt',
          } as CopyOperation,
          {
            type: 'copy',
            from: 'file2.txt',
            to: 'addon2.txt',
          } as CopyOperation,
        ],
      }

      const results = await engine.applyAddon(addon)

      strictEqual(results.length, 2)
      strictEqual(results[0].success, true)
      strictEqual(results[1].success, true)

      await rm(addonTemplateDir, { recursive: true, force: true }).catch(
        () => {}
      )
    })

    test('should throw error if addon operation fails', async () => {
      const addonTemplateDir = join(tmpdir(), `addon-template-${Date.now()}`)
      await mkdir(addonTemplateDir, { recursive: true })

      const workspace = createWorkspace(workspaceDir)
      const engine = createEngine(workspace, context)

      const addon = {
        templateDir: addonTemplateDir,
        ops: [
          {
            type: 'copy',
            from: 'nonexistent.txt',
            to: 'dest.txt',
          } as CopyOperation,
        ],
      }

      await rejects(engine.applyAddon(addon), (error: Error) => {
        ok(error instanceof OperationError)
        ok(error.message.includes('Failed to apply addon operation'))
        return true
      })

      await rm(addonTemplateDir, { recursive: true, force: true }).catch(
        () => {}
      )
    })
  })

  describe('compose', () => {
    test('should compose base and addons', async () => {
      const baseFile = join(templateDir, 'base.txt')
      await writeFile(baseFile, 'Base')

      const addonTemplateDir = join(tmpdir(), `addon-template-${Date.now()}`)
      await mkdir(addonTemplateDir, { recursive: true })
      const addonFile = join(addonTemplateDir, 'addon.txt')
      await writeFile(addonFile, 'Addon')

      const workspace = createWorkspace(workspaceDir)
      const engine = createEngine(workspace, context)

      const base = {
        templateDir,
        ops: [
          {
            type: 'copy',
            from: 'base.txt',
            to: 'base-file.txt',
          } as CopyOperation,
        ],
      }

      const addons = [
        {
          templateDir: addonTemplateDir,
          ops: [
            {
              type: 'copy',
              from: 'addon.txt',
              to: 'addon-file.txt',
            } as CopyOperation,
          ],
        },
      ]

      const results = await engine.compose(base, addons)

      strictEqual(results.length, 2)
      strictEqual(results[0].success, true)
      strictEqual(results[1].success, true)
      strictEqual(existsSync(join(workspaceDir, 'base-file.txt')), true)
      strictEqual(existsSync(join(workspaceDir, 'addon-file.txt')), true)

      await rm(addonTemplateDir, { recursive: true, force: true }).catch(
        () => {}
      )
    })

    test('should create workspace if it does not exist', async () => {
      const newWorkspaceDir = join(tmpdir(), `new-workspace-${Date.now()}`)
      const baseFile = join(templateDir, 'base.txt')
      await writeFile(baseFile, 'Base')

      const workspace = createWorkspace(newWorkspaceDir)
      const engine = createEngine(workspace, {
        ...context,
        workspaceRoot: newWorkspaceDir,
      })

      const base = {
        templateDir,
        ops: [
          {
            type: 'copy',
            from: 'base.txt',
            to: 'base-file.txt',
          } as CopyOperation,
        ],
      }

      await engine.compose(base, [])

      strictEqual(workspace.exists(), true)
      strictEqual(existsSync(join(newWorkspaceDir, 'base-file.txt')), true)

      await rm(newWorkspaceDir, { recursive: true, force: true }).catch(
        () => {}
      )
    })

    test('should apply multiple addons in sequence', async () => {
      const baseFile = join(templateDir, 'base.txt')
      await writeFile(baseFile, 'Base')

      const addon1Dir = join(tmpdir(), `addon1-${Date.now()}`)
      const addon2Dir = join(tmpdir(), `addon2-${Date.now()}`)
      await mkdir(addon1Dir, { recursive: true })
      await mkdir(addon2Dir, { recursive: true })
      await writeFile(join(addon1Dir, 'addon1.txt'), 'Addon 1')
      await writeFile(join(addon2Dir, 'addon2.txt'), 'Addon 2')

      const workspace = createWorkspace(workspaceDir)
      const engine = createEngine(workspace, context)

      const base = {
        templateDir,
        ops: [
          {
            type: 'copy',
            from: 'base.txt',
            to: 'base-file.txt',
          } as CopyOperation,
        ],
      }

      const addons = [
        {
          templateDir: addon1Dir,
          ops: [
            {
              type: 'copy',
              from: 'addon1.txt',
              to: 'addon1-file.txt',
            } as CopyOperation,
          ],
        },
        {
          templateDir: addon2Dir,
          ops: [
            {
              type: 'copy',
              from: 'addon2.txt',
              to: 'addon2-file.txt',
            } as CopyOperation,
          ],
        },
      ]

      const results = await engine.compose(base, addons)

      strictEqual(results.length, 3)
      strictEqual(existsSync(join(workspaceDir, 'base-file.txt')), true)
      strictEqual(existsSync(join(workspaceDir, 'addon1-file.txt')), true)
      strictEqual(existsSync(join(workspaceDir, 'addon2-file.txt')), true)

      await rm(addon1Dir, { recursive: true, force: true }).catch(() => {})
      await rm(addon2Dir, { recursive: true, force: true }).catch(() => {})
    })

    test('should handle complex composition with different operation types', async () => {
      const baseFile = join(templateDir, 'package.json.template')
      await writeFile(
        baseFile,
        `{
  "name": "{{projectName}}",
  "version": "{{version}}"
}`
      )

      const workspace = createWorkspace(workspaceDir)
      const engine = createEngine(workspace, context)

      const base = {
        templateDir,
        ops: [
          {
            type: 'templateRender',
            from: 'package.json.template',
            to: 'package.json',
          } as TemplateRenderOperation,
        ],
      }

      const addons = [
        {
          templateDir: '',
          ops: [
            {
              type: 'jsonMerge',
              target: 'package.json',
              data: {
                dependencies: {
                  express: '^4.18.0',
                },
              },
            } as JsonMergeOperation,
            {
              type: 'textInsert',
              target: 'package.json',
              marker: '  "version": "1.0.0"',
              content: ',\n  "description": "A test project"',
              position: 'after',
            } as TextInsertOperation,
          ],
        },
      ]

      const results = await engine.compose(base, addons)

      strictEqual(results.length, 3)
      strictEqual(results[0].success, true)
      strictEqual(results[1].success, true)
      strictEqual(results[2].success, true)

      const packageJson = await readFile(
        join(workspaceDir, 'package.json'),
        'utf-8'
      )
      const parsed = JSON.parse(packageJson)
      strictEqual(parsed.name, 'test-project')
      strictEqual(parsed.version, '1.0.0')
      strictEqual(parsed.dependencies.express, '^4.18.0')
      strictEqual(parsed.description, 'A test project')
    })

    test('should handle empty addons array', async () => {
      const baseFile = join(templateDir, 'base.txt')
      await writeFile(baseFile, 'Base')

      const workspace = createWorkspace(workspaceDir)
      const engine = createEngine(workspace, context)

      const base = {
        templateDir,
        ops: [
          {
            type: 'copy',
            from: 'base.txt',
            to: 'base-file.txt',
          } as CopyOperation,
        ],
      }

      const results = await engine.compose(base, [])

      strictEqual(results.length, 1)
      strictEqual(results[0].success, true)
      strictEqual(existsSync(join(workspaceDir, 'base-file.txt')), true)
    })
  })

  describe('createEngine', () => {
    test('should create engine instance', () => {
      const workspace = createWorkspace(workspaceDir)
      const engine = createEngine(workspace, context)

      ok(engine instanceof Engine)
    })
  })
})

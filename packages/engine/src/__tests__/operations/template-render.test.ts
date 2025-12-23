import { ok, rejects, strictEqual } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import type { ExecutionContext, TemplateRenderOperation } from '@hexp/shared'
import { OperationError } from '../../errors.js'
import { executeTemplateRender } from '../../operations/template-render.js'

describe('Template Render Operation', () => {
  let templateDir: string
  let workspaceDir: string
  let context: ExecutionContext

  test.beforeEach(async () => {
    templateDir = join(tmpdir(), `template-render-test-template-${Date.now()}`)
    workspaceDir = join(
      tmpdir(),
      `template-render-test-workspace-${Date.now()}`
    )

    await mkdir(templateDir, { recursive: true })
    await mkdir(workspaceDir, { recursive: true })

    context = {
      templateRoot: templateDir,
      workspaceRoot: workspaceDir,
      variables: {
        projectName: 'my-project',
        author: 'John Doe',
        version: '1.0.0',
      },
    }
  })

  test.afterEach(async () => {
    await rm(templateDir, { recursive: true, force: true }).catch(() => {})
    await rm(workspaceDir, { recursive: true, force: true }).catch(() => {})
  })

  describe('executeTemplateRender', () => {
    test('should render template with variables', async () => {
      const templateFile = join(templateDir, 'package.json.template')
      const templateContent = `{
  "name": "{{projectName}}",
  "version": "{{version}}",
  "author": "{{author}}"
}`
      await writeFile(templateFile, templateContent)

      const operation: TemplateRenderOperation = {
        type: 'templateRender',
        from: 'package.json.template',
        to: 'package.json',
      }

      const result = await executeTemplateRender(operation, context)

      strictEqual(result.success, true)
      ok(result.filesAffected?.includes('package.json'))
      strictEqual(existsSync(join(workspaceDir, 'package.json')), true)

      const renderedContent = await readFile(
        join(workspaceDir, 'package.json'),
        'utf-8'
      )
      strictEqual(renderedContent.includes('my-project'), true)
      strictEqual(renderedContent.includes('1.0.0'), true)
      strictEqual(renderedContent.includes('John Doe'), true)
    })

    test('should render template with nested variables', async () => {
      const templateFile = join(templateDir, 'config.template')
      const templateContent = `const config = {
  app: {
    name: "{{projectName}}",
    version: "{{version}}"
  }
}`
      await writeFile(templateFile, templateContent)

      const operation: TemplateRenderOperation = {
        type: 'templateRender',
        from: 'config.template',
        to: 'config.js',
      }

      await executeTemplateRender(operation, context)

      const renderedContent = await readFile(
        join(workspaceDir, 'config.js'),
        'utf-8'
      )
      ok(renderedContent.includes('my-project'))
      ok(renderedContent.includes('1.0.0'))
    })

    test('should handle missing variables by leaving them empty', async () => {
      const templateFile = join(templateDir, 'template.txt')
      const templateContent = 'Hello {{missingVar}}!'
      await writeFile(templateFile, templateContent)

      const operation: TemplateRenderOperation = {
        type: 'templateRender',
        from: 'template.txt',
        to: 'output.txt',
      }

      await executeTemplateRender(operation, context)

      const renderedContent = await readFile(
        join(workspaceDir, 'output.txt'),
        'utf-8'
      )
      strictEqual(renderedContent, 'Hello !')
    })

    test('should create destination directory if it does not exist', async () => {
      const templateFile = join(templateDir, 'file.template')
      await writeFile(templateFile, '{{projectName}}')

      const operation: TemplateRenderOperation = {
        type: 'templateRender',
        from: 'file.template',
        to: 'subdir/nested/file.txt',
      }

      const result = await executeTemplateRender(operation, context)

      strictEqual(result.success, true)
      strictEqual(
        existsSync(join(workspaceDir, 'subdir', 'nested', 'file.txt')),
        true
      )
    })

    test('should throw error if template source does not exist', async () => {
      const operation: TemplateRenderOperation = {
        type: 'templateRender',
        from: 'nonexistent.template',
        to: 'output.txt',
      }

      await rejects(
        executeTemplateRender(operation, context),
        (error: Error) => {
          ok(error instanceof OperationError)
          strictEqual(error.operationType, 'templateRender')
          ok(error.message.includes('does not exist'))
          return true
        }
      )
    })

    test('should render template with sections', async () => {
      const templateFile = join(templateDir, 'readme.template')
      const templateContent = `# {{projectName}}

{{#hasDescription}}
## Description
This is a great project!
{{/hasDescription}}

Version: {{version}}
`
      await writeFile(templateFile, templateContent)

      const contextWithSection: ExecutionContext = {
        ...context,
        variables: {
          ...context.variables,
          hasDescription: true,
        },
      }

      const operation: TemplateRenderOperation = {
        type: 'templateRender',
        from: 'readme.template',
        to: 'README.md',
      }

      await executeTemplateRender(operation, contextWithSection)

      const renderedContent = await readFile(
        join(workspaceDir, 'README.md'),
        'utf-8'
      )
      ok(renderedContent.includes('# my-project'))
      ok(renderedContent.includes('## Description'))
      ok(renderedContent.includes('This is a great project!'))
    })

    test('should handle boolean variables', async () => {
      const templateFile = join(templateDir, 'config.template')
      const templateContent = `const isProduction = {{isProduction}}`
      await writeFile(templateFile, templateContent)

      const contextWithBool: ExecutionContext = {
        ...context,
        variables: {
          ...context.variables,
          isProduction: true,
        },
      }

      const operation: TemplateRenderOperation = {
        type: 'templateRender',
        from: 'config.template',
        to: 'config.js',
      }

      await executeTemplateRender(operation, contextWithBool)

      const renderedContent = await readFile(
        join(workspaceDir, 'config.js'),
        'utf-8'
      )
      ok(renderedContent.includes('true'))
    })
  })
})

import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { AddonTemplate, BaseTemplate, Operation } from '@hexp/catalog'
import { Catalog } from '@hexp/catalog'
import type { Prompt } from '@hexp/shared'
import { z } from 'zod'

export interface ValidationIssue {
  level: 'error' | 'warning'
  message: string
  templateId?: string
  path?: string
  field?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  templatesValidated: number
}

const operationSchema = z.object({
  type: z.enum([
    'copy',
    'templateRender',
    'jsonMerge',
    'textInsert',
    'textReplace',
    'codemod',
    'envAppend',
  ]),
})

const copyOperationSchema = operationSchema.extend({
  type: z.literal('copy'),
  from: z.string(),
  to: z.string(),
  overwrite: z.boolean().optional(),
})

const templateRenderOperationSchema = operationSchema.extend({
  type: z.literal('templateRender'),
  from: z.string(),
  to: z.string(),
})

const jsonMergeOperationSchema = operationSchema.extend({
  type: z.literal('jsonMerge'),
  target: z.string(),
  data: z.record(z.unknown()),
  arrayMerge: z.enum(['append', 'replace', 'merge']).optional(),
  overwrite: z.boolean().optional(),
})

const textInsertOperationSchema = operationSchema.extend({
  type: z.literal('textInsert'),
  target: z.string(),
  marker: z.string(),
  content: z.string(),
  position: z.enum(['before', 'after']).optional(),
})

const textReplaceOperationSchema = operationSchema.extend({
  type: z.literal('textReplace'),
  target: z.string(),
  pattern: z.string(),
  replacement: z.string(),
  isRegex: z.boolean().optional(),
})

const codemodOperationSchema = operationSchema.extend({
  type: z.literal('codemod'),
  target: z.string(),
  transform: z.string(),
  options: z.record(z.unknown()).optional(),
})

const envAppendOperationSchema = operationSchema.extend({
  type: z.literal('envAppend'),
  target: z.string(),
  variables: z.record(z.string()),
  envFile: z.enum(['.env', '.env.example', '.env.local']).optional(),
})

const operationSchemas = [
  copyOperationSchema,
  templateRenderOperationSchema,
  jsonMergeOperationSchema,
  textInsertOperationSchema,
  textReplaceOperationSchema,
  codemodOperationSchema,
  envAppendOperationSchema,
]

export class TemplateValidator {
  private projectRoot: string
  private catalog: Catalog

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
    this.catalog = new Catalog(projectRoot)
  }

  /**
   * Validate all templates in the project
   */
  async validateAll(_templatesPath?: string): Promise<ValidationResult> {
    const issues: ValidationIssue[] = []
    let templatesValidated = 0

    try {
      const bases = await this.catalog.getBases()
      const addons = await this.catalog.getAddons()
      const catalogErrors = await this.catalog.getErrors()

      // Add catalog errors
      for (const { path, error } of catalogErrors) {
        issues.push({
          level: 'error',
          message: `Failed to load manifest: ${error}`,
          path,
        })
      }

      // Validate bases
      for (const base of bases) {
        templatesValidated++
        const baseIssues = await this.validateTemplate(base, 'base')
        issues.push(...baseIssues)
      }

      // Validate addons
      for (const addon of addons) {
        templatesValidated++
        const addonIssues = await this.validateTemplate(addon, 'addon')
        issues.push(...addonIssues)
      }

      // Validate cross-template issues
      const crossIssues = this.validateCrossTemplate(bases, addons)
      issues.push(...crossIssues)

      const errors = issues.filter((i) => i.level === 'error')
      const warnings = issues.filter((i) => i.level === 'warning')

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        templatesValidated,
      }
    } catch (error) {
      issues.push({
        level: 'error',
        message: `Failed to validate templates: ${error instanceof Error ? error.message : String(error)}`,
      })
      return {
        isValid: false,
        errors: issues.filter((i) => i.level === 'error'),
        warnings: issues.filter((i) => i.level === 'warning'),
        templatesValidated,
      }
    }
  }

  /**
   * Validate a single template
   */
  async validateTemplate(
    template: BaseTemplate | AddonTemplate,
    type: 'base' | 'addon'
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = []
    const templatePath = this.getTemplatePath(template.id, type)

    // Validate operations
    if (template.ops) {
      for (let i = 0; i < template.ops.length; i++) {
        const op = template.ops[i]
        const opIssues = this.validateOperation(op, templatePath, i)
        issues.push(...opIssues)
      }
    }

    // Validate file references in operations
    if (template.ops) {
      for (const op of template.ops) {
        const fileIssues = this.validateOperationFiles(op, templatePath)
        issues.push(...fileIssues)
      }
    }

    // Validate prompts
    if (template.prompts) {
      for (let i = 0; i < template.prompts.length; i++) {
        const prompt = template.prompts[i]
        const promptIssues = this.validatePrompt(prompt, i)
        issues.push(...promptIssues)
      }
    }

    // Validate addon-specific fields
    if (type === 'addon') {
      const addon = template as AddonTemplate
      // Check for circular dependencies (basic check)
      if (addon.requires && addon.provides) {
        const selfRequires = addon.requires.some((r) =>
          addon.provides?.includes(r)
        )
        if (selfRequires) {
          issues.push({
            level: 'warning',
            message: 'Addon requires and provides the same capability',
            templateId: template.id,
            field: 'requires/provides',
          })
        }
      }
    }

    return issues
  }

  /**
   * Validate an operation
   */
  private validateOperation(
    operation: Operation,
    templatePath: string,
    index: number
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    // Validate operation schema
    let schemaValid = false
    for (const schema of operationSchemas) {
      try {
        schema.parse(operation)
        schemaValid = true
        break
      } catch {
        // Try next schema
      }
    }

    if (!schemaValid) {
      issues.push({
        level: 'error',
        message: `Invalid operation schema at index ${index}`,
        path: templatePath,
        field: `ops[${index}]`,
      })
      return issues
    }

    // Type-specific validations
    if (operation.type === 'copy' && 'from' in operation) {
      if (!operation.from || typeof operation.from !== 'string') {
        issues.push({
          level: 'error',
          message: 'Copy operation missing "from" field',
          path: templatePath,
          field: `ops[${index}].from`,
        })
      }
    }

    if (operation.type === 'templateRender' && 'from' in operation) {
      if (!operation.from || typeof operation.from !== 'string') {
        issues.push({
          level: 'error',
          message: 'TemplateRender operation missing "from" field',
          path: templatePath,
          field: `ops[${index}].from`,
        })
      }
    }

    return issues
  }

  /**
   * Validate file references in operations
   */
  private validateOperationFiles(
    operation: Operation,
    templatePath: string
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    const templateDir = resolve(this.projectRoot, templatePath, 'template')

    if (operation.type === 'copy' && 'from' in operation) {
      const fromPath = join(templateDir, operation.from)
      if (!existsSync(fromPath)) {
        issues.push({
          level: 'error',
          message: `File not found: ${operation.from}`,
          path: templatePath,
          field: 'ops[].from',
        })
      }
    }

    if (operation.type === 'templateRender' && 'from' in operation) {
      const fromPath = join(templateDir, operation.from)
      if (!existsSync(fromPath)) {
        issues.push({
          level: 'error',
          message: `Template file not found: ${operation.from}`,
          path: templatePath,
          field: 'ops[].from',
        })
      }
    }

    if (operation.type === 'jsonMerge' && 'target' in operation) {
      // Target might not exist yet (will be created), so this is just a warning
      // But we can check if the directory exists
      const targetDir = resolve(templateDir, '..', operation.target)
      const targetParentDir = resolve(targetDir, '..')
      if (!existsSync(targetParentDir)) {
        issues.push({
          level: 'warning',
          message: `Target directory may not exist: ${operation.target}`,
          path: templatePath,
          field: 'ops[].target',
        })
      }
    }

    return issues
  }

  /**
   * Validate a prompt
   */
  private validatePrompt(prompt: Prompt, index: number): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    if (!prompt.id || typeof prompt.id !== 'string') {
      issues.push({
        level: 'error',
        message: `Prompt missing "id" field at index ${index}`,
        field: `prompts[${index}].id`,
      })
    }

    if (!prompt.type || typeof prompt.type !== 'string') {
      issues.push({
        level: 'error',
        message: `Prompt missing "type" field at index ${index}`,
        field: `prompts[${index}].type`,
      })
    }

    return issues
  }

  /**
   * Validate cross-template issues (IDs unique, etc.)
   */
  private validateCrossTemplate(
    bases: BaseTemplate[],
    addons: AddonTemplate[]
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    const allIds = new Set<string>()

    // Check for duplicate IDs
    for (const base of bases) {
      if (allIds.has(base.id)) {
        issues.push({
          level: 'error',
          message: `Duplicate template ID: ${base.id}`,
          templateId: base.id,
        })
      }
      allIds.add(base.id)
    }

    for (const addon of addons) {
      if (allIds.has(addon.id)) {
        issues.push({
          level: 'error',
          message: `Duplicate template ID: ${addon.id}`,
          templateId: addon.id,
        })
      }
      allIds.add(addon.id)
    }

    // Check for circular dependencies in addons
    const _addonMap = new Map(addons.map((a) => [a.id, a]))
    for (const addon of addons) {
      if (addon.requires) {
        for (const req of addon.requires) {
          // Check if requirement is another addon that conflicts
          for (const otherAddon of addons) {
            if (
              otherAddon.id !== addon.id &&
              otherAddon.conflicts?.includes(addon.id)
            ) {
              issues.push({
                level: 'warning',
                message: `Addon ${addon.id} requires ${req} but conflicts with ${otherAddon.id}`,
                templateId: addon.id,
              })
            }
          }
        }
      }
    }

    return issues
  }

  /**
   * Get template path
   */
  private getTemplatePath(id: string, type: 'base' | 'addon'): string {
    return type === 'base' ? `templates/bases/${id}` : `templates/addons/${id}`
  }
}

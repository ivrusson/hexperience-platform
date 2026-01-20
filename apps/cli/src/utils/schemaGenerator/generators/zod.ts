import { existsSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Model, ModelField } from '../../../tui/stores/modelStore'
import type { SchemaGenerator } from '../types'

function mapFieldTypeToZod(field: ModelField): string {
  let zodType = ''

  switch (field.type) {
    case 'string':
      zodType = 'z.string()'
      // Add string validations
      if (field.min !== undefined) {
        zodType += `.min(${field.min})`
      }
      if (field.max !== undefined) {
        zodType += `.max(${field.max})`
      }
      if (field.email) {
        zodType += '.email()'
      }
      if (field.url) {
        zodType += '.url()'
      }
      if (field.pattern) {
        zodType += `.regex(/${field.pattern}/)`
      }
      break
    case 'number':
      zodType = 'z.number()'
      // Add number validations
      if (field.min !== undefined) {
        zodType += `.min(${field.min})`
      }
      if (field.max !== undefined) {
        zodType += `.max(${field.max})`
      }
      break
    case 'boolean':
      zodType = 'z.boolean()'
      break
    case 'date':
      zodType = 'z.date()'
      break
    case 'object':
      zodType = 'z.object({}).passthrough()' // Generic object
      break
    case 'array':
      zodType = 'z.array(z.unknown())' // Generic array
      if (field.min !== undefined) {
        zodType += `.min(${field.min})`
      }
      if (field.max !== undefined) {
        zodType += `.max(${field.max})`
      }
      break
    default:
      zodType = 'z.string()'
  }

  // Handle required/optional
  if (!field.required) {
    zodType += '.optional()'
  }

  return zodType
}

function generateZodSchemas(models: Model[]): string {
  const imports = ["import { z } from 'zod'"]
  const schemas: string[] = []
  const types: string[] = []

  for (const model of models) {
    const modelNamePascal =
      model.name.charAt(0).toUpperCase() +
      model.name.slice(1).replace(/\s+/g, '')
    const schemaName = `${model.name.toLowerCase().replace(/\s+/g, '')}Schema`

    const fields: string[] = []

    for (const field of model.fields) {
      const zodType = mapFieldTypeToZod(field)
      fields.push(`  ${field.name}: ${zodType}`)
    }

    const schemaCode = `export const ${schemaName} = z.object({\n${fields.join(',\n')}\n})`
    schemas.push(schemaCode)

    // Generate types
    types.push(`export type ${modelNamePascal} = z.infer<typeof ${schemaName}>`)
  }

  return (
    imports.join('\n') +
    '\n\n' +
    schemas.join('\n\n') +
    '\n\n' +
    types.join('\n')
  )
}

export const zodGenerator: SchemaGenerator = {
  async generate(models: Model[], projectPath: string): Promise<void> {
    if (models.length === 0) {
      return
    }

    // Try to find existing schemas directory
    const possiblePaths = [
      join(projectPath, 'src', 'schemas'),
      join(projectPath, 'src', 'validations'),
      join(projectPath, 'src', 'types'),
    ]

    let schemasDir = possiblePaths.find((p) => existsSync(p))

    if (!schemasDir) {
      // Use default path
      schemasDir = join(projectPath, 'src', 'schemas')
    }

    // Ensure directory exists
    if (!existsSync(schemasDir)) {
      await mkdir(schemasDir, { recursive: true })
    }

    const schemasPath = join(schemasDir, 'models.ts')

    // Generate schemas code
    const schemasCode = generateZodSchemas(models)

    writeFileSync(schemasPath, schemasCode, 'utf-8')
  },
}

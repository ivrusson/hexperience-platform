import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { Model, ModelField } from '../../../tui/stores/modelStore'
import type { SchemaGenerator } from '../types'

function mapFieldTypeToDrizzle(field: ModelField): string {
  switch (field.type) {
    case 'string':
      return `text('${field.name}')${field.required ? '.notNull()' : ''}`
    case 'number':
      return `integer('${field.name}')${field.required ? '.notNull()' : ''}`
    case 'boolean':
      return `integer('${field.name}', { mode: 'boolean' })${field.required ? '.notNull()' : ''}`
    case 'date':
      return `integer('${field.name}', { mode: 'timestamp' })${field.required ? '.notNull()' : ''}`
    case 'object':
      return `text('${field.name}', { mode: 'json' })${field.required ? '.notNull()' : ''}`
    case 'array':
      return `text('${field.name}', { mode: 'json' })${field.required ? '.notNull()' : ''}`
    default:
      return `text('${field.name}')${field.required ? '.notNull()' : ''}`
  }
}

function generateDrizzleSchema(models: Model[]): string {
  const imports = [
    "import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'",
  ]

  const tables: string[] = []

  for (const model of models) {
    const tableName = model.name.toLowerCase().replace(/\s+/g, '_')
    const tableVarName = `${tableName}Table`

    // Build columns
    const columns: string[] = []

    // Add id column if not present
    const hasId = model.fields.some((f) => f.name === 'id')
    if (!hasId) {
      columns.push("  id: integer('id').primaryKey()")
    }

    // Add model fields
    for (const field of model.fields) {
      if (field.name === 'id' && !hasId) {
        // Skip if we already added id
        continue
      }
      const drizzleColumn = mapFieldTypeToDrizzle(field)
      columns.push(`  ${field.name}: ${drizzleColumn}`)
    }

    // Add timestamps if not present
    const hasCreatedAt = model.fields.some((f) => f.name === 'createdAt')
    const hasUpdatedAt = model.fields.some((f) => f.name === 'updatedAt')

    if (!hasCreatedAt) {
      columns.push(
        "  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())"
      )
    }
    if (!hasUpdatedAt) {
      columns.push(
        "  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())"
      )
    }

    // Build table definition
    const tableCode = `export const ${tableVarName} = sqliteTable('${tableName}', {\n${columns.join(',\n')}\n})`

    // Add type exports
    const modelNamePascal =
      model.name.charAt(0).toUpperCase() +
      model.name.slice(1).replace(/\s+/g, '')
    const typeExports = `\nexport type ${modelNamePascal} = typeof ${tableVarName}.$inferSelect\nexport type New${modelNamePascal} = typeof ${tableVarName}.$inferInsert`

    tables.push(tableCode + typeExports)
  }

  return `${imports.join('\n')}\n\n${tables.join('\n\n')}`
}

function mergeDrizzleSchemas(
  existingContent: string,
  newContent: string
): string {
  // Extract imports from existing content
  const existingImports: string[] = []
  const existingTables: string[] = []
  const existingTypes: string[] = []

  const lines = existingContent.split('\n')
  let inImport = false
  let inTable = false
  let currentTable = ''
  let braceCount = 0

  for (const line of lines) {
    // Collect imports
    if (line.trim().startsWith('import ')) {
      existingImports.push(line)
      inImport = true
    } else if (inImport && line.trim() === '') {
      inImport = false
    }

    // Collect existing table definitions (we'll preserve them if they don't match new models)
    if (
      line.includes('sqliteTable(') ||
      line.includes('pgTable(') ||
      line.includes('mysqlTable(')
    ) {
      inTable = true
      currentTable = line
      braceCount =
        (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
    } else if (inTable) {
      currentTable += `\n${line}`
      braceCount +=
        (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
      if (braceCount === 0) {
        existingTables.push(currentTable)
        inTable = false
        currentTable = ''
      }
    }

    // Collect type exports
    if (line.trim().startsWith('export type ') && line.includes('$infer')) {
      existingTypes.push(line)
    }
  }

  // Parse new content to extract new tables
  const newLines = newContent.split('\n')
  const newImports: string[] = []
  const newTables: string[] = []
  const newTypes: string[] = []

  inTable = false
  currentTable = ''
  braceCount = 0

  for (const line of newLines) {
    if (line.trim().startsWith('import ')) {
      if (!existingImports.includes(line)) {
        newImports.push(line)
      }
    } else if (
      line.includes('sqliteTable(') ||
      line.includes('pgTable(') ||
      line.includes('mysqlTable(')
    ) {
      inTable = true
      currentTable = line
      braceCount =
        (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
    } else if (inTable) {
      currentTable += `\n${line}`
      braceCount +=
        (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
      if (braceCount === 0) {
        newTables.push(currentTable)
        inTable = false
        currentTable = ''
      }
    } else if (
      line.trim().startsWith('export type ') &&
      line.includes('$infer')
    ) {
      newTypes.push(line)
    }
  }

  // Merge: keep existing imports, add new ones, replace matching tables, keep non-matching existing tables
  const allImports = Array.from(new Set([...existingImports, ...newImports]))
  const mergedTables = [...existingTables, ...newTables]
  const allTypes = Array.from(new Set([...existingTypes, ...newTypes]))

  return (
    allImports.join('\n') +
    '\n\n' +
    mergedTables.join('\n\n') +
    '\n\n' +
    allTypes.join('\n')
  )
}

export const drizzleGenerator: SchemaGenerator = {
  async generate(models: Model[], projectPath: string): Promise<void> {
    if (models.length === 0) {
      return
    }

    // Try to find existing schema file
    const possiblePaths = [
      join(projectPath, 'src', 'db', 'schema.ts'),
      join(projectPath, 'src', 'schema.ts'),
      join(projectPath, 'schema.ts'),
    ]

    let schemaPath = possiblePaths.find((p) => existsSync(p))

    if (!schemaPath) {
      // Use default path
      schemaPath = join(projectPath, 'src', 'db', 'schema.ts')
    }

    const schemaDir = dirname(schemaPath)

    // Ensure directory exists
    if (!existsSync(schemaDir)) {
      await mkdir(schemaDir, { recursive: true })
    }

    // Generate new schema code
    const newSchemaCode = generateDrizzleSchema(models)

    // If file exists, merge with existing content
    if (existsSync(schemaPath)) {
      const existingContent = readFileSync(schemaPath, 'utf-8')
      const mergedContent = mergeDrizzleSchemas(existingContent, newSchemaCode)
      writeFileSync(schemaPath, mergedContent, 'utf-8')
    } else {
      // New file, just write the generated content
      writeFileSync(schemaPath, newSchemaCode, 'utf-8')
    }
  },
}

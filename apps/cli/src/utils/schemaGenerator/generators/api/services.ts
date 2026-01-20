import { existsSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Model } from '../../../../tui/stores/modelStore'
import type { SchemaType } from '../../types'

function generateServiceCode(model: Model, ormType: SchemaType): string {
  const modelNamePascal =
    model.name.charAt(0).toUpperCase() + model.name.slice(1).replace(/\s+/g, '')
  const modelNameCamel =
    model.name.charAt(0).toLowerCase() + model.name.slice(1).replace(/\s+/g, '')
  const tableName = model.name.toLowerCase().replace(/\s+/g, '_')
  const tableVarName = `${tableName}Table`

  if (ormType === 'drizzle') {
    return `import { db } from '../db'
import { ${tableVarName}, type New${modelNamePascal} } from '../db/schema'
import { eq } from 'drizzle-orm'

export class ${modelNamePascal}Service {
  async findAll() {
    return await db.select().from(${tableVarName})
  }

  async findById(id: number | string) {
    const result = await db.select().from(${tableVarName}).where(eq(${tableVarName}.id, id as number)).limit(1)
    return result[0] || null
  }

  async create(data: New${modelNamePascal}) {
    const result = await db.insert(${tableVarName}).values(data).returning()
    return result[0]
  }

  async update(id: number | string, data: Partial<New${modelNamePascal}>) {
    const result = await db.update(${tableVarName})
      .set({ ...data, updatedAt: new Date() })
      .where(eq(${tableVarName}.id, id as number))
      .returning()
    return result[0] || null
  }

  async delete(id: number | string) {
    const result = await db.delete(${tableVarName})
      .where(eq(${tableVarName}.id, id as number))
      .returning()
    return result[0] || null
  }
}

export const ${modelNameCamel}Service = new ${modelNamePascal}Service()
`
  }

  // Fallback for other ORMs
  return `// Service for ${model.name}
// TODO: Implement service methods for ${ormType}
export class ${modelNamePascal}Service {
  async findAll() {
    throw new Error('Not implemented')
  }

  async findById(id: number) {
    throw new Error('Not implemented')
  }

  async create(data: unknown) {
    throw new Error('Not implemented')
  }

  async update(id: number, data: unknown) {
    throw new Error('Not implemented')
  }

  async delete(id: number) {
    throw new Error('Not implemented')
  }
}
`
}

export async function generateServices(
  models: Model[],
  projectPath: string,
  ormType: SchemaType
): Promise<void> {
  if (models.length === 0) {
    return
  }

  // Determine services directory
  const possiblePaths = [
    join(projectPath, 'src', 'services'),
    join(projectPath, 'src', 'repositories'),
  ]

  let servicesDir = possiblePaths.find((p) => existsSync(p))

  if (!servicesDir) {
    // Use default path
    servicesDir = join(projectPath, 'src', 'services')
  }

  // Ensure directory exists
  if (!existsSync(servicesDir)) {
    await mkdir(servicesDir, { recursive: true })
  }

  // Generate service file for each model
  for (const model of models) {
    const modelNameCamel =
      model.name.charAt(0).toLowerCase() +
      model.name.slice(1).replace(/\s+/g, '')
    const servicePath = join(servicesDir, `${modelNameCamel}.ts`)
    const serviceCode = generateServiceCode(model, ormType)
    writeFileSync(servicePath, serviceCode, 'utf-8')
  }
}

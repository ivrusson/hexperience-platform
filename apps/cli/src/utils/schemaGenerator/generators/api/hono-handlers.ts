import { existsSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Model } from '../../../../tui/stores/modelStore'

function generateHandlerCode(model: Model): string {
  const modelNamePascal =
    model.name.charAt(0).toUpperCase() + model.name.slice(1).replace(/\s+/g, '')
  const modelNameCamel =
    model.name.charAt(0).toLowerCase() + model.name.slice(1).replace(/\s+/g, '')
  const schemaName = `${model.name.toLowerCase().replace(/\s+/g, '')}Schema`

  return `import type { Context } from 'hono'
import { ${schemaName} } from '../schemas/models'
import { ${modelNameCamel}Service } from '../services/${modelNameCamel}'

export async function list${modelNamePascal}(c: Context) {
  try {
    const items = await ${modelNameCamel}Service.findAll()
    return c.json({ data: items })
  } catch (error) {
    return c.json(
      { error: 'Failed to fetch ${model.name.toLowerCase()}' },
      500
    )
  }
}

export async function get${modelNamePascal}(c: Context) {
  try {
    const id = Number.parseInt(c.req.param('id'))
    if (Number.isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400)
    }

    const item = await ${modelNameCamel}Service.findById(id)
    if (!item) {
      return c.json({ error: '${model.name} not found' }, 404)
    }

    return c.json({ data: item })
  } catch (error) {
    return c.json(
      { error: 'Failed to fetch ${model.name.toLowerCase()}' },
      500
    )
  }
}

export async function create${modelNamePascal}(c: Context) {
  try {
    const body = await c.req.json()
    const validated = ${schemaName}.parse(body)

    const item = await ${modelNameCamel}Service.create(validated)
    return c.json({ data: item }, 201)
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return c.json({ error: 'Validation error', details: error }, 400)
    }
    return c.json(
      { error: 'Failed to create ${model.name.toLowerCase()}' },
      500
    )
  }
}

export async function update${modelNamePascal}(c: Context) {
  try {
    const id = Number.parseInt(c.req.param('id'))
    if (Number.isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400)
    }

    const body = await c.req.json()
    const validated = ${schemaName}.partial().parse(body)

    const item = await ${modelNameCamel}Service.update(id, validated)
    if (!item) {
      return c.json({ error: '${model.name} not found' }, 404)
    }

    return c.json({ data: item })
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return c.json({ error: 'Validation error', details: error }, 400)
    }
    return c.json(
      { error: 'Failed to update ${model.name.toLowerCase()}' },
      500
    )
  }
}

export async function delete${modelNamePascal}(c: Context) {
  try {
    const id = Number.parseInt(c.req.param('id'))
    if (Number.isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400)
    }

    const item = await ${modelNameCamel}Service.delete(id)
    if (!item) {
      return c.json({ error: '${model.name} not found' }, 404)
    }

    return c.json({ data: item })
  } catch (error) {
    return c.json(
      { error: 'Failed to delete ${model.name.toLowerCase()}' },
      500
    )
  }
}
`
}

export async function generateHandlers(
  models: Model[],
  projectPath: string
): Promise<void> {
  if (models.length === 0) {
    return
  }

  // Determine handlers directory
  const possiblePaths = [
    join(projectPath, 'src', 'handlers'),
    join(projectPath, 'src', 'controllers'),
  ]

  let handlersDir = possiblePaths.find((p) => existsSync(p))

  if (!handlersDir) {
    // Use default path
    handlersDir = join(projectPath, 'src', 'handlers')
  }

  // Ensure directory exists
  if (!existsSync(handlersDir)) {
    await mkdir(handlersDir, { recursive: true })
  }

  // Generate handler file for each model
  for (const model of models) {
    const modelNameCamel =
      model.name.charAt(0).toLowerCase() +
      model.name.slice(1).replace(/\s+/g, '')
    const handlerPath = join(handlersDir, `${modelNameCamel}.ts`)
    const handlerCode = generateHandlerCode(model)
    writeFileSync(handlerPath, handlerCode, 'utf-8')
  }
}

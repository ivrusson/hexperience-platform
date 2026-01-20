import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Model } from '../../../../tui/stores/modelStore'

function generateRoutesCode(model: Model): string {
  const modelNamePascal =
    model.name.charAt(0).toUpperCase() + model.name.slice(1).replace(/\s+/g, '')
  const modelNameCamel =
    model.name.charAt(0).toLowerCase() + model.name.slice(1).replace(/\s+/g, '')
  const routePath = `/api/${model.name.toLowerCase().replace(/\s+/g, '-')}`

  const handlerImports = [
    `list${modelNamePascal}`,
    `get${modelNamePascal}`,
    `create${modelNamePascal}`,
    `update${modelNamePascal}`,
    `delete${modelNamePascal}`,
  ]

  return `import { Hono } from 'hono'
import {
  ${handlerImports.join(',\n  ')}
} from '../handlers/${modelNameCamel}'

export const ${modelNameCamel}Routes = new Hono()

${modelNameCamel}Routes.get('${routePath}', list${modelNamePascal})
${modelNameCamel}Routes.get('${routePath}/:id', get${modelNamePascal})
${modelNameCamel}Routes.post('${routePath}', create${modelNamePascal})
${modelNameCamel}Routes.put('${routePath}/:id', update${modelNamePascal})
${modelNameCamel}Routes.delete('${routePath}/:id', delete${modelNamePascal})
`
}

export async function generateRoutes(
  models: Model[],
  projectPath: string
): Promise<string[]> {
  if (models.length === 0) {
    return []
  }

  // Determine routes directory
  const routesDir = join(projectPath, 'src', 'routes')

  // Ensure directory exists
  if (!existsSync(routesDir)) {
    await mkdir(routesDir, { recursive: true })
  }

  const generatedFiles: string[] = []

  // Generate route file for each model
  for (const model of models) {
    const modelNameCamel =
      model.name.charAt(0).toLowerCase() +
      model.name.slice(1).replace(/\s+/g, '')
    const routePath = join(routesDir, `${modelNameCamel}.ts`)
    const routeCode = generateRoutesCode(model)
    writeFileSync(routePath, routeCode, 'utf-8')
    generatedFiles.push(routePath)
  }

  return generatedFiles
}

export async function integrateRoutesIntoMain(
  projectPath: string,
  routeFiles: string[]
): Promise<void> {
  const indexPath = join(projectPath, 'src', 'index.ts')

  if (!existsSync(indexPath)) {
    return // Can't integrate if main file doesn't exist
  }

  let content = readFileSync(indexPath, 'utf-8')

  // Find the @addon:routes marker
  const marker = '// @addon:routes'
  const markerIndex = content.indexOf(marker)

  if (markerIndex === -1) {
    return // No marker found, skip integration
  }

  // Generate imports and route registrations
  const imports: string[] = []
  const registrations: string[] = []

  for (const routeFile of routeFiles) {
    // Calculate relative path from src/index.ts to the route file
    const routeName = routeFile.split('/').pop()?.replace('.ts', '') || ''
    const modelNameCamel = routeName
    const importName = `${modelNameCamel}Routes`
    const relativePath = `./routes/${routeName}`

    imports.push(`import { ${importName} } from '${relativePath}'`)
    registrations.push(`app.route('/', ${importName})`)
  }

  // Insert imports before marker (after existing imports)
  const importCode = imports.join('\n')
  const registrationCode = registrations.join('\n')

  // Check if imports already exist
  const hasImports = imports.some((imp) => {
    const importName = imp
      .split(' from ')[0]
      .trim()
      .replace('import { ', '')
      .replace(' }', '')
    return content.includes(importName)
  })

  if (!hasImports && imports.length > 0) {
    // Find a good place to insert imports (after last import or before marker)
    const lastImportIndex = content.lastIndexOf('import ')
    if (lastImportIndex !== -1) {
      const nextLineAfterImport = content.indexOf('\n', lastImportIndex)
      if (nextLineAfterImport !== -1 && nextLineAfterImport < markerIndex) {
        content =
          content.slice(0, nextLineAfterImport + 1) +
          importCode +
          '\n' +
          content.slice(nextLineAfterImport + 1)
      } else {
        content =
          content.slice(0, markerIndex) +
          importCode +
          '\n\n' +
          content.slice(markerIndex)
      }
    } else {
      content =
        content.slice(0, markerIndex) +
        importCode +
        '\n\n' +
        content.slice(markerIndex)
    }
  }

  // Insert route registrations after marker
  const afterMarker = content.indexOf('\n', markerIndex)
  if (afterMarker !== -1) {
    // Check if registrations already exist
    const hasRegistrations = registrations.some((reg) =>
      content.includes(reg.split('(')[0].trim())
    )
    if (!hasRegistrations) {
      content =
        content.slice(0, afterMarker + 1) +
        registrationCode +
        '\n' +
        content.slice(afterMarker + 1)
    }
  }

  writeFileSync(indexPath, content, 'utf-8')
}

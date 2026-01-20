import type { Model } from '../../../../tui/stores/modelStore'
import { detectSchemaTypes } from '../../detector'
import type { APIGenerator, SchemaType, WebFrameworkType } from '../../types'
import { generateHandlers } from './hono-handlers'
import { generateRoutes, integrateRoutesIntoMain } from './hono-routes'
import { generateServices } from './services'

export const honoAPIGenerator: APIGenerator = {
  async generate(
    models: Model[],
    projectPath: string,
    framework: WebFrameworkType
  ): Promise<void> {
    if (framework !== 'hono') {
      throw new Error(`Unsupported framework: ${framework}`)
    }

    if (models.length === 0) {
      return
    }

    // Detect ORM type for services
    const schemaTypes = detectSchemaTypes(projectPath)
    const ormType: SchemaType = schemaTypes.includes('drizzle')
      ? 'drizzle'
      : schemaTypes.includes('prisma')
        ? 'prisma'
        : schemaTypes.includes('typeorm')
          ? 'typeorm'
          : 'drizzle' // Default

    // Generate services first (needed by handlers)
    await generateServices(models, projectPath, ormType)

    // Generate handlers (needed by routes)
    await generateHandlers(models, projectPath)

    // Generate routes
    const routeFiles = await generateRoutes(models, projectPath)

    // Integrate routes into main file
    await integrateRoutesIntoMain(projectPath, routeFiles)
  },
}

export const apiGenerators: Record<WebFrameworkType, APIGenerator> = {
  hono: honoAPIGenerator,
  express: {
    // TODO: Implement Express generator
    async generate() {
      throw new Error('Express generator not yet implemented')
    },
  },
  fastify: {
    // TODO: Implement Fastify generator
    async generate() {
      throw new Error('Fastify generator not yet implemented')
    },
  },
}

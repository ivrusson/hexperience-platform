import type { Model } from '../../tui/stores/modelStore'

export type SchemaType = 'drizzle' | 'prisma' | 'zod' | 'typeorm'

export type WebFrameworkType = 'hono' | 'express' | 'fastify'

export interface SchemaGenerator {
  generate(models: Model[], projectPath: string): Promise<void>
}

export interface APIGenerator {
  generate(
    models: Model[],
    projectPath: string,
    framework: WebFrameworkType
  ): Promise<void>
}

export interface GenerationResult {
  success: boolean
  filesGenerated: string[]
  errors?: string[]
}

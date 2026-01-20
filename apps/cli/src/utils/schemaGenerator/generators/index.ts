import type { SchemaGenerator, SchemaType } from '../types'
import { drizzleGenerator } from './drizzle'
import { zodGenerator } from './zod'

export const schemaGenerators: Record<SchemaType, SchemaGenerator> = {
  drizzle: drizzleGenerator,
  zod: zodGenerator,
  prisma: {
    // TODO: Implement Prisma generator
    async generate() {
      throw new Error('Prisma generator not yet implemented')
    },
  },
  typeorm: {
    // TODO: Implement TypeORM generator
    async generate() {
      throw new Error('TypeORM generator not yet implemented')
    },
  },
}

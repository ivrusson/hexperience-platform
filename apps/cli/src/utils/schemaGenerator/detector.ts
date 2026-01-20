import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SchemaType, WebFrameworkType } from './types'

export function detectSchemaTypes(projectPath: string): SchemaType[] {
  const detected: SchemaType[] = []
  const packageJsonPath = join(projectPath, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return detected
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    // Detect Drizzle
    if (deps['drizzle-orm'] || deps['drizzle-kit']) {
      detected.push('drizzle')
    }

    // Detect Prisma
    if (deps.prisma || deps['@prisma/client']) {
      detected.push('prisma')
    }

    // Detect TypeORM
    if (deps.typeorm) {
      detected.push('typeorm')
    }

    // Detect Zod (always useful for validation)
    if (deps.zod) {
      detected.push('zod')
    }

    // Also check for config files
    if (existsSync(join(projectPath, 'drizzle.config.ts'))) {
      if (!detected.includes('drizzle')) {
        detected.push('drizzle')
      }
    }

    if (existsSync(join(projectPath, 'prisma', 'schema.prisma'))) {
      if (!detected.includes('prisma')) {
        detected.push('prisma')
      }
    }

    // Check directory structure
    if (existsSync(join(projectPath, 'src', 'db', 'schema.ts'))) {
      if (!detected.includes('drizzle')) {
        detected.push('drizzle')
      }
    }
  } catch (_error) {
    // If we can't read package.json, return empty array
  }

  return detected
}

export function detectWebFramework(
  projectPath: string
): WebFrameworkType | null {
  const packageJsonPath = join(projectPath, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return null
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    // Detect Hono
    if (deps.hono) {
      return 'hono'
    }

    // Detect Express
    if (deps.express) {
      return 'express'
    }

    // Detect Fastify
    if (deps.fastify) {
      return 'fastify'
    }

    // Check for Hono in code structure
    const indexPath = join(projectPath, 'src', 'index.ts')
    if (existsSync(indexPath)) {
      const content = readFileSync(indexPath, 'utf-8')
      if (content.includes("from 'hono'") || content.includes('from "hono"')) {
        return 'hono'
      }
      if (
        content.includes("require('express')") ||
        content.includes('require("express")')
      ) {
        return 'express'
      }
      if (
        content.includes("from 'fastify'") ||
        content.includes('from "fastify"')
      ) {
        return 'fastify'
      }
    }
  } catch (_error) {
    // If we can't read package.json, return null
  }

  return null
}

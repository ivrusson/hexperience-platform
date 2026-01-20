import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/**
 * Find the user's project directory (where they are working)
 * Looks for indicators like package.json, .hexp/ directory, or src/ directory
 */
export async function findUserProject(
  startDir: string = process.cwd()
): Promise<string | null> {
  let currentDir = resolve(startDir)
  const root = resolve('/')

  while (currentDir !== root) {
    // Check for Hexperience project indicators
    const hexpDir = join(currentDir, '.hexp')
    const packageJson = join(currentDir, 'package.json')
    const srcDir = join(currentDir, 'src')

    // If we find .hexp directory, this is likely a Hexperience project
    if (existsSync(hexpDir)) {
      return currentDir
    }

    // If we find package.json and src/, it might be a project
    if (existsSync(packageJson) && existsSync(srcDir)) {
      // Check if package.json has hexperience-related dependencies
      try {
        const { readFileSync } = await import('node:fs')
        const pkg = JSON.parse(readFileSync(packageJson, 'utf-8'))
        const deps = { ...pkg.dependencies, ...pkg.devDependencies }

        // Check for common Hexperience stack indicators
        if (deps['drizzle-orm'] || deps['hono'] || deps['@hono/jwt']) {
          return currentDir
        }
      } catch {
        // If we can't read package.json, continue searching
      }
    }

    // Move up one directory
    const parentDir = dirname(currentDir)
    if (parentDir === currentDir) {
      break // Reached root
    }
    currentDir = parentDir
  }

  return null
}

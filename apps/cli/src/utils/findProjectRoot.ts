import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Find the project root directory containing templates/
 * Searches upward from current directory, then from CLI executable location
 */
export function findProjectRoot(): string | null {
  // First, try searching upward from current working directory
  let currentDir = process.cwd()
  const root = resolve('/')

  while (currentDir !== root) {
    const templatesDir = join(currentDir, 'templates')
    const basesDir = join(templatesDir, 'bases')

    if (existsSync(basesDir)) {
      return currentDir
    }

    // Move up one directory
    const parentDir = dirname(currentDir)
    if (parentDir === currentDir) {
      break // Reached root
    }
    currentDir = parentDir
  }

  // If not found, try relative to the CLI executable
  try {
    // Get the directory of the current module (dist/index.js)
    const currentFile = fileURLToPath(import.meta.url)
    const distDir = dirname(currentFile)

    // Try going up from dist/ to find templates/
    // dist/index.js -> apps/cli/dist -> apps/cli -> hexperience-platform
    let searchDir = distDir
    for (let i = 0; i < 5; i++) {
      const templatesDir = join(searchDir, 'templates')
      const basesDir = join(templatesDir, 'bases')

      if (existsSync(basesDir)) {
        return searchDir
      }

      const parentDir = dirname(searchDir)
      if (parentDir === searchDir) {
        break
      }
      searchDir = parentDir
    }
  } catch {
    // If import.meta.url is not available, skip this approach
  }

  return null
}

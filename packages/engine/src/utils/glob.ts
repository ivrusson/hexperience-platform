import { readdir } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import fg from 'fast-glob'

/**
 * Check if a path pattern contains glob characters
 */
export function isGlobPattern(pattern: string): boolean {
  return /[*?{}[\]]/.test(pattern)
}

/**
 * Expand glob pattern to array of file paths
 */
export async function expandGlob(
  pattern: string,
  baseDir: string
): Promise<string[]> {
  const resolvedBase = resolve(baseDir)

  // For glob patterns, we should use the pattern as-is relative to baseDir
  // Don't resolve the pattern if it contains glob characters, as that breaks glob matching
  const isGlob = isGlobPattern(pattern)

  // Use fast-glob to expand the pattern
  // If it's a glob, use the pattern relative to baseDir
  // Otherwise, resolve it to an absolute path
  const files = await fg(isGlob ? pattern : resolve(resolvedBase, pattern), {
    cwd: resolvedBase,
    absolute: true,
    onlyFiles: true,
    dot: true,
  })

  return files.sort()
}

/**
 * Get relative path from base directory
 */
export function getRelativePath(absolutePath: string, baseDir: string): string {
  return relative(resolve(baseDir), absolutePath)
}

/**
 * Recursively get all files in a directory
 */
export async function getAllFiles(
  dir: string,
  baseDir?: string
): Promise<string[]> {
  const resolvedDir = resolve(dir)
  const _resolvedBase = baseDir ? resolve(baseDir) : resolvedDir
  const files: string[] = []

  async function traverse(currentDir: string): Promise<void> {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name)

        if (entry.isDirectory()) {
          await traverse(fullPath)
        } else if (entry.isFile()) {
          files.push(fullPath)
        }
      }
    } catch (_error) {
      // Ignore errors (e.g., permission denied)
    }
  }

  await traverse(resolvedDir)
  return files.sort()
}

import { readdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { AddonTemplate, BaseTemplate } from '@hexp/shared'
import { ManifestLoader } from './loader.js'

/**
 * Result of scanning templates
 */
export interface CatalogResult {
  /** Successfully loaded base templates */
  bases: BaseTemplate[]
  /** Successfully loaded addon templates */
  addons: AddonTemplate[]
  /** Errors encountered during scanning (one per failed template) */
  errors: Array<{
    path: string
    error: string
  }>
}

/**
 * Recursively finds all manifest.json files in a directory
 */
async function findManifestFiles(
  dir: string,
  baseDir: string
): Promise<string[]> {
  const manifestFiles: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      const subManifests = await findManifestFiles(fullPath, baseDir)
      manifestFiles.push(...subManifests)
    } else if (entry.isFile() && entry.name === 'manifest.json') {
      manifestFiles.push(fullPath)
    }
  }

  return manifestFiles
}

/**
 * Resolves and scans templates from the filesystem
 */
export class CatalogResolver {
  /**
   * Scan templates from the base directory
   * @param baseDir - Base directory containing templates/bases/ and templates/addons/
   * @returns Catalog result with bases, addons, and any errors
   */
  static async scanTemplates(baseDir: string): Promise<CatalogResult> {
    const resolvedBaseDir = resolve(baseDir)
    const basesDir = join(resolvedBaseDir, 'templates', 'bases')
    const addonsDir = join(resolvedBaseDir, 'templates', 'addons')

    const result: CatalogResult = {
      bases: [],
      addons: [],
      errors: [],
    }

    // Scan bases directory
    try {
      const basesStat = await stat(basesDir)
      if (basesStat.isDirectory()) {
        const baseManifests = await findManifestFiles(basesDir, basesDir)
        for (const manifestPath of baseManifests) {
          try {
            const template = await ManifestLoader.load(manifestPath)
            if (template.type === 'base') {
              result.bases.push(template)
            } else {
              result.errors.push({
                path: manifestPath,
                error: `Expected base template but got type: ${template.type}`,
              })
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error)
            result.errors.push({
              path: manifestPath,
              error: errorMessage,
            })
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or isn't accessible - add to errors but continue
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        result.errors.push({
          path: basesDir,
          error: 'Bases directory not found',
        })
      } else {
        result.errors.push({
          path: basesDir,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Scan addons directory
    try {
      const addonsStat = await stat(addonsDir)
      if (addonsStat.isDirectory()) {
        const addonManifests = await findManifestFiles(addonsDir, addonsDir)
        for (const manifestPath of addonManifests) {
          try {
            const template = await ManifestLoader.load(manifestPath)
            if (template.type === 'addon') {
              result.addons.push(template)
            } else {
              result.errors.push({
                path: manifestPath,
                error: `Expected addon template but got type: ${template.type}`,
              })
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error)
            result.errors.push({
              path: manifestPath,
              error: errorMessage,
            })
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or isn't accessible - add to errors but continue
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        result.errors.push({
          path: addonsDir,
          error: 'Addons directory not found',
        })
      } else {
        result.errors.push({
          path: addonsDir,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return result
  }
}

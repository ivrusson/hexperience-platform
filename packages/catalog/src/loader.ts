import { readFile } from 'node:fs/promises'
import type { AddonTemplate, BaseTemplate } from '@hexp/shared'
import {
  ManifestNotFoundError,
  ManifestParseError,
  ManifestValidationError,
} from './errors.js'
import {
  AddonTemplateSchema,
  BaseTemplateSchema,
  ManifestSchema,
} from './schemas/manifest.schema.js'

/**
 * Loads and validates a manifest file from the filesystem
 */
export class ManifestLoader {
  /**
   * Load a manifest from a file path
   * @param manifestPath - Path to the manifest.json file
   * @returns Validated template (BaseTemplate or AddonTemplate)
   * @throws ManifestNotFoundError if file doesn't exist
   * @throws ManifestParseError if JSON is invalid
   * @throws ManifestValidationError if schema validation fails
   */
  static async load(
    manifestPath: string
  ): Promise<BaseTemplate | AddonTemplate> {
    // Read file
    let fileContent: string
    try {
      fileContent = await readFile(manifestPath, 'utf-8')
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        throw new ManifestNotFoundError(manifestPath)
      }
      throw new ManifestParseError(manifestPath, error as Error)
    }

    // Parse JSON
    let rawManifest: unknown
    try {
      rawManifest = JSON.parse(fileContent)
    } catch (error) {
      throw new ManifestParseError(manifestPath, error as Error)
    }

    // Validate with appropriate schema based on type
    try {
      // First validate it's a valid manifest structure
      const manifest = ManifestSchema.parse(rawManifest)

      // Then validate with specific schema based on type
      if (manifest.type === 'base') {
        return BaseTemplateSchema.parse(rawManifest) as BaseTemplate
      }

      return AddonTemplateSchema.parse(rawManifest) as AddonTemplate
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as {
          issues: Array<{ path: (string | number)[]; message: string }>
        }
        const fieldErrors: Record<string, string[]> = {}

        for (const issue of zodError.issues) {
          const fieldPath = issue.path.join('.')
          if (!fieldErrors[fieldPath]) {
            fieldErrors[fieldPath] = []
          }
          fieldErrors[fieldPath].push(issue.message)
        }

        throw new ManifestValidationError(
          manifestPath,
          fieldErrors,
          error as Error
        )
      }

      throw new ManifestValidationError(
        manifestPath,
        {
          _general: [
            error instanceof Error ? error.message : 'Unknown validation error',
          ],
        },
        error as Error
      )
    }
  }
}

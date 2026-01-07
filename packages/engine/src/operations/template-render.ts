import { existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import type {
  ExecutionContext,
  OperationResult,
  TemplateRenderOperation,
} from '@hexp/shared'
import { OperationError } from '../errors.js'
import { expandGlob, getAllFiles, isGlobPattern } from '../utils/glob.js'
import { renderTemplate } from '../renderer/template-renderer.js'

export async function executeTemplateRender(
  operation: TemplateRenderOperation,
  context: ExecutionContext
): Promise<OperationResult> {
  try {
    const filesAffected: string[] = []

    // Check if the pattern is a glob
    if (isGlobPattern(operation.from)) {
      // Expand glob pattern
      const sourceFiles = await expandGlob(
        operation.from,
        context.templateRoot
      )

      if (sourceFiles.length === 0) {
        throw new OperationError(
          `No files found matching pattern: ${operation.from}`,
          operation.type,
          { operation }
        )
      }

      // Process each file
      for (const sourceFile of sourceFiles) {
        // Get relative path from template root
        let relativePath = relative(context.templateRoot, sourceFile)

        // If the source pattern is "template/**", remove "template/" prefix from relative path
        // This ensures files from template/ go to the root, not to template/ in destination
        if (operation.from.startsWith('template/')) {
          const templatePrefix = 'template/'
          if (relativePath.startsWith(templatePrefix)) {
            relativePath = relativePath.slice(templatePrefix.length)
          }
        }

        // Determine destination path
        // If 'to' is a directory (ends with / or .), append the relative path
        // Otherwise, use 'to' as the destination file
        let destPath: string
        if (operation.to === '.' || operation.to.endsWith('/')) {
          // Destination is a directory, preserve structure (but without template/ prefix)
          destPath = join(context.workspaceRoot, operation.to, relativePath)
        } else {
          // Single file destination (use first file only, or error if multiple)
          if (sourceFiles.length > 1) {
            throw new OperationError(
              `Multiple files match pattern ${operation.from}, but destination is a single file: ${operation.to}`,
              operation.type,
              { operation, filesFound: sourceFiles.length }
            )
          }
          destPath = resolve(context.workspaceRoot, operation.to)
        }

        await renderTemplate(sourceFile, destPath, context.variables)
        filesAffected.push(relative(context.workspaceRoot, destPath))
      }
    } else {
      // Single file (non-glob pattern)
      const sourcePath = resolve(context.templateRoot, operation.from)
      const destPath = resolve(context.workspaceRoot, operation.to)

      if (!existsSync(sourcePath)) {
        throw new OperationError(
          `Template source file does not exist: ${operation.from}`,
          operation.type,
          { sourcePath, operation }
        )
      }

      await renderTemplate(sourcePath, destPath, context.variables)
      filesAffected.push(operation.to)
    }

    return { success: true, filesAffected }
  } catch (error) {
    if (error instanceof OperationError) throw error
    throw new OperationError(
      `Failed to render template from ${operation.from} to ${operation.to}: ${error instanceof Error ? error.message : String(error)}`,
      operation.type,
      { error, operation }
    )
  }
}

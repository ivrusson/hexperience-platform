import { existsSync } from 'node:fs'
import { copyFile, mkdir, stat } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import type {
  CopyOperation,
  ExecutionContext,
  OperationResult,
} from '@hexp/shared'
import { OperationError } from '../errors'
import { expandGlob, isGlobPattern } from '../utils/glob'

export async function executeCopy(
  operation: CopyOperation,
  context: ExecutionContext
): Promise<OperationResult> {
  try {
    const filesAffected: string[] = []

    // Check if the pattern is a glob
    if (isGlobPattern(operation.from)) {
      // Expand glob pattern
      const sourceFiles = await expandGlob(operation.from, context.templateRoot)

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
        // If 'to' is a directory (ends with / or .), or if we have multiple source files,
        // treat it as a directory and append the relative path
        // Otherwise, use 'to' as the destination file
        let destPath: string
        const isMultipleFiles = sourceFiles.length > 1
        if (
          operation.to === '.' ||
          operation.to.endsWith('/') ||
          isMultipleFiles
        ) {
          // Destination is a directory, preserve structure (but without template/ prefix)
          if (operation.to === '.') {
            destPath = join(context.workspaceRoot, relativePath)
          } else {
            destPath = join(context.workspaceRoot, operation.to, relativePath)
          }
        } else {
          // Single file destination (use first file only)
          destPath = resolve(context.workspaceRoot, operation.to)
        }

        // Check if destination exists
        if (existsSync(destPath) && !operation.overwrite) {
          throw new OperationError(
            `Destination file already exists: ${relative(context.workspaceRoot, destPath)}. Use overwrite: true to replace it.`,
            operation.type,
            { destPath, operation }
          )
        }

        // Create destination directory if needed
        const destDir = dirname(destPath)
        if (!existsSync(destDir)) {
          await mkdir(destDir, { recursive: true })
        }

        // Copy file
        await copyFile(sourceFile, destPath)
        filesAffected.push(relative(context.workspaceRoot, destPath))
      }
    } else {
      // Single file (non-glob pattern)
      const sourcePath = resolve(context.templateRoot, operation.from)
      const destPath = resolve(context.workspaceRoot, operation.to)

      if (!existsSync(sourcePath)) {
        throw new OperationError(
          `Source file does not exist: ${operation.from}`,
          operation.type,
          { sourcePath, operation }
        )
      }

      if (existsSync(destPath) && !operation.overwrite) {
        throw new OperationError(
          `Destination file already exists: ${operation.to}. Use overwrite: true to replace it.`,
          operation.type,
          { destPath, operation }
        )
      }

      const destDir = dirname(destPath)
      if (!existsSync(destDir)) {
        await mkdir(destDir, { recursive: true })
      }

      const sourceStat = await stat(sourcePath)
      if (sourceStat.isDirectory()) {
        throw new OperationError(
          `Copying directories is not yet supported. Source is a directory: ${operation.from}`,
          operation.type,
          { sourcePath, operation }
        )
      }

      await copyFile(sourcePath, destPath)
      filesAffected.push(operation.to)
    }

    return {
      success: true,
      filesAffected,
    }
  } catch (error) {
    if (error instanceof OperationError) {
      throw error
    }
    throw new OperationError(
      `Failed to copy file from ${operation.from} to ${operation.to}: ${error instanceof Error ? error.message : String(error)}`,
      operation.type,
      { error, operation }
    )
  }
}

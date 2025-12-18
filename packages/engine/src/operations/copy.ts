import { existsSync } from 'node:fs'
import { copyFile, mkdir, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type {
  CopyOperation,
  ExecutionContext,
  OperationResult,
} from '@hexp/shared'
import { OperationError } from '../errors.js'

export async function executeCopy(
  operation: CopyOperation,
  context: ExecutionContext
): Promise<OperationResult> {
  try {
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

    return {
      success: true,
      filesAffected: [operation.to],
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

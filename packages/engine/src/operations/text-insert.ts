import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type {
  ExecutionContext,
  OperationResult,
  TextInsertOperation,
} from '@hexp/shared'
import { OperationError } from '../errors.js'

export async function executeTextInsert(
  operation: TextInsertOperation,
  context: ExecutionContext
): Promise<OperationResult> {
  try {
    const targetPath = resolve(context.workspaceRoot, operation.target)
    if (!existsSync(targetPath)) {
      throw new OperationError(
        `Target file does not exist: ${operation.target}`,
        operation.type,
        { targetPath, operation }
      )
    }
    const content = await readFile(targetPath, 'utf-8')
    const markerIndex = content.indexOf(operation.marker)
    if (markerIndex === -1) {
      throw new OperationError(
        `Marker not found in file: ${operation.marker}`,
        operation.type,
        { targetPath, marker: operation.marker, operation }
      )
    }
    const insertPosition =
      operation.position === 'before'
        ? markerIndex
        : markerIndex + operation.marker.length
    const newContent =
      content.slice(0, insertPosition) +
      operation.content +
      content.slice(insertPosition)
    await writeFile(targetPath, newContent, 'utf-8')
    return { success: true, filesAffected: [operation.target] }
  } catch (error) {
    if (error instanceof OperationError) throw error
    throw new OperationError(
      `Failed to insert text in ${operation.target}: ${error instanceof Error ? error.message : String(error)}`,
      operation.type,
      { error, operation }
    )
  }
}

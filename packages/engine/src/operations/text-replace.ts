import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type {
  ExecutionContext,
  OperationResult,
  TextReplaceOperation,
} from '@hexp/shared'
import { OperationError } from '../errors.js'

export async function executeTextReplace(
  operation: TextReplaceOperation,
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
    let content = await readFile(targetPath, 'utf-8')
    if (operation.isRegex) {
      try {
        const regex = new RegExp(operation.pattern, 'g')
        content = content.replace(regex, operation.replacement)
      } catch (error) {
        throw new OperationError(
          `Invalid regex pattern: ${operation.pattern}`,
          operation.type,
          { pattern: operation.pattern, error, operation }
        )
      }
    } else {
      content = content.split(operation.pattern).join(operation.replacement)
    }
    await writeFile(targetPath, content, 'utf-8')
    return { success: true, filesAffected: [operation.target] }
  } catch (error) {
    if (error instanceof OperationError) throw error
    throw new OperationError(
      `Failed to replace text in ${operation.target}: ${error instanceof Error ? error.message : String(error)}`,
      operation.type,
      { error, operation }
    )
  }
}

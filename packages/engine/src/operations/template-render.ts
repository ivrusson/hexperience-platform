import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type {
  ExecutionContext,
  OperationResult,
  TemplateRenderOperation,
} from '@hexp/shared'
import { OperationError } from '../errors.js'
import { renderTemplate } from '../renderer/template-renderer.js'

export async function executeTemplateRender(
  operation: TemplateRenderOperation,
  context: ExecutionContext
): Promise<OperationResult> {
  try {
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
    return { success: true, filesAffected: [operation.to] }
  } catch (error) {
    if (error instanceof OperationError) throw error
    throw new OperationError(
      `Failed to render template from ${operation.from} to ${operation.to}: ${error instanceof Error ? error.message : String(error)}`,
      operation.type,
      { error, operation }
    )
  }
}

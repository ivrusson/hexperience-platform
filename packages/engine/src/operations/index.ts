import type { ExecutionContext, Operation, OperationResult } from '@hexp/shared'
import { executeCopy } from './copy.js'
import { executeJsonMerge } from './json-merge.js'
import { executeTemplateRender } from './template-render.js'
import { executeTextInsert } from './text-insert.js'
import { executeTextReplace } from './text-replace.js'

export async function executeOperation(
  operation: Operation,
  context: ExecutionContext
): Promise<OperationResult> {
  switch (operation.type) {
    case 'copy':
      return executeCopy(operation, context)
    case 'templateRender':
      return executeTemplateRender(operation, context)
    case 'jsonMerge':
      return executeJsonMerge(operation, context)
    case 'textInsert':
      return executeTextInsert(operation, context)
    case 'textReplace':
      return executeTextReplace(operation, context)
    default: {
      const _exhaustive: never = operation
      throw new Error(
        `Unknown operation type: ${(_exhaustive as Operation).type}`
      )
    }
  }
}

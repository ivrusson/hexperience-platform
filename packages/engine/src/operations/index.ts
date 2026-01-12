import type { ExecutionContext, Operation, OperationResult } from '@hexp/shared'
import { executeCodemod } from './codemod'
import { executeCopy } from './copy'
import { executeEnvAppend } from './env-append'
import { executeJsonMerge } from './json-merge'
import { executeTemplateRender } from './template-render'
import { executeTextInsert } from './text-insert'
import { executeTextReplace } from './text-replace'

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
    case 'codemod':
      return executeCodemod(operation, context)
    case 'envAppend':
      return executeEnvAppend(operation, context)
    default: {
      const _exhaustive: never = operation
      throw new Error(
        `Unknown operation type: ${(_exhaustive as Operation).type}`
      )
    }
  }
}

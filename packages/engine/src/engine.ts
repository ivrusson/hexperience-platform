import type {
  ExecutionContext,
  Operation,
  OperationResult,
  Workspace,
} from '@hexp/shared'
import { OperationError } from './errors.js'
import { executeOperation } from './operations/index.js'

export interface TemplateWithOps {
  templateDir: string
  ops?: Operation[]
}

export class Engine {
  private workspace: Workspace
  private context: ExecutionContext
  constructor(workspace: Workspace, context: ExecutionContext) {
    this.workspace = workspace
    this.context = context
  }
  async applyBase(base: TemplateWithOps): Promise<OperationResult[]> {
    const results: OperationResult[] = []
    const baseContext: ExecutionContext = {
      ...this.context,
      templateRoot: base.templateDir,
    }
    for (const operation of base.ops || []) {
      try {
        const result = await executeOperation(operation, baseContext)
        results.push(result)
      } catch (error) {
        throw new OperationError(
          `Failed to apply base template operation: ${error instanceof Error ? error.message : String(error)}`,
          operation.type,
          { base, operation, error }
        )
      }
    }
    return results
  }
  async applyAddon(addon: TemplateWithOps): Promise<OperationResult[]> {
    const results: OperationResult[] = []
    const addonContext: ExecutionContext = {
      ...this.context,
      templateRoot: addon.templateDir,
    }
    for (const operation of addon.ops || []) {
      try {
        const result = await executeOperation(operation, addonContext)
        results.push(result)
      } catch (error) {
        throw new OperationError(
          `Failed to apply addon operation: ${error instanceof Error ? error.message : String(error)}`,
          operation.type,
          { addon, operation, error }
        )
      }
    }
    return results
  }
  async compose(
    base: TemplateWithOps,
    addons: TemplateWithOps[]
  ): Promise<OperationResult[]> {
    const allResults: OperationResult[] = []
    if (!this.workspace.exists()) {
      await this.workspace.create()
    }
    const baseResults = await this.applyBase(base)
    allResults.push(...baseResults)
    for (const addon of addons) {
      const addonResults = await this.applyAddon(addon)
      allResults.push(...addonResults)
    }
    return allResults
  }
}

export function createEngine(
  workspace: Workspace,
  context: ExecutionContext
): Engine {
  return new Engine(workspace, context)
}

import type { PostStep, PostStepResult, PostStepType } from '@hexp/shared'
import { executeFormatCode } from './format-code'
import { executeGenerateDocs } from './generate-docs'
import { executeGitInit } from './git-init'
import { executeInstallDependencies } from './install-dependencies'
import { executeLintCode } from './lint-code'
import { executeTypeCheck } from './type-check'

export async function executePostStep(
  step: PostStep,
  workspaceRoot: string,
  context: Record<string, unknown>
): Promise<PostStepResult> {
  // Skip if disabled
  if (step.enabled === false) {
    return {
      success: true,
      message: `Post-step ${step.type} is disabled, skipping`,
    }
  }

  switch (step.type) {
    case 'installDependencies':
      return executeInstallDependencies(workspaceRoot, step.options || {})
    case 'formatCode':
      return executeFormatCode(workspaceRoot, step.options || {})
    case 'lintCode':
      return executeLintCode(workspaceRoot, step.options || {})
    case 'typeCheck':
      return executeTypeCheck(workspaceRoot, step.options || {})
    case 'gitInit':
      return executeGitInit(workspaceRoot, step.options || {})
    case 'generateDocs':
      return executeGenerateDocs(workspaceRoot, context, step.options || {})
    default: {
      const _exhaustive: never = step as never
      throw new Error(`Unknown post-step type: ${(step as PostStep).type}`)
    }
  }
}

export type { PostStep, PostStepResult, PostStepType }

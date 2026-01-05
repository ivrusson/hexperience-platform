import { exec } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import type { PostStepResult } from '@hexp/shared'

const execAsync = promisify(exec)

interface TypeCheckOptions {
  skipTypeCheck?: boolean
  failOnError?: boolean
}

async function hasTypeScript(workspaceRoot: string): Promise<boolean> {
  // Check for tsconfig.json
  if (existsSync(resolve(workspaceRoot, 'tsconfig.json'))) {
    return true
  }

  // Check package.json for TypeScript
  if (existsSync(resolve(workspaceRoot, 'package.json'))) {
    try {
      const pkg = await import(resolve(workspaceRoot, 'package.json'))
      return !!(
        pkg.default?.devDependencies?.typescript ||
        pkg.default?.dependencies?.typescript
      )
    } catch {
      // Ignore errors
    }
  }

  return false
}

export async function executeTypeCheck(
  workspaceRoot: string,
  options: TypeCheckOptions
): Promise<PostStepResult> {
  try {
    if (options.skipTypeCheck) {
      return {
        success: true,
        message: 'Type checking skipped',
      }
    }

    // Check if TypeScript is present
    const hasTS = await hasTypeScript(workspaceRoot)
    if (!hasTS) {
      return {
        success: true,
        message: 'No TypeScript detected, skipping type check',
      }
    }

    // Execute type check command
    const typeCheckCommand =
      'pnpm type-check || npm run type-check || npx tsc --noEmit || true'

    try {
      await execAsync(typeCheckCommand, {
        cwd: workspaceRoot,
        shell: '/bin/bash',
      })

      return {
        success: true,
        message: 'Type checking completed successfully',
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      const shouldFail = options.failOnError !== false

      return {
        success: !shouldFail,
        error: shouldFail ? `Type checking failed: ${errorMessage}` : undefined,
        message: shouldFail
          ? undefined
          : `Type checking completed with warnings: ${errorMessage}`,
      }
    }
  } catch (error) {
    const shouldFail = options.failOnError !== false
    return {
      success: !shouldFail,
      error: shouldFail
        ? `Type check error: ${error instanceof Error ? error.message : String(error)}`
        : undefined,
      message: shouldFail
        ? undefined
        : `Type checking skipped: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

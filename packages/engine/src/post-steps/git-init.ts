import { exec } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import type { PostStepResult } from '@hexp/shared'

const execAsync = promisify(exec)

interface GitInitOptions {
  skipGitInit?: boolean
  createInitialCommit?: boolean
  commitMessage?: string
}

export async function executeGitInit(
  workspaceRoot: string,
  options: GitInitOptions
): Promise<PostStepResult> {
  try {
    if (options.skipGitInit) {
      return {
        success: true,
        message: 'Git initialization skipped',
      }
    }

    // Check if already a git repository
    if (existsSync(resolve(workspaceRoot, '.git'))) {
      return {
        success: true,
        message: 'Git repository already initialized',
      }
    }

    // Initialize git repository
    try {
      await execAsync('git init', {
        cwd: workspaceRoot,
      })

      let message = 'Git repository initialized successfully'

      // Create initial commit if requested
      if (options.createInitialCommit) {
        try {
          // Check if there are any files to commit
          const { stdout } = await execAsync('git status --porcelain', {
            cwd: workspaceRoot,
          })

          if (stdout.trim()) {
            await execAsync('git add .', {
              cwd: workspaceRoot,
            })

            const commitMsg =
              options.commitMessage ||
              'Initial commit from hexperience platform'
            await execAsync(`git commit -m "${commitMsg}"`, {
              cwd: workspaceRoot,
            })

            message = 'Git repository initialized and initial commit created'
          } else {
            message = 'Git repository initialized (no files to commit)'
          }
        } catch (commitError) {
          // Initial commit is optional, don't fail
          message = `Git repository initialized (commit failed: ${commitError instanceof Error ? commitError.message : String(commitError)})`
        }
      }

      return {
        success: true,
        message,
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize git repository: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Error during git initialization: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

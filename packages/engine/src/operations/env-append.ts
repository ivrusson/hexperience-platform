import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type {
  EnvAppendOperation,
  ExecutionContext,
  OperationResult,
} from '@hexp/shared'
import { OperationError } from '../errors'

export async function executeEnvAppend(
  operation: EnvAppendOperation,
  context: ExecutionContext
): Promise<OperationResult> {
  try {
    const envFile = operation.envFile || '.env'
    const targetPath = resolve(
      context.workspaceRoot,
      operation.target || envFile
    )

    // Read existing content if file exists
    let existingContent = ''
    if (existsSync(targetPath)) {
      existingContent = readFileSync(targetPath, 'utf-8')
    }

    // Parse existing variables to avoid duplicates
    const existingVars = new Map<string, string>()
    const lines = existingContent.split('\n')
    const newLines: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        newLines.push(line)
        continue
      }

      // Parse KEY=VALUE format
      const equalIndex = trimmed.indexOf('=')
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim()
        const value = trimmed.substring(equalIndex + 1).trim()
        existingVars.set(key, value)
        newLines.push(line)
      } else {
        newLines.push(line)
      }
    }

    // Append new variables that don't exist
    const addedVars: string[] = []
    for (const [key, value] of Object.entries(operation.variables)) {
      if (!existingVars.has(key)) {
        newLines.push(`${key}=${value}`)
        addedVars.push(key)
      }
    }

    // Write back to file
    const newContent = newLines.join('\n')
    writeFileSync(targetPath, newContent, 'utf-8')

    return {
      success: true,
      filesAffected: [operation.target || envFile],
    }
  } catch (error) {
    throw new OperationError(
      `Failed to append environment variables to ${operation.target}: ${error instanceof Error ? error.message : String(error)}`,
      operation.type,
      { error, operation }
    )
  }
}

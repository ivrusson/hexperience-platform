import { exec } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import type { PostStepResult } from '@hexp/shared'

const execAsync = promisify(exec)

interface FormatCodeOptions {
  formatter?: 'biome' | 'prettier'
  skipFormat?: boolean
}

async function detectFormatter(
  workspaceRoot: string
): Promise<'biome' | 'prettier' | null> {
  // Check for biome.json
  if (existsSync(resolve(workspaceRoot, 'biome.json'))) {
    return 'biome'
  }

  // Check for prettier config files
  const prettierConfigs = [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.js',
    '.prettierrc.mjs',
    '.prettierrc.cjs',
    'prettier.config.js',
    'prettier.config.mjs',
    'prettier.config.cjs',
  ]

  for (const config of prettierConfigs) {
    if (existsSync(resolve(workspaceRoot, config))) {
      return 'prettier'
    }
  }

  // Check package.json for formatter config
  if (existsSync(resolve(workspaceRoot, 'package.json'))) {
    try {
      const pkg = await import(resolve(workspaceRoot, 'package.json'))
      if (pkg.default?.biome || pkg.default?.dependencies?.biome) {
        return 'biome'
      }
      if (pkg.default?.prettier || pkg.default?.devDependencies?.prettier) {
        return 'prettier'
      }
    } catch {
      // Ignore errors
    }
  }

  return null
}

export async function executeFormatCode(
  workspaceRoot: string,
  options: FormatCodeOptions
): Promise<PostStepResult> {
  try {
    if (options.skipFormat) {
      return {
        success: true,
        message: 'Code formatting skipped',
      }
    }

    // Detect formatter
    let formatter: 'biome' | 'prettier' | null = options.formatter || null

    if (!formatter) {
      formatter = await detectFormatter(workspaceRoot)
    }

    if (!formatter) {
      return {
        success: true,
        message: 'No formatter detected, skipping format step',
      }
    }

    // Execute format command
    const formatCommand =
      formatter === 'biome'
        ? 'pnpm biome format --write . || npx biome format --write . || npm run format || true'
        : 'npx prettier --write . || npm run format || true'

    try {
      await execAsync(formatCommand, {
        cwd: workspaceRoot,
        shell: '/bin/bash',
      })

      return {
        success: true,
        message: `Code formatted successfully using ${formatter}`,
      }
    } catch (error) {
      // Formatting errors are usually non-critical
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return {
        success: true, // Still success, formatting is optional
        message: `Formatting completed with warnings: ${errorMessage}`,
      }
    }
  } catch (error) {
    return {
      success: true, // Formatting is optional, don't fail the build
      message: `Formatting skipped: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

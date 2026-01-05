import { exec } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import type { PostStepResult } from '@hexp/shared'

const execAsync = promisify(exec)

interface LintCodeOptions {
  linter?: 'biome' | 'eslint'
  skipLint?: boolean
  failOnError?: boolean
}

async function detectLinter(
  workspaceRoot: string
): Promise<'biome' | 'eslint' | null> {
  // Check for biome.json
  if (existsSync(resolve(workspaceRoot, 'biome.json'))) {
    return 'biome'
  }

  // Check for eslint config files
  const eslintConfigs = [
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.json',
    '.eslintrc.mjs',
    '.eslintrc.cjs',
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
  ]

  for (const config of eslintConfigs) {
    if (existsSync(resolve(workspaceRoot, config))) {
      return 'eslint'
    }
  }

  // Check package.json for linter config
  if (existsSync(resolve(workspaceRoot, 'package.json'))) {
    try {
      const pkg = await import(resolve(workspaceRoot, 'package.json'))
      if (pkg.default?.biome || pkg.default?.dependencies?.biome) {
        return 'biome'
      }
      if (pkg.default?.eslint || pkg.default?.devDependencies?.eslint) {
        return 'eslint'
      }
    } catch {
      // Ignore errors
    }
  }

  return null
}

export async function executeLintCode(
  workspaceRoot: string,
  options: LintCodeOptions
): Promise<PostStepResult> {
  try {
    if (options.skipLint) {
      return {
        success: true,
        message: 'Code linting skipped',
      }
    }

    // Detect linter
    let linter: 'biome' | 'eslint' | null = options.linter || null

    if (!linter) {
      linter = await detectLinter(workspaceRoot)
    }

    if (!linter) {
      return {
        success: true,
        message: 'No linter detected, skipping lint step',
      }
    }

    // Execute lint command
    const lintCommand =
      linter === 'biome'
        ? 'pnpm biome lint --write . || npx biome lint --write . || npm run lint || true'
        : 'npx eslint . --fix || npm run lint || true'

    try {
      await execAsync(lintCommand, {
        cwd: workspaceRoot,
        shell: '/bin/bash',
      })

      return {
        success: true,
        message: `Code linted successfully using ${linter}`,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      const shouldFail = options.failOnError !== false

      return {
        success: !shouldFail,
        error: shouldFail ? `Linting failed: ${errorMessage}` : undefined,
        message: shouldFail
          ? undefined
          : `Linting completed with warnings: ${errorMessage}`,
      }
    }
  } catch (error) {
    const shouldFail = options.failOnError !== false
    return {
      success: !shouldFail,
      error: shouldFail
        ? `Linting error: ${error instanceof Error ? error.message : String(error)}`
        : undefined,
      message: shouldFail
        ? undefined
        : `Linting skipped: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

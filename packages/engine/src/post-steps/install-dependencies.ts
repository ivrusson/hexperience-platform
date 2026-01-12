import { exec } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import type { PostStepResult } from '@hexp/shared'

const execAsync = promisify(exec)

type PackageManager = 'pnpm' | 'npm' | 'yarn'

interface InstallDependenciesOptions {
  packageManager?: PackageManager
  skipInstall?: boolean
}

async function detectPackageManager(
  workspaceRoot: string
): Promise<PackageManager | null> {
  // Check for lock files
  if (existsSync(resolve(workspaceRoot, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (existsSync(resolve(workspaceRoot, 'package-lock.json'))) {
    return 'npm'
  }
  if (existsSync(resolve(workspaceRoot, 'yarn.lock'))) {
    return 'yarn'
  }

  // Check for package.json to determine default
  if (existsSync(resolve(workspaceRoot, 'package.json'))) {
    // Default to pnpm if available, otherwise npm
    try {
      await execAsync('pnpm --version', { cwd: workspaceRoot })
      return 'pnpm'
    } catch {
      try {
        await execAsync('npm --version', { cwd: workspaceRoot })
        return 'npm'
      } catch {
        return null
      }
    }
  }

  return null
}

export async function executeInstallDependencies(
  workspaceRoot: string,
  options: InstallDependenciesOptions
): Promise<PostStepResult> {
  try {
    if (options.skipInstall) {
      return {
        success: true,
        message: 'Dependency installation skipped',
      }
    }

    // Detect package manager
    let packageManager: PackageManager | null = options.packageManager || null

    if (!packageManager) {
      packageManager = await detectPackageManager(workspaceRoot)
    }

    if (!packageManager) {
      return {
        success: false,
        error: 'No package manager detected and none specified',
      }
    }

    // Check if package.json exists
    if (!existsSync(resolve(workspaceRoot, 'package.json'))) {
      return {
        success: false,
        error: 'package.json not found',
      }
    }

    // Execute install command
    const installCommand =
      packageManager === 'pnpm'
        ? 'pnpm install'
        : packageManager === 'yarn'
          ? 'yarn install'
          : 'npm install'

    try {
      await execAsync(installCommand, {
        cwd: workspaceRoot,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      })

      return {
        success: true,
        message: `Dependencies installed successfully using ${packageManager}`,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: `Failed to install dependencies: ${errorMessage}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Error during dependency installation: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

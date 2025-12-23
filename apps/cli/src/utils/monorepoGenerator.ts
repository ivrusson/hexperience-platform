import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Generate turbo.json configuration file
 */
export async function generateTurboJson(outputDir: string): Promise<void> {
  const turboJson = {
    $schema: 'https://turborepo.com/schema.json',
    tasks: {
      build: {
        dependsOn: ['^build'],
        outputs: ['dist/**'],
      },
      dev: {
        cache: false,
        persistent: true,
      },
      lint: {
        outputs: [],
      },
      format: {
        outputs: [],
      },
      'type-check': {
        dependsOn: ['^type-check'],
        outputs: [],
      },
      test: {
        outputs: ['coverage/**'],
      },
      clean: {
        cache: false,
      },
    },
  }

  await writeFile(
    join(outputDir, 'turbo.json'),
    JSON.stringify(turboJson, null, 2) + '\n'
  )
}

/**
 * Generate pnpm-workspace.yaml file
 */
export async function generatePnpmWorkspace(outputDir: string): Promise<void> {
  const workspaceYaml = `packages:
  - 'apps/*'
  - 'packages/*'

`

  await writeFile(join(outputDir, 'pnpm-workspace.yaml'), workspaceYaml)
}

/**
 * Generate basic monorepo directory structure
 */
export async function generateMonorepoStructure(
  outputDir: string
): Promise<void> {
  await mkdir(join(outputDir, 'apps'), { recursive: true })
  await mkdir(join(outputDir, 'packages'), { recursive: true })
}

/**
 * Generate tsconfig.json with project references for monorepo
 */
export async function generateMonorepoTsConfig(
  outputDir: string
): Promise<void> {
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      lib: ['ES2022'],
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      allowJs: true,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      isolatedModules: true,
    },
    files: [],
    references: [],
  }

  await writeFile(
    join(outputDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2) + '\n'
  )
}

/**
 * Generate all monorepo files and structure
 */
export async function generateMonorepoFiles(outputDir: string): Promise<void> {
  await generateMonorepoStructure(outputDir)
  await generateTurboJson(outputDir)
  await generatePnpmWorkspace(outputDir)
  await generateMonorepoTsConfig(outputDir)
}

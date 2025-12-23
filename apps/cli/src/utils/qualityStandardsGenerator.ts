import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import deepmerge from 'deepmerge'

/**
 * Generate .lefthook.yml configuration file
 */
export async function generateLefthookConfig(outputDir: string): Promise<void> {
  const lefthookYml = `pre-commit:
  parallel: true
  commands:
    biome:
      run: pnpm biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
      stage_fixed: true
      glob: "*.{js,jsx,ts,tsx,json,jsonc}"

commit-msg:
  commands:
    commitlint:
      run: pnpm commitlint --edit {1}

pre-push:
  commands:
    type-check:
      run: pnpm type-check
      glob: "*.{ts,tsx}"

`

  await writeFile(join(outputDir, '.lefthook.yml'), lefthookYml)
}

/**
 * Generate commitlint.config.ts
 */
export async function generateCommitlintConfig(
  outputDir: string
): Promise<void> {
  const commitlintConfig = `import type { UserConfig } from '@commitlint/types'

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 100],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'translation',
        'security',
        'changeset',
      ],
    ],
  },
}

export default Configuration
`

  await writeFile(join(outputDir, 'commitlint.config.ts'), commitlintConfig)
}

/**
 * Generate biome.json configuration file
 */
export async function generateBiomeConfig(outputDir: string): Promise<void> {
  const biomeJson = {
    $schema: 'https://biomejs.dev/schemas/2.3.10/schema.json',
    vcs: {
      enabled: true,
      clientKind: 'git',
      useIgnoreFile: true,
    },
    linter: {
      enabled: true,
      rules: {
        recommended: true,
        correctness: {
          noUnusedVariables: 'error',
          noUnusedImports: 'error',
        },
        suspicious: {
          noConsole: 'warn',
        },
      },
    },
    formatter: {
      enabled: true,
      lineWidth: 80,
      indentStyle: 'space',
      indentWidth: 2,
      lineEnding: 'lf',
      formatWithErrors: false,
    },
    javascript: {
      formatter: {
        semicolons: 'asNeeded',
        trailingCommas: 'es5',
        quoteStyle: 'single',
        arrowParentheses: 'always',
        bracketSameLine: false,
        bracketSpacing: true,
        jsxQuoteStyle: 'double',
        quoteProperties: 'asNeeded',
      },
    },
    json: {
      formatter: {
        trailingCommas: 'none',
      },
      parser: {
        allowComments: true,
      },
    },
    files: {
      ignoreUnknown: false,
      experimentalScannerIgnores: [
        'node_modules',
        'dist',
        'build',
        '.turbo',
        'coverage',
        '*.tsbuildinfo',
      ],
    },
  }

  await writeFile(
    join(outputDir, 'biome.json'),
    `${JSON.stringify(biomeJson, null, 2)}\n`
  )
}

/**
 * Generate .gitignore file with standard patterns
 */
export async function generateGitignore(outputDir: string): Promise<void> {
  const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.lcov

# Production
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Turbo
.turbo

# OS
Thumbs.db

`

  await writeFile(join(outputDir, '.gitignore'), gitignore)
}

/**
 * Generate or update package.json with quality scripts
 */
export async function generatePackageJsonScripts(
  outputDir: string,
  projectName?: string
): Promise<void> {
  const packageJsonPath = join(outputDir, 'package.json')
  const qualityScripts = {
    scripts: {
      lint: 'biome check .',
      format: 'biome format --write .',
      'type-check': 'tsc --noEmit',
      check: 'pnpm lint && pnpm format && pnpm type-check',
    },
  }

  let existingPackageJson: Record<string, unknown> = {}
  if (existsSync(packageJsonPath)) {
    try {
      const content = await readFile(packageJsonPath, 'utf-8')
      existingPackageJson = JSON.parse(content) as Record<string, unknown>
    } catch (error) {
      throw new Error(
        `Failed to parse existing package.json: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  } else {
    // Create basic package.json if it doesn't exist
    existingPackageJson = {
      name: projectName || 'project',
      version: '0.0.0',
      type: 'module',
    }
  }

  // Merge scripts
  const merged = deepmerge(existingPackageJson, qualityScripts)
  const formattedJson = `${JSON.stringify(merged, null, 2)}\n`
  await writeFile(packageJsonPath, formattedJson, 'utf-8')
}

/**
 * Generate README.md with quality standards documentation
 */
export async function generateReadme(
  outputDir: string,
  projectName: string
): Promise<void> {
  const readmePath = join(outputDir, 'README.md')
  const readmeContent = `# ${projectName}

A project generated with Hexperience Platform.

## Setup

\`\`\`bash
pnpm install
\`\`\`

## Quality Standards

This project follows strict quality standards to ensure code consistency and maintainability.

### Git Hooks (LeftHook)

Git hooks are configured using [LeftHook](https://github.com/evilmartians/lefthook) to enforce quality checks:

- **pre-commit**: Runs Biome check and format on staged files
- **commit-msg**: Validates commit messages using commit-lint
- **pre-push**: Runs type-check before pushing

### Commit Messages (commit-lint)

Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

\`\`\`
<type>(<scope>): <subject>

[optional body]

[optional footer]
\`\`\`

**Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

### Code Quality (Biome)

Code formatting and linting are handled by [Biome](https://biomejs.dev/):

- **Formatter**: Consistent code style (2 spaces, single quotes, etc.)
- **Linter**: Catches common errors and enforces best practices
- **VCS Integration**: Automatically formats staged files

## Scripts

- \`pnpm lint\`: Check code for linting errors
- \`pnpm format\`: Format code with Biome
- \`pnpm type-check\`: Run TypeScript type checking
- \`pnpm check\`: Run all quality checks (lint, format, type-check)

## Next Steps

1. Review and customize the configuration files:
   - \`biome.json\`: Adjust formatting and linting rules
   - \`commitlint.config.ts\`: Customize commit message rules
   - \`.lefthook.yml\`: Modify git hooks as needed

2. Start developing:
   \`\`\`bash
   pnpm dev
   \`\`\`

3. Make your first commit following the conventional commits format.

`

  await writeFile(readmePath, readmeContent, 'utf-8')
}

/**
 * Generate all quality standards files
 */
export async function generateQualityStandards(
  outputDir: string,
  projectName?: string
): Promise<void> {
  await generateLefthookConfig(outputDir)
  await generateCommitlintConfig(outputDir)
  await generateBiomeConfig(outputDir)
  await generateGitignore(outputDir)
  await generatePackageJsonScripts(outputDir, projectName)
  if (projectName) {
    await generateReadme(outputDir, projectName)
  }
}

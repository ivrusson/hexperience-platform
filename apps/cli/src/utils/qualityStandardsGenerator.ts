import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

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
    JSON.stringify(biomeJson, null, 2) + '\n'
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
 * Generate all quality standards files
 */
export async function generateQualityStandards(
  outputDir: string
): Promise<void> {
  await generateLefthookConfig(outputDir)
  await generateCommitlintConfig(outputDir)
  await generateBiomeConfig(outputDir)
  await generateGitignore(outputDir)
}

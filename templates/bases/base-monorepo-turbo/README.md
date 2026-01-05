# base-monorepo-turbo

A monorepo template with Turbo, pnpm workspaces, Biome, commitlint, and LeftHook.

## Capabilities

- `monorepo`: Monorepo structure with apps and packages
- `typescript`: TypeScript support with project references
- `turbo`: Turbo for build orchestration and caching
- `pnpm`: pnpm workspace support

## Project Type

- `monorepo`: Monorepo project structure

## Variables

- `projectName`: Name of the project (automatically provided)

## Usage

This template creates a monorepo with:

- **Turbo**: Build system with caching and task orchestration
- **pnpm workspaces**: Package management with workspaces
- **Biome**: Fast formatter and linter
- **commitlint**: Commit message validation
- **LeftHook**: Git hooks management
- **TypeScript**: TypeScript configuration with project references

## Structure

```
{{projectName}}/
├── apps/          # Applications
├── packages/       # Shared packages
├── turbo.json     # Turbo configuration
├── pnpm-workspace.yaml
├── biome.json     # Biome configuration
├── commitlint.config.ts
├── .lefthook.yml  # Git hooks
└── tsconfig.json  # Root TypeScript config
```

## Scripts

- `pnpm dev`: Run dev tasks across all workspaces
- `pnpm build`: Build all workspaces
- `pnpm lint`: Lint all workspaces
- `pnpm format`: Format all workspaces
- `pnpm type-check`: Type check all workspaces
- `pnpm test`: Run tests across all workspaces
- `pnpm clean`: Clean build artifacts

## Git Hooks

- **pre-commit**: Runs Biome check and format on staged files
- **commit-msg**: Validates commit messages using commit-lint
- **pre-push**: Runs type-check before pushing

## Example

```bash
create-hexp create --base base-monorepo-turbo --name my-monorepo --monorepo
```

## Compatible Addons

- `addon-monorepo-app`: Add a new app to the monorepo
- `addon-monorepo-package`: Add a new package to the monorepo
- `addon-docker`: Add Docker support

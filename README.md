# Hexperience Platform

Platform for generating projects from templates (CLI + Engine + Catalog + Templates).

## Overview

This is a monorepo built with:
- **Turbo** - Build system and task runner
- **pnpm** - Package manager
- **Rslib** - Modern library bundler for packages
- **Biome.js** - Fast linter and formatter
- **LeftHook** - Git hooks manager
- **commit-lint** - Commit message linter

## Architecture

See the architecture documentation:
- [Concept](./doc/CONCEPT.md) - Overall system design and principles
- [Architecture Flow](./doc/ARCHITECTURE-FLOW.md) - Technical flow and components

## Project Structure

```
hexperience-platform/
├── apps/
│   └── cli/                # CLI application (create-xxx)
├── packages/
│   ├── engine/             # Composer engine
│   ├── catalog/            # Catalog resolver
│   └── shared/             # Shared utilities/types
├── templates/
│   ├── bases/              # Base stack templates
│   └── addons/             # Addon templates
└── ...
```

## Prerequisites

- Node.js >= 18.12.0 (LTS recommended)
- pnpm >= 9.0.0

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build all packages:
   ```bash
   pnpm build
   ```

3. Run development mode:
   ```bash
   pnpm dev
   ```

## Available Scripts

### Root level (runs across all packages):

- `pnpm dev` - Run all packages in watch mode
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format all packages
- `pnpm type-check` - Type check all packages
- `pnpm test` - Run tests (when configured)
- `pnpm clean` - Clean all build artifacts

### Package level:

Each package/app has its own scripts:
- `build` - Build the package
- `dev` - Build in watch mode
- `lint` - Lint the package
- `format` - Format the package
- `type-check` - Type check the package

## Development Workflow

1. **Create new packages**: Use `pnpm create rslib@latest` with the standard template:
   ```bash
   pnpm create rslib@latest --template node-esm-ts --dir packages/my-package --packageName @hexp/my-package
   ```

2. **Add workspace dependencies**: 
   ```bash
   pnpm add @hexp/shared --workspace-root --filter @hexp/my-package
   ```

3. **Commit**: Follow conventional commits (enforced by commit-lint):
   - `feat: add new feature`
   - `fix: resolve bug`
   - `docs: update documentation`
   - etc.

## Git Hooks

Git hooks are managed by LeftHook:

- **pre-commit**: Runs Biome check and formatting on staged files
- **commit-msg**: Validates commit messages with commit-lint
- **pre-push**: Runs type-check (optional)

To skip hooks locally, create `.lefthook-local.yml` (see `.lefthook-local.yml.example`).

## Code Quality

- **Linting**: Biome.js (configured in `biome.json`)
- **Formatting**: Biome.js (auto-format on commit)
- **Type Checking**: TypeScript (strict mode)
- **Commits**: Conventional Commits (enforced by commit-lint)

## Packages

### `@hexp/shared`
Shared utilities and types used across packages.

### `@hexp/catalog`
Catalog resolver - discovers and validates templates.

### `@hexp/engine`
Composer engine - applies templates and addons to generate projects.

### `@hexp/cli`
CLI application - user interface for the platform.

## Templates

Templates are organized in:
- `templates/bases/` - Base stack templates
- `templates/addons/` - Feature addon templates

Each template requires a `manifest.json` describing its capabilities, requirements, and operations.

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR:
- Linting
- Type checking
- Building
- Format checking

## License

See [LICENSE](./LICENSE) file.

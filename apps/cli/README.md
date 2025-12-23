# Hexperience CLI

CLI tool for generating projects from templates.

## Installation

```bash
# From the monorepo root
pnpm install
pnpm build
```

## Usage

### List Available Templates

List all available base templates and addons:

```bash
create-hexp list
```

List only base templates:

```bash
create-hexp list --bases
```

List only addon templates:

```bash
create-hexp list --addons
```

### Create a Project

#### Interactive Mode

Run without arguments to start an interactive wizard:

```bash
create-hexp create
```

The wizard will guide you through:
- Selecting a base template
- Selecting addon templates
- Entering project name
- Choosing project type (single package or monorepo)
- Entering template-specific variables

#### Non-Interactive Mode

Create a project using command-line flags:

```bash
create-hexp create \
  --base example-base \
  --name my-project \
  --output ./my-project
```

**Available Options:**

- `--base <id>` - Base template ID (required in non-interactive mode)
- `--addons <ids...>` - Space-separated list of addon template IDs
- `--name <name>` - Project name (required in non-interactive mode)
- `--monorepo` - Force monorepo project type
- `--single` - Force single package project type
- `--output <dir>` - Output directory (default: current directory)
- `--config <file>` - Configuration file (JSON or YAML)
- `--dry-run` or `--preview` - Preview generation plan without executing

**Examples:**

```bash
# Create a single package project
create-hexp create --base example-base --name my-app --single

# Create a monorepo project
create-hexp create --base example-base --name my-monorepo --monorepo

# Create with addons
create-hexp create \
  --base example-base \
  --addons addon1 addon2 \
  --name my-project

# Preview what would be generated
create-hexp create \
  --base example-base \
  --name my-project \
  --dry-run
```

#### Using Configuration Files

You can use a configuration file (JSON or YAML) instead of command-line flags:

**JSON Example (`config.json`):**

```json
{
  "base": "example-base",
  "name": "my-project",
  "monorepo": true,
  "addons": ["addon1", "addon2"],
  "variables": {
    "db": "postgres",
    "port": 3000
  }
}
```

**YAML Example (`config.yaml`):**

```yaml
base: example-base
name: my-project
monorepo: true
addons:
  - addon1
  - addon2
variables:
  db: postgres
  port: 3000
```

Then use it:

```bash
create-hexp create --config config.json
# or
create-hexp create --config config.yaml
```

**Note:** Command-line flags take precedence over configuration file values.

### TUI Mode

For complex tasks, use the interactive TUI (Terminal User Interface):

```bash
# Model editor
create-hexp tui models

# Monorepo manager
create-hexp tui monorepo
```

**Model Editor:**
- Navigate with arrow keys (↑/↓)
- Press `a` to add a new model
- Press `Enter` to edit a model
- Press `d` to delete a model
- Press `Ctrl+S` to save (shows JSON in console)
- Press `Escape` to exit or go back

**Monorepo Manager:**
- Navigate with arrow keys (↑/↓)
- Press `a` to add an app
- Press `p` to add a package
- Press `d` to delete selected item
- Press `1`, `2`, `3` to switch views (All/Apps/Packages)
- Press `Escape` to exit or go back

**Note:** For detailed testing instructions, see [TUI-TESTING.md](./TUI-TESTING.md)

## Configuration File Schema

The configuration file supports the following fields:

```typescript
{
  base?: string           // Base template ID
  addons?: string[]       // Array of addon template IDs
  name?: string           // Project name
  monorepo?: boolean      // Force monorepo type
  single?: boolean        // Force single package type
  output?: string         // Output directory
  variables?: {           // Template-specific variables
    [key: string]: unknown
  }
}
```

## Examples

### Example 1: Quick Start

```bash
# List available templates
create-hexp list

# Create a project interactively
create-hexp create
```

### Example 2: CI/CD Usage

```bash
# Non-interactive mode for automation
create-hexp create \
  --base example-base \
  --name production-app \
  --monorepo \
  --output ./generated \
  --config ci-config.yaml
```

### Example 3: Preview Before Generating

```bash
# See what would be generated without creating files
create-hexp create \
  --base example-base \
  --name test-project \
  --preview
```

### Example 4: Using YAML Config

```yaml
# project-config.yaml
base: example-base
name: my-awesome-project
monorepo: false
variables:
  database: postgresql
  framework: hono
```

```bash
create-hexp create --config project-config.yaml
```

## Project Structure

Generated projects include:

- **Base template files** - Copied from the selected base template
- **Addon modifications** - Applied from selected addons
- **Monorepo structure** (if `--monorepo` is used):
  - `apps/` directory
  - `packages/` directory
  - `turbo.json` configuration
  - `pnpm-workspace.yaml`
  - `tsconfig.json` with project references
- **Quality standards**:
  - `.lefthook.yml` - Git hooks configuration
  - `commitlint.config.ts` - Commit message linting
  - `biome.json` - Linting and formatting
  - `.gitignore` - Standard ignore patterns
  - `package.json` - With quality scripts (lint, format, type-check, check)
  - `README.md` - Project documentation with quality standards info

## Troubleshooting

### No templates found

Make sure you're running the command from the project root (where `templates/` directory exists), or specify the correct path.

### Template not found

Verify the template ID exists:

```bash
create-hexp list --bases
```

### Configuration file errors

The CLI supports both JSON and YAML. Make sure:
- JSON files are valid JSON
- YAML files are valid YAML
- Required fields are present (`base` and `name` for non-interactive mode)

## Help

Get help for any command:

```bash
create-hexp --help
create-hexp create --help
create-hexp list --help
create-hexp tui --help
```

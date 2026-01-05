# User Guide - Hexperience Platform CLI

This guide explains how to use the `create-hexp` CLI tool to generate projects from templates.

## Installation

The CLI is part of the Hexperience Platform monorepo. To use it:

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Build the CLI: `pnpm build --filter @hexp/cli`
4. Link or use directly: `node apps/cli/dist/index.js`

Or install globally (when published):
```bash
npm install -g create-hexp
```

## Commands

### `create-hexp list`

List available base templates and addons.

**Options:**
- `--bases` - Show only base templates
- `--addons` - Show only addon templates
- `--all` - Show all templates (default)

**Examples:**
```bash
create-hexp list
create-hexp list --bases
create-hexp list --addons
```

### `create-hexp create`

Generate a new project from templates.

**Options:**
- `--base <id>` - Base template ID (required in non-interactive mode)
- `--addons <ids...>` - List of addon template IDs
- `--name <name>` - Project name (required in non-interactive mode)
- `--monorepo` - Force monorepo project type
- `--single` - Force single package project type
- `--output <dir>` - Output directory (default: current directory)
- `--config <file>` - Configuration file (JSON or YAML)
- `--dry-run` / `--preview` - Preview generation plan without executing
- `--stats` - Show generation statistics
- `--json` - Output in JSON format
- `--save-progress` - Save partial progress on cancellation
- `-v, --verbose` - Enable verbose logging (debug mode)

**Examples:**

Interactive mode (prompts for all options):
```bash
create-hexp create
```

Non-interactive mode:
```bash
create-hexp create \
  --base base-hono-drizzle \
  --addons addon-auth addon-docker \
  --name my-project \
  --output ./projects
```

With configuration file:
```bash
create-hexp create --config config.json
```

Preview mode (dry run):
```bash
create-hexp create --base base-minimal-node --name test --dry-run
```

With statistics:
```bash
create-hexp create --base base-monorepo-turbo --name my-monorepo --stats
```

### `create-hexp validate`

Validate all templates in the project.

**Options:**
- `--json` - Output validation results in JSON format
- `--templates <path>` - Path to templates directory (optional)

**Examples:**
```bash
create-hexp validate
create-hexp validate --json
```

### `create-hexp tui`

Interactive TUI for complex tasks.

**Subcommands:**
- `models` - Manage data models (default)
- `monorepo` - Manage monorepo structure

**Examples:**
```bash
create-hexp tui
create-hexp tui monorepo
```

## Interactive vs Non-Interactive Mode

### Interactive Mode

When you run `create-hexp create` without required options, the CLI enters interactive mode:

1. **Select base template** - Choose from available bases
2. **Select addons** - Choose compatible addons (with validation)
3. **Enter project name** - Provide a valid project name
4. **Choose project type** - Single package or monorepo (if not determined by base)
5. **Collect variables** - Answer prompts defined in templates
6. **Confirm** - Review and confirm before generation

### Non-Interactive Mode

When you provide `--base` and `--name`, the CLI runs in non-interactive mode:

- All options must be provided via CLI flags
- No prompts are shown
- Suitable for CI/CD and automation

## Configuration Files

You can use a configuration file (JSON or YAML) to specify options:

**config.json:**
```json
{
  "base": "base-hono-drizzle",
  "addons": ["addon-auth", "addon-docker"],
  "name": "my-project",
  "monorepo": true,
  "variables": {
    "database": "postgresql",
    "port": 3000
  }
}
```

**config.yaml:**
```yaml
base: base-hono-drizzle
addons:
  - addon-auth
  - addon-docker
name: my-project
monorepo: true
variables:
  database: postgresql
  port: 3000
```

Use with:
```bash
create-hexp create --config config.json
```

**Note:** CLI options take precedence over config file values.

## Project Types

### Single Package

A single Node.js package with:
- `package.json`
- `tsconfig.json`
- `src/` directory
- Standard scripts

### Monorepo

A monorepo structure with:
- `apps/` - Applications
- `packages/` - Shared packages
- `turbo.json` - Turbo configuration
- `pnpm-workspace.yaml` - Workspace configuration
- Quality standards (LeftHook, commit-lint, Biome)

## Post-Steps

After generation, the CLI can automatically:

1. **Install dependencies** - Run `pnpm install` or `npm install`
2. **Format code** - Format with Biome
3. **Lint code** - Run linter
4. **Type check** - Run TypeScript compiler
5. **Initialize git** - Create git repository with initial commit
6. **Generate docs** - Create basic README

These are enabled by default but can be skipped:
- `--skip-install` - Skip dependency installation
- `--skip-format` - Skip code formatting
- `--skip-lint` - Skip linting
- `--skip-type-check` - Skip type checking
- `--skip-git-init` - Skip git initialization
- `--skip-docs` - Skip documentation generation

## Error Handling

The CLI provides clear error messages with suggestions:

- **Validation errors** - Invalid inputs or configurations
- **Template errors** - Missing or invalid templates
- **System errors** - File system or permission issues
- **Operation errors** - Errors during generation

Use `--verbose` for detailed error information including stack traces.

## Cancellation

You can cancel generation with `Ctrl+C`:

1. First interrupt: Shows confirmation prompt
   - Save partial progress? (y/n)
   - If yes, workspace is preserved
   - If no, workspace is cleaned up
2. Second interrupt: Force exit and cleanup

Use `--save-progress` to automatically save progress on cancellation.

## Statistics

Use `--stats` to see generation statistics:

```
✓ Generation completed successfully

Statistics:
  Files created: 42
  Files modified: 8
  Operations executed: 15
    - copy: 5
    - templateRender: 7
    - jsonMerge: 3
  Post-steps executed: 4
    - installDependencies: 1
    - formatCode: 1
    - lintCode: 1
    - typeCheck: 1
  Execution time: 2.3s
```

Use `--json` for machine-readable output.

## Troubleshooting

### "No base templates found"

- Ensure you're running from the project root
- Check that `templates/bases/` directory exists
- Verify templates have valid `manifest.json` files

### "Template directory not found"

- Run `create-hexp validate` to check template structure
- Verify template ID is correct
- Check template path in `templates/` directory

### "Validation failed"

- Check compatibility between base and addons
- Verify all required capabilities are provided
- Check for conflicts between addons
- Run with `--verbose` for detailed error messages

### "Directory already exists"

- Choose a different project name
- Remove or rename existing directory
- Use `--output` to specify different location

## Next Steps

After generating a project:

1. Navigate to project directory: `cd <project-name>`
2. Install dependencies (if not done automatically): `pnpm install`
3. Start development: `pnpm dev`
4. Review generated code and customize as needed

## See Also

- [Template Guide](./TEMPLATE-GUIDE.md) - Creating templates
- [Addon Guide](./ADDON-GUIDE.md) - Creating addons
- [Examples](./EXAMPLES.md) - Usage examples
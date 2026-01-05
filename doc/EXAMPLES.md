# Examples - Hexperience Platform

This document provides practical examples of using the Hexperience Platform.

## Example 1: Simple Node.js Project

Generate a minimal Node.js project:

```bash
create-hexp create \
  --base base-minimal-node \
  --name my-node-project \
  --output ./projects
```

**Result:**
- Single package project
- TypeScript configured
- Basic `src/index.ts` with hello world
- Ready to run with `pnpm dev`

## Example 2: Web Server with Authentication

Generate a Hono server with authentication:

```bash
create-hexp create \
  --base base-hono-drizzle \
  --addons addon-auth \
  --name my-api \
  --output ./projects
```

**Result:**
- Hono web server
- Drizzle ORM configured
- Authentication middleware and routes
- JWT support
- Database models

## Example 3: Monorepo with Multiple Apps

Generate a monorepo with Turbo:

```bash
create-hexp create \
  --base base-monorepo-turbo \
  --name my-monorepo \
  --monorepo
```

**Result:**
- Monorepo structure (apps/, packages/)
- Turbo configured
- pnpm workspace
- Quality standards (LeftHook, commit-lint, Biome)
- Ready for multiple apps and packages

## Example 4: Using Configuration File

Create `config.json`:

```json
{
  "base": "base-hono-drizzle",
  "addons": ["addon-auth", "addon-docker"],
  "name": "my-fullstack-app",
  "monorepo": false,
  "variables": {
    "database": "postgresql",
    "port": 3000,
    "jwtSecret": "my-secret-key"
  }
}
```

Run:
```bash
create-hexp create --config config.json
```

## Example 5: Interactive Mode

Run without options for interactive prompts:

```bash
create-hexp create
```

**Flow:**
1. Select base template (from list)
2. Select addons (multi-select with compatibility check)
3. Enter project name
4. Choose project type (if not determined)
5. Answer variable prompts
6. Confirm generation

## Example 6: Preview Mode (Dry Run)

Preview what would be generated:

```bash
create-hexp create \
  --base base-hono-drizzle \
  --addons addon-auth \
  --name preview-project \
  --dry-run
```

**Output:**
- List of files that would be created
- Operations that would be executed
- No actual files created

## Example 7: With Statistics

Generate and see statistics:

```bash
create-hexp create \
  --base base-monorepo-turbo \
  --name stats-demo \
  --stats
```

**Output:**
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
  Execution time: 2.3s
```

## Example 8: JSON Output for CI/CD

Get JSON output for automation:

```bash
create-hexp create \
  --base base-minimal-node \
  --name ci-project \
  --json > generation-result.json
```

## Example 9: Validating Templates

Validate all templates:

```bash
create-hexp validate
```

**Output:**
```
Validating templates...

Found 0 error(s)
Found 2 warning(s):
  ⚠ Addon requires and provides the same capability [addon-example]
  ⚠ Target directory may not exist: dist/ [base-example]

==================================================
✓ Validation passed: 5 template(s) valid
  (2 warning(s) found)
==================================================
```

## Example 10: Listing Templates

List all available templates:

```bash
create-hexp list
```

List only bases:

```bash
create-hexp list --bases
```

List only addons:

```bash
create-hexp list --addons
```

## Example 11: Monorepo with Custom Apps

Use TUI to manage monorepo structure:

```bash
create-hexp tui monorepo
```

**Features:**
- Add/remove apps
- Add/remove packages
- Configure dependencies
- Visualize structure

## Example 12: Custom Variables

Use variables in templates:

**Template prompt:**
```json
{
  "key": "apiKey",
  "type": "text",
  "message": "API Key",
  "default": ""
}
```

**Template file:**
```typescript
const API_KEY = "{{apiKey}}";
```

**Usage:**
```bash
create-hexp create \
  --base base-my-template \
  --name my-project
# Prompts for apiKey value
```

## Example 13: Skipping Post-Steps

Skip automatic post-steps:

```bash
create-hexp create \
  --base base-minimal-node \
  --name my-project \
  --skip-install \
  --skip-format \
  --skip-lint
```

## Example 14: Force Git Init

Force git initialization:

```bash
create-hexp create \
  --base base-minimal-node \
  --name my-project \
  --git-init
```

## Example 15: Verbose Logging

Enable verbose logging for debugging:

```bash
create-hexp create \
  --base base-hono-drizzle \
  --name debug-project \
  --verbose
```

**Output includes:**
- Debug messages
- Stack traces on errors
- Detailed operation logs
- Context information

## Example 16: Cancellation with Progress Save

Save progress on cancellation:

```bash
create-hexp create \
  --base base-monorepo-turbo \
  --name large-project \
  --save-progress
```

Press `Ctrl+C` to cancel - progress is automatically saved.

## Example 17: Multiple Addons with Dependencies

Addons with dependencies are automatically ordered:

```bash
create-hexp create \
  --base base-hono-drizzle \
  --addons addon-auth addon-auth-jwt addon-docker \
  --name complex-project
```

**System automatically:**
- Resolves dependency order
- Validates compatibility
- Checks for conflicts
- Applies in correct sequence

## Example 18: YAML Configuration

Use YAML configuration file:

**config.yaml:**
```yaml
base: base-hono-drizzle
addons:
  - addon-auth
  - addon-docker
name: my-yaml-project
monorepo: false
variables:
  database: postgresql
  port: 3000
```

```bash
create-hexp create --config config.yaml
```

## Example 19: CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Generate Project

on:
  workflow_dispatch:
    inputs:
      project_name:
        required: true

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: pnpm install
      - run: pnpm build
      - run: |
          create-hexp create \
            --base base-monorepo-turbo \
            --name ${{ inputs.project_name }} \
            --json > result.json
      - uses: actions/upload-artifact@v3
        with:
          name: generated-project
          path: ${{ inputs.project_name }}
```

## Example 20: Template Development Workflow

1. **Create template structure:**
   ```
   templates/bases/base-my-template/
   ├── manifest.json
   └── template/
       └── ...
   ```

2. **Validate:**
   ```bash
   create-hexp validate
   ```

3. **Test dry run:**
   ```bash
   create-hexp create --base base-my-template --name test --dry-run
   ```

4. **Test generation:**
   ```bash
   create-hexp create --base base-my-template --name test
   cd test
   pnpm install
   pnpm build
   ```

5. **Iterate and improve**

## See Also

- [User Guide](./USER-GUIDE.md) - Complete CLI usage
- [Template Guide](./TEMPLATE-GUIDE.md) - Creating templates
- [Addon Guide](./ADDON-GUIDE.md) - Creating addons
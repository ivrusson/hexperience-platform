# Template Guide - Creating Base Templates

This guide explains how to create base templates for the Hexperience Platform.

## Template Structure

A base template has the following structure:

```
templates/bases/
└── base-my-template/
    ├── manifest.json          # Template manifest (required)
    ├── README.md              # Template documentation
    └── template/              # Template files
        ├── package.json
        ├── tsconfig.json
        └── src/
            └── index.ts
```

## Manifest.json

The `manifest.json` file describes the template:

```json
{
  "id": "base-my-template",
  "type": "base",
  "name": "My Template",
  "description": "Description of the template",
  "version": "1.0.0",
  "projectType": "single",
  "capabilities": ["web-server", "typescript"],
  "prompts": [
    {
      "key": "port",
      "type": "number",
      "message": "Server port",
      "default": 3000
    },
    {
      "key": "database",
      "type": "select",
      "message": "Database type",
      "options": ["postgresql", "mysql", "sqlite"],
      "default": "postgresql"
    }
  ],
  "ops": [
    {
      "type": "copy",
      "from": "package.json",
      "to": "package.json"
    },
    {
      "type": "templateRender",
      "from": "src/index.ts",
      "to": "src/index.ts"
    }
  ]
}
```

### Manifest Fields

#### Required Fields

- **id** (string) - Unique template identifier (must match directory name)
- **type** ("base") - Template type
- **name** (string) - Display name
- **description** (string) - Template description

#### Optional Fields

- **version** (string) - Template version (semver)
- **projectType** ("single" | "monorepo") - Project type
- **capabilities** (string[]) - Capabilities provided by this template
- **prompts** (Prompt[]) - Variable collection prompts
- **ops** (Operation[]) - Operations to execute

### Capabilities

Capabilities define what a template provides. Examples:
- `web-server` - Web server capability
- `orm` - ORM capability
- `typescript` - TypeScript support
- `testing` - Testing framework
- `docker` - Docker support

Addons can require these capabilities using `requires`.

### Prompts

Prompts collect variables from users:

```json
{
  "key": "variableName",
  "type": "text" | "number" | "select" | "multiselect" | "confirm",
  "message": "Prompt message",
  "default": "default value",
  "options": ["option1", "option2"],  // For select/multiselect
  "validate": "validation function"     // Optional
}
```

Variables are available in templates as `{{variableName}}`.

## Operations

Operations define what the template does:

### Copy Operation

Copy a file from template to workspace:

```json
{
  "type": "copy",
  "from": "relative/path/in/template",
  "to": "relative/path/in/workspace",
  "overwrite": false
}
```

### Template Render Operation

Render a template file with variables:

```json
{
  "type": "templateRender",
  "from": "src/index.ts.template",
  "to": "src/index.ts"
}
```

Template files use Mustache syntax:
```typescript
const port = {{port}};
const db = "{{database}}";
```

### JSON Merge Operation

Merge JSON data into existing files:

```json
{
  "type": "jsonMerge",
  "target": "package.json",
  "data": {
    "scripts": {
      "dev": "tsx src/index.ts"
    }
  },
  "arrayMerge": "append" | "replace" | "merge",
  "overwrite": true
}
```

### Text Insert Operation

Insert text at a marker:

```json
{
  "type": "textInsert",
  "target": "src/index.ts",
  "marker": "// @addon:auth",
  "content": "import { auth } from './auth';\n",
  "position": "before" | "after"
}
```

### Text Replace Operation

Replace text by pattern:

```json
{
  "type": "textReplace",
  "target": "src/index.ts",
  "pattern": "const port = 3000;",
  "replacement": "const port = {{port}};",
  "isRegex": false
}
```

### Codemod Operation

Transform code using AST:

```json
{
  "type": "codemod",
  "target": "src/index.ts",
  "transform": "addImport",
  "options": {
    "module": "express",
    "default": "express"
  }
}
```

### Env Append Operation

Add environment variables:

```json
{
  "type": "envAppend",
  "target": ".env",
  "variables": {
    "PORT": "{{port}}",
    "DATABASE_URL": "{{databaseUrl}}"
  },
  "envFile": ".env" | ".env.example" | ".env.local"
}
```

## Template Files

Template files go in the `template/` directory:

- Use `.template` extension for files that need rendering (optional)
- Use Mustache syntax: `{{variableName}}`
- Support conditionals: `{{#if condition}}...{{/if}}`
- Support loops: `{{#each items}}...{{/each}}`

Example `src/index.ts`:
```typescript
const port = {{port}};
const app = express();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## Testing Templates

1. **Validate structure:**
   ```bash
   create-hexp validate
   ```

2. **Test generation:**
   ```bash
   create-hexp create --base base-my-template --name test-project --dry-run
   ```

3. **Generate and test:**
   ```bash
   create-hexp create --base base-my-template --name test-project
   cd test-project
   pnpm install
   pnpm build
   ```

## Best Practices

1. **Use semantic versioning** for template versions
2. **Document capabilities** clearly
3. **Provide sensible defaults** for prompts
4. **Use markers** for addon integration points
5. **Test thoroughly** before publishing
6. **Follow naming conventions** for IDs (kebab-case)
7. **Include README.md** with usage instructions

## Markers for Addons

Add markers in your code where addons can inject functionality:

```typescript
// @addon:auth
// Add authentication middleware here

// @addon:database
// Add database connection here
```

Addons can use `textInsert` operations to add code at these markers.

## Example: Minimal Node Template

```json
{
  "id": "base-minimal-node",
  "type": "base",
  "name": "Minimal Node.js",
  "description": "Minimal Node.js project with TypeScript",
  "version": "1.0.0",
  "projectType": "single",
  "capabilities": ["typescript"],
  "prompts": [
    {
      "key": "projectName",
      "type": "text",
      "message": "Project name",
      "default": "my-project"
    }
  ],
  "ops": [
    {
      "type": "copy",
      "from": "package.json",
      "to": "package.json"
    },
    {
      "type": "copy",
      "from": "tsconfig.json",
      "to": "tsconfig.json"
    },
    {
      "type": "templateRender",
      "from": "src/index.ts",
      "to": "src/index.ts"
    }
  ]
}
```

## See Also

- [Addon Guide](./ADDON-GUIDE.md) - Creating addons
- [User Guide](./USER-GUIDE.md) - Using the CLI
- [Examples](./EXAMPLES.md) - Template examples
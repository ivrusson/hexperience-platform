# Addon Guide - Creating Addon Templates

This guide explains how to create addon templates that extend base templates.

## Addon Structure

An addon template has the following structure:

```
templates/addons/
└── addon-my-feature/
    ├── manifest.json          # Addon manifest (required)
    ├── README.md              # Addon documentation
    └── template/              # Addon files
        ├── src/
        │   └── feature.ts
        └── config.json
```

## Manifest.json

The `manifest.json` file describes the addon:

```json
{
  "id": "addon-my-feature",
  "type": "addon",
  "name": "My Feature",
  "description": "Adds my feature to the project",
  "version": "1.0.0",
  "requires": ["web-server", "typescript"],
  "provides": ["my-feature"],
  "conflicts": ["addon-alternative-feature"],
  "prompts": [
    {
      "key": "featureOption",
      "type": "text",
      "message": "Feature option",
      "default": "default"
    }
  ],
  "ops": [
    {
      "type": "copy",
      "from": "src/feature.ts",
      "to": "src/feature.ts"
    },
    {
      "type": "textInsert",
      "target": "src/index.ts",
      "marker": "// @addon:my-feature",
      "content": "import { feature } from './feature';\n"
    }
  ]
}
```

### Manifest Fields

#### Required Fields

- **id** (string) - Unique addon identifier (must match directory name)
- **type** ("addon") - Template type
- **name** (string) - Display name
- **description** (string) - Addon description

#### Optional Fields

- **version** (string) - Addon version (semver)
- **requires** (string[]) - Required capabilities from base template
- **provides** (string[]) - Capabilities provided by this addon
- **conflicts** (string[]) - Addon IDs that conflict with this addon
- **prompts** (Prompt[]) - Variable collection prompts
- **ops** (Operation[]) - Operations to execute

### Requires

The `requires` field specifies capabilities that the base template must provide:

```json
{
  "requires": ["web-server", "orm"]
}
```

The validation system ensures compatibility before generation.

### Provides

The `provides` field specifies capabilities this addon provides:

```json
{
  "provides": ["auth", "jwt"]
}
```

Other addons can require these capabilities.

### Conflicts

The `conflicts` field specifies addon IDs that cannot be used together:

```json
{
  "conflicts": ["addon-alternative-auth"]
}
```

The validation system prevents conflicting addons from being selected together.

## Addon Operations

Addons use the same operations as base templates, but typically:

1. **Copy files** - Add new files
2. **Template render** - Add rendered files
3. **Text insert** - Inject code at markers
4. **Text replace** - Modify existing code
5. **JSON merge** - Add dependencies, scripts, config
6. **Codemod** - Transform code with AST
7. **Env append** - Add environment variables

## Integration with Bases

### Using Markers

Bases should include markers where addons can inject code:

```typescript
// src/index.ts
import express from 'express';

const app = express();

// @addon:auth
// Authentication middleware will be added here

// @addon:database
// Database connection will be added here

app.listen(3000);
```

Addons use `textInsert` to add code:

```json
{
  "type": "textInsert",
  "target": "src/index.ts",
  "marker": "// @addon:auth",
  "content": "import { authMiddleware } from './auth';\napp.use(authMiddleware);\n",
  "position": "after"
}
```

### Adding Dependencies

Use `jsonMerge` to add dependencies:

```json
{
  "type": "jsonMerge",
  "target": "package.json",
  "data": {
    "dependencies": {
      "jsonwebtoken": "^9.0.0",
      "bcrypt": "^5.1.0"
    }
  }
}
```

### Adding Scripts

Add scripts to package.json:

```json
{
  "type": "jsonMerge",
  "target": "package.json",
  "data": {
    "scripts": {
      "auth:generate": "node scripts/generate-jwt.js"
    }
  }
}
```

### Modifying Existing Code

Use `textReplace` to modify existing code:

```json
{
  "type": "textReplace",
  "target": "src/index.ts",
  "pattern": "app.listen(3000);",
  "replacement": "app.listen(process.env.PORT || 3000);"
}
```

## Dependency Resolution

Addons can depend on other addons using `requires`:

```json
{
  "id": "addon-auth",
  "requires": ["web-server"]
}
```

```json
{
  "id": "addon-auth-jwt",
  "requires": ["web-server", "auth"]
}
```

The system automatically resolves dependencies and applies addons in the correct order.

## Example: Authentication Addon

**manifest.json:**
```json
{
  "id": "addon-auth",
  "type": "addon",
  "name": "Authentication",
  "description": "Adds JWT-based authentication",
  "version": "1.0.0",
  "requires": ["web-server"],
  "provides": ["auth"],
  "prompts": [
    {
      "key": "jwtSecret",
      "type": "text",
      "message": "JWT secret key",
      "default": "your-secret-key"
    }
  ],
  "ops": [
    {
      "type": "copy",
      "from": "src/auth/middleware.ts",
      "to": "src/auth/middleware.ts"
    },
    {
      "type": "copy",
      "from": "src/auth/routes.ts",
      "to": "src/auth/routes.ts"
    },
    {
      "type": "textInsert",
      "target": "src/index.ts",
      "marker": "// @addon:auth",
      "content": "import { authMiddleware } from './auth/middleware';\nimport { authRoutes } from './auth/routes';\n\napp.use(authMiddleware);\napp.use('/auth', authRoutes);\n",
      "position": "after"
    },
    {
      "type": "jsonMerge",
      "target": "package.json",
      "data": {
        "dependencies": {
          "jsonwebtoken": "^9.0.0",
          "bcrypt": "^5.1.0"
        }
      }
    },
    {
      "type": "envAppend",
      "target": ".env",
      "variables": {
        "JWT_SECRET": "{{jwtSecret}}"
      }
    }
  ]
}
```

## Testing Addons

1. **Validate structure:**
   ```bash
   create-hexp validate
   ```

2. **Test with base:**
   ```bash
   create-hexp create \
     --base base-hono-drizzle \
     --addons addon-auth \
     --name test-project \
     --dry-run
   ```

3. **Generate and test:**
   ```bash
   create-hexp create \
     --base base-hono-drizzle \
     --addons addon-auth \
     --name test-project
   cd test-project
   pnpm install
   pnpm build
   ```

## Best Practices

1. **Define clear requirements** - Specify exactly what capabilities you need
2. **Provide capabilities** - Let other addons depend on yours
3. **Avoid conflicts** - Document conflicts clearly
4. **Use markers** - Rely on markers for code injection
5. **Test compatibility** - Test with multiple bases
6. **Version properly** - Use semantic versioning
7. **Document dependencies** - Explain what your addon needs
8. **Handle edge cases** - Consider what happens if markers are missing

## Common Patterns

### Pattern 1: Adding Routes

```json
{
  "type": "textInsert",
  "target": "src/index.ts",
  "marker": "// @addon:routes",
  "content": "import { myRoutes } from './routes/my';\napp.use('/my', myRoutes);\n"
}
```

### Pattern 2: Adding Middleware

```json
{
  "type": "textInsert",
  "target": "src/index.ts",
  "marker": "// @addon:middleware",
  "content": "import { myMiddleware } from './middleware/my';\napp.use(myMiddleware);\n"
}
```

### Pattern 3: Adding Database Models

```json
{
  "type": "copy",
  "from": "src/models/User.ts",
  "to": "src/models/User.ts"
}
```

### Pattern 4: Adding Configuration

```json
{
  "type": "jsonMerge",
  "target": "tsconfig.json",
  "data": {
    "compilerOptions": {
      "paths": {
        "@auth/*": ["./src/auth/*"]
      }
    }
  }
}
```

## See Also

- [Template Guide](./TEMPLATE-GUIDE.md) - Creating base templates
- [User Guide](./USER-GUIDE.md) - Using the CLI
- [Examples](./EXAMPLES.md) - Addon examples
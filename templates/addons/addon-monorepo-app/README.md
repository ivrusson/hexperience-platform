# addon-monorepo-app

Add a new app to a monorepo.

## Requirements

- `monorepo`: Requires a monorepo base template

## Provides

- New app structure in `apps/{{appName}}/`
- Updated TypeScript project references

## Variables

- `appName`: Name of the app to create (prompted)
- `projectName`: Name of the project (automatically provided)

## Usage

This addon creates a new app in your monorepo with:

- Package.json with scripts
- TypeScript configuration extending root config
- Basic source structure
- Updated project references in root tsconfig.json

## Structure

```
apps/
└── {{appName}}/
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts
```

## Operations

1. **templateRender**: Creates the app structure with template variables
2. **jsonMerge**: Adds the app to TypeScript project references in root `tsconfig.json`

## Example

```bash
# First create a monorepo
create-hexp create --base base-monorepo-turbo --name my-monorepo --monorepo

# Then add an app
create-hexp add --addon addon-monorepo-app
# When prompted, enter: my-app
```

## Compatible Bases

- `base-monorepo-turbo`

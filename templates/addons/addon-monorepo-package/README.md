# addon-monorepo-package

Add a new package to a monorepo.

## Requirements

- `monorepo`: Requires a monorepo base template

## Provides

- New package structure in `packages/{{packageName}}/`
- Updated TypeScript project references

## Variables

- `packageName`: Name of the package to create (prompted)
- `projectName`: Name of the project (automatically provided)

## Usage

This addon creates a new package in your monorepo with:

- Package.json with build scripts
- TypeScript configuration extending root config with declaration files
- Basic source structure with exports
- Updated project references in root tsconfig.json

## Structure

```
packages/
└── {{packageName}}/
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts
```

## Operations

1. **templateRender**: Creates the package structure with template variables
2. **jsonMerge**: Adds the package to TypeScript project references in root `tsconfig.json`

## Example

```bash
# First create a monorepo
create-hexp create --base base-monorepo-turbo --name my-monorepo --monorepo

# Then add a package
create-hexp add --addon addon-monorepo-package
# When prompted, enter: my-package
```

## Compatible Bases

- `base-monorepo-turbo`

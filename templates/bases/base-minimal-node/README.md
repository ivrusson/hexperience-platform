# base-minimal-node

A minimal Node.js project template with TypeScript support.

## Capabilities

- `typescript`: Full TypeScript support with strict mode
- `node`: Node.js runtime support

## Project Type

- `single`: Single project (not a monorepo)

## Variables

- `projectName`: Name of the project (automatically provided)

## Usage

This template creates a minimal Node.js project with:

- TypeScript configuration
- Basic project structure (`src/index.ts`)
- Development and build scripts
- Git ignore file

## Scripts

- `pnpm dev`: Run the project in development mode with tsx
- `pnpm build`: Compile TypeScript to JavaScript
- `pnpm start`: Run the compiled JavaScript
- `pnpm type-check`: Check TypeScript types without emitting files

## Example

```bash
create-hexp create --base base-minimal-node --name my-project --single
```

## Compatible Addons

This base template is compatible with any addon that doesn't require specific capabilities.

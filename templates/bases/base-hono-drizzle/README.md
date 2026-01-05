# base-hono-drizzle

A web server template with Hono framework and Drizzle ORM.

## Capabilities

- `web-server`: Web server with Hono framework
- `orm`: Database ORM with Drizzle
- `typescript`: Full TypeScript support

## Project Type

- `single`: Single project (not a monorepo)

## Variables

- `projectName`: Name of the project (automatically provided)
- `dbUrl`: Database URL (prompted, default: `file:./db.sqlite`)
- `port`: Server port (prompted, default: `3000`)

## Usage

This template creates a web server with:

- **Hono**: Fast web framework
- **Drizzle ORM**: Type-safe SQL ORM
- **LibSQL**: SQLite-compatible database client
- Example schema and routes
- Markers for addon integration

## Structure

```
{{projectName}}/
├── src/
│   ├── db/
│   │   ├── schema.ts    # Database schema
│   │   └── index.ts     # Database connection
│   ├── routes/
│   │   └── example.ts   # Example routes
│   └── index.ts         # Main server file
├── drizzle.config.ts    # Drizzle configuration
└── .env.example        # Environment variables template
```

## Scripts

- `pnpm dev`: Run the server in development mode with hot reload
- `pnpm build`: Compile TypeScript to JavaScript
- `pnpm start`: Run the compiled server
- `pnpm db:generate`: Generate database migrations
- `pnpm db:migrate`: Run database migrations
- `pnpm db:push`: Push schema changes to database
- `pnpm db:studio`: Open Drizzle Studio
- `pnpm type-check`: Check TypeScript types

## Setup

1. Copy `.env.example` to `.env` and configure:
   ```bash
   DATABASE_URL=file:./db.sqlite
   PORT=3000
   ```

2. Initialize the database:
   ```bash
   pnpm db:push
   ```

3. Start the server:
   ```bash
   pnpm dev
   ```

## Addon Markers

The template includes markers for addon integration:

- `// @addon:imports`: Place to add imports
- `// @addon:auth`: Place to add authentication middleware
- `// @addon:routes`: Place to add routes

## Example

```bash
create-hexp create --base base-hono-drizzle --name my-api --single
```

## Compatible Addons

- `addon-auth`: Add authentication with JWT
- `addon-docker`: Add Docker support

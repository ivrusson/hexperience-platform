# addon-docker

Add Docker support to any project with Dockerfile and docker-compose.yml.

## Requirements

None - compatible with any base template.

## Provides

- Dockerfile for containerization
- docker-compose.yml for local development
- .dockerignore for optimized builds

## Variables

- `projectName`: Name of the project (automatically provided)
- `port`: Server port (default: 3000, can be customized)

## Usage

This addon adds Docker support to your project:

- **Dockerfile**: Multi-stage build for production
- **docker-compose.yml**: Local development setup
- **.dockerignore**: Excludes unnecessary files from Docker context

## Building

```bash
docker build -t {{projectName}} .
```

## Running with Docker Compose

```bash
docker-compose up
```

## Customization

The Dockerfile uses a generic Node.js setup. For monorepos, you may need to adjust the build process to handle workspace dependencies.

## Compatible Bases

- `base-minimal-node`
- `base-monorepo-turbo`
- `base-hono-drizzle`
- Any other base template

# @hexp/registry

Registry client for downloading and managing remote Hexperience templates.

## Features

- List and search templates from remote registry
- Download templates with semantic versioning support
- Local caching with integrity validation
- Version range resolution (^, ~, latest, etc.)
- Retry logic with exponential backoff
- Error handling

## Usage

```typescript
import { RegistryClient } from '@hexp/registry'

const client = new RegistryClient({
  baseUrl: 'https://registry.hexperience.dev',
  timeout: 30000,
  retries: 3,
})

// List templates
const templates = await client.listTemplates({ type: 'base' })

// Get template metadata
const template = await client.getTemplate('base-hono-drizzle')

// Get versions
const versions = await client.getVersions('base-hono-drizzle')

// Download with caching
const { path, version } = await client.downloadTemplateCached(
  'base-hono-drizzle',
  '^1.0.0'
)

// Search templates
const results = await client.searchTemplates({ q: 'hono' })

// Cache management
const cache = client.getCache()
const cached = await cache.list()
await cache.clear('base-hono-drizzle', '1.0.0')
```

## Version Resolution

Supports semantic versioning ranges:
- `latest` or `*`: Latest version
- `1.2.0`: Exact version
- `^1.2.0`: Compatible with 1.2.0 (>=1.2.0 <2.0.0)
- `~1.2.0`: Patch updates only (>=1.2.0 <1.3.0)
- `>=1.2.0`: Greater than or equal to 1.2.0

## Caching

Templates are cached in:
- `~/.hexperience/cache/templates/` (or `$XDG_CACHE_HOME/hexperience/cache/templates/`)

Cache includes:
- Template archive (tar.gz)
- Metadata (version, checksum, cached date)
- Integrity validation using checksums

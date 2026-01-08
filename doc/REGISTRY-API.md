# Registry API Specification

## Overview

The Hexperience Registry API provides a centralized service for discovering, downloading, and managing remote templates. Templates are versioned using semantic versioning and can be cached locally for offline use.

## Base URL

The registry base URL is configurable and defaults to:
```
https://registry.hexperience.dev
```

## Authentication

Currently, the registry API is public and does not require authentication. Future versions may support:
- API keys for private templates
- OAuth for user-specific templates
- Rate limiting per IP/API key

## Endpoints

### 1. List Templates

List all available templates in the registry.

**Endpoint:** `GET /templates`

**Query Parameters:**
- `type` (optional): Filter by template type (`base` or `addon`)
- `search` (optional): Search templates by name or description
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "templates": [
    {
      "id": "base-hono-drizzle",
      "type": "base",
      "name": "Hono + Drizzle",
      "description": "A web server template with Hono framework and Drizzle ORM",
      "latestVersion": "1.2.0",
      "publishedAt": "2024-01-15T10:00:00Z",
      "downloads": 1234,
      "capabilities": ["web-server", "orm", "typescript"],
      "projectType": "single"
    }
  ],
  "total": 42,
  "limit": 100,
  "offset": 0
}
```

### 2. Get Template Metadata

Get detailed metadata for a specific template.

**Endpoint:** `GET /templates/{id}`

**Response:**
```json
{
  "id": "base-hono-drizzle",
  "type": "base",
  "name": "Hono + Drizzle",
  "description": "A web server template with Hono framework and Drizzle ORM",
  "latestVersion": "1.2.0",
  "publishedAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T14:30:00Z",
  "downloads": 1234,
  "capabilities": ["web-server", "orm", "typescript"],
  "projectType": "single",
  "author": {
    "name": "Hexperience Team",
    "email": "team@hexperience.dev"
  },
  "repository": "https://github.com/hexperience/templates",
  "license": "MIT",
  "tags": ["web", "api", "orm", "typescript"]
}
```

**Error Responses:**
- `404 Not Found`: Template not found

### 3. List Template Versions

List all available versions for a template.

**Endpoint:** `GET /templates/{id}/versions`

**Query Parameters:**
- `limit` (optional): Maximum number of results (default: 100)

**Response:**
```json
{
  "templateId": "base-hono-drizzle",
  "versions": [
    {
      "version": "1.2.0",
      "publishedAt": "2024-01-20T14:30:00Z",
      "downloads": 234,
      "changelog": "Added support for PostgreSQL",
      "isLatest": true
    },
    {
      "version": "1.1.0",
      "publishedAt": "2024-01-15T10:00:00Z",
      "downloads": 567,
      "changelog": "Bug fixes",
      "isLatest": false
    },
    {
      "version": "1.0.0",
      "publishedAt": "2024-01-10T08:00:00Z",
      "downloads": 433,
      "changelog": "Initial release",
      "isLatest": false
    }
  ],
  "total": 3
}
```

### 4. Get Specific Version

Get metadata for a specific template version.

**Endpoint:** `GET /templates/{id}/versions/{version}`

**Response:**
```json
{
  "templateId": "base-hono-drizzle",
  "version": "1.2.0",
  "publishedAt": "2024-01-20T14:30:00Z",
  "downloads": 234,
  "changelog": "Added support for PostgreSQL",
  "isLatest": true,
  "manifest": {
    "id": "base-hono-drizzle",
    "type": "base",
    "name": "Hono + Drizzle",
    "description": "A web server template with Hono framework and Drizzle ORM",
    "projectType": "single",
    "capabilities": ["web-server", "orm", "typescript"],
    "prompts": [...],
    "ops": [...]
  },
  "checksum": "sha256:abc123...",
  "size": 45678
}
```

**Error Responses:**
- `404 Not Found`: Template or version not found

### 5. Download Template

Download a specific template version as a tarball.

**Endpoint:** `GET /templates/{id}/versions/{version}/download`

**Query Parameters:**
- `format` (optional): Archive format (`tar.gz` or `zip`, default: `tar.gz`)

**Response:**
- Content-Type: `application/gzip` or `application/zip`
- Content-Disposition: `attachment; filename="base-hono-drizzle-1.2.0.tar.gz"`
- Body: Binary archive file

**Error Responses:**
- `404 Not Found`: Template or version not found
- `429 Too Many Requests`: Rate limit exceeded

### 6. Get Latest Version

Get the latest version of a template (convenience endpoint).

**Endpoint:** `GET /templates/{id}/latest`

**Response:**
Same as `GET /templates/{id}/versions/{version}` for the latest version.

**Error Responses:**
- `404 Not Found`: Template not found

### 7. Search Templates

Search templates by name, description, or tags.

**Endpoint:** `GET /templates/search`

**Query Parameters:**
- `q` (required): Search query
- `type` (optional): Filter by template type
- `tags` (optional): Comma-separated list of tags
- `limit` (optional): Maximum number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
Same format as `GET /templates`

## Version Resolution

The registry supports semantic versioning with range resolution:

- `latest` or `*`: Latest version
- `1.2.0`: Exact version
- `^1.2.0`: Compatible with 1.2.0 (>=1.2.0 <2.0.0)
- `~1.2.0`: Patch updates only (>=1.2.0 <1.3.0)
- `>=1.2.0`: Greater than or equal to 1.2.0
- `<=1.2.0`: Less than or equal to 1.2.0

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": {
    "code": "TEMPLATE_NOT_FOUND",
    "message": "Template 'base-invalid' not found",
    "details": {}
  }
}
```

**Common Error Codes:**
- `TEMPLATE_NOT_FOUND`: Template does not exist
- `VERSION_NOT_FOUND`: Version does not exist
- `INVALID_VERSION`: Version format is invalid
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVER_ERROR`: Internal server error

## Rate Limiting

Rate limits (future):
- Public API: 100 requests per hour per IP
- Authenticated: 1000 requests per hour per API key

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Caching

Clients should implement local caching:
- Cache templates in `~/.hexperience/cache/templates/{id}/{version}/`
- Validate cache integrity using checksums
- Implement cache expiration (default: 7 days)
- Support cache invalidation and clearing

## Future Enhancements

- Template ratings and reviews
- Dependency resolution between templates
- Template categories and collections
- Webhook notifications for template updates
- Template analytics and usage statistics

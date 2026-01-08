/**
 * Template metadata from registry
 */
export interface TemplateMetadata {
  id: string
  type: 'base' | 'addon'
  name: string
  description: string
  latestVersion: string
  publishedAt: string
  updatedAt?: string
  downloads: number
  capabilities?: string[]
  projectType?: 'single' | 'monorepo'
  author?: {
    name: string
    email?: string
  }
  repository?: string
  license?: string
  tags?: string[]
}

/**
 * Template version information
 */
export interface TemplateVersion {
  version: string
  publishedAt: string
  downloads: number
  changelog?: string
  isLatest: boolean
}

/**
 * Detailed version information with manifest
 */
export interface TemplateVersionDetail extends TemplateVersion {
  templateId: string
  manifest: unknown
  checksum?: string
  size?: number
}

/**
 * List templates response
 */
export interface ListTemplatesResponse {
  templates: TemplateMetadata[]
  total: number
  limit: number
  offset: number
}

/**
 * List versions response
 */
export interface ListVersionsResponse {
  templateId: string
  versions: TemplateVersion[]
  total: number
}

/**
 * Registry error response
 */
export interface RegistryError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

/**
 * Registry client options
 */
export interface RegistryClientOptions {
  baseUrl?: string
  timeout?: number
  retries?: number
  retryDelay?: number
}

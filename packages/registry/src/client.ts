import { request } from 'undici'
import { TemplateCache } from './cache.js'
import {
  NetworkError,
  RateLimitError,
  RegistryError,
  TemplateNotFoundError,
  VersionNotFoundError,
} from './errors.js'
import type {
  ListTemplatesResponse,
  ListVersionsResponse,
  RegistryClientOptions,
  TemplateMetadata,
  TemplateVersionDetail,
} from './types.js'
import { findBestVersion } from './version.js'

/**
 * Registry API client
 */
export class RegistryClient {
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly retries: number
  private readonly retryDelay: number
  private readonly cache: TemplateCache

  constructor(options: RegistryClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://registry.hexperience.dev'
    this.timeout = options.timeout || 30000
    this.retries = options.retries || 3
    this.retryDelay = options.retryDelay || 1000
    this.cache = new TemplateCache()
  }

  /**
   * Make HTTP request with retries
   */
  private async request<T>(
    path: string,
    options: { method?: string; headers?: Record<string, string> } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await request(url, {
          method: (options.method || 'GET') as
            | 'GET'
            | 'POST'
            | 'PUT'
            | 'DELETE'
            | 'PATCH'
            | 'HEAD'
            | 'OPTIONS',
          headers: {
            'User-Agent': 'hexperience-cli',
            Accept: 'application/json',
            ...options.headers,
          },
          bodyTimeout: this.timeout,
          headersTimeout: this.timeout,
        })

        // Handle rate limiting
        if (response.statusCode === 429) {
          const retryAfter = response.headers['retry-after']
            ? parseInt(response.headers['retry-after'] as string, 10)
            : undefined
          throw new RateLimitError('Rate limit exceeded', retryAfter)
        }

        // Handle errors
        if (response.statusCode && response.statusCode >= 400) {
          const errorData = (await response.body.json()) as {
            error?: { code: string; message: string }
          }

          if (response.statusCode === 404) {
            if (errorData.error?.code === 'VERSION_NOT_FOUND') {
              throw new VersionNotFoundError('', '')
            }
            throw new TemplateNotFoundError('')
          }

          throw new RegistryError(
            errorData.error?.message || `HTTP ${response.statusCode}`,
            errorData.error?.code || 'HTTP_ERROR',
            response.statusCode
          )
        }

        // Parse JSON response
        const data = (await response.body.json()) as T
        return data
      } catch (error) {
        lastError = error as Error

        // Don't retry on certain errors
        if (
          error instanceof RateLimitError ||
          error instanceof TemplateNotFoundError ||
          error instanceof VersionNotFoundError
        ) {
          throw error
        }

        // Retry with exponential backoff
        if (attempt < this.retries) {
          const delay = this.retryDelay * 2 ** attempt
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw new NetworkError(
      `Request failed after ${this.retries + 1} attempts`,
      lastError || undefined
    )
  }

  /**
   * List all templates
   */
  async listTemplates(
    options: {
      type?: 'base' | 'addon'
      search?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<ListTemplatesResponse> {
    const params = new URLSearchParams()
    if (options.type) params.append('type', options.type)
    if (options.search) params.append('search', options.search)
    if (options.limit) params.append('limit', String(options.limit))
    if (options.offset) params.append('offset', String(options.offset))

    const query = params.toString()
    return this.request<ListTemplatesResponse>(
      `/templates${query ? `?${query}` : ''}`
    )
  }

  /**
   * Get template metadata
   */
  async getTemplate(templateId: string): Promise<TemplateMetadata> {
    try {
      return await this.request<TemplateMetadata>(`/templates/${templateId}`)
    } catch (error) {
      if (error instanceof RegistryError && error.statusCode === 404) {
        throw new TemplateNotFoundError(templateId)
      }
      throw error
    }
  }

  /**
   * List template versions
   */
  async getVersions(
    templateId: string,
    limit?: number
  ): Promise<ListVersionsResponse> {
    try {
      const params = new URLSearchParams()
      if (limit) params.append('limit', String(limit))

      const query = params.toString()
      return this.request<ListVersionsResponse>(
        `/templates/${templateId}/versions${query ? `?${query}` : ''}`
      )
    } catch (error) {
      if (error instanceof RegistryError && error.statusCode === 404) {
        throw new TemplateNotFoundError(templateId)
      }
      throw error
    }
  }

  /**
   * Get specific version
   */
  async getVersion(
    templateId: string,
    version: string
  ): Promise<TemplateVersionDetail> {
    try {
      return await this.request<TemplateVersionDetail>(
        `/templates/${templateId}/versions/${version}`
      )
    } catch (error) {
      if (error instanceof RegistryError && error.statusCode === 404) {
        throw new VersionNotFoundError(templateId, version)
      }
      throw error
    }
  }

  /**
   * Get latest version
   */
  async getLatestVersion(templateId: string): Promise<TemplateVersionDetail> {
    try {
      return await this.request<TemplateVersionDetail>(
        `/templates/${templateId}/latest`
      )
    } catch (error) {
      if (error instanceof RegistryError && error.statusCode === 404) {
        throw new TemplateNotFoundError(templateId)
      }
      throw error
    }
  }

  /**
   * Download template
   */
  async downloadTemplate(
    templateId: string,
    version: string,
    format: 'tar.gz' | 'zip' = 'tar.gz'
  ): Promise<Buffer> {
    try {
      const url = `${this.baseUrl}/templates/${templateId}/versions/${version}/download?format=${format}`
      const response = await request(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'hexperience-cli',
        },
        bodyTimeout: this.timeout * 2, // Longer timeout for downloads
        headersTimeout: this.timeout,
      })

      if (response.statusCode && response.statusCode >= 400) {
        if (response.statusCode === 404) {
          throw new VersionNotFoundError(templateId, version)
        }
        throw new RegistryError(
          `Download failed: HTTP ${response.statusCode}`,
          'DOWNLOAD_ERROR',
          response.statusCode
        )
      }

      const buffer = await response.body.arrayBuffer()
      return Buffer.from(buffer)
    } catch (error) {
      if (
        error instanceof TemplateNotFoundError ||
        error instanceof VersionNotFoundError
      ) {
        throw error
      }
      throw new NetworkError(
        `Failed to download template: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Resolve version (handles ranges like ^1.0.0, latest, etc.)
   */
  async resolveVersion(
    templateId: string,
    versionRange: string
  ): Promise<string> {
    if (
      versionRange === 'latest' ||
      versionRange === '*' ||
      versionRange === ''
    ) {
      const latest = await this.getLatestVersion(templateId)
      return latest.version
    }

    // Get all versions and find best match
    const versionsResponse = await this.getVersions(templateId)
    const versions = versionsResponse.versions.map((v) => v.version)
    const bestVersion = findBestVersion(versions, versionRange)

    if (!bestVersion) {
      throw new VersionNotFoundError(templateId, versionRange)
    }

    return bestVersion
  }

  /**
   * Download template with caching
   */
  async downloadTemplateCached(
    templateId: string,
    versionRange: string = 'latest'
  ): Promise<{ path: string; version: string }> {
    // Resolve version
    const version = await this.resolveVersion(templateId, versionRange)

    // Check cache first
    if (this.cache.isCached(templateId, version)) {
      const cachedPath = this.cache.getCachedPath(templateId, version)
      if (cachedPath) {
        // Validate cache
        const versionDetail = await this.getVersion(templateId, version)
        if (
          this.cache.isValid(templateId, version, 7, versionDetail.checksum)
        ) {
          return { path: cachedPath, version }
        }
      }
    }

    // Download and cache
    const data = await this.downloadTemplate(templateId, version)
    const versionDetail = await this.getVersion(templateId, version)
    this.cache.store(templateId, version, data, versionDetail.checksum)

    const cachedPath = this.cache.getCachedPath(templateId, version)
    if (!cachedPath) {
      throw new Error('Failed to cache template')
    }

    return { path: cachedPath, version }
  }

  /**
   * Search templates
   */
  async searchTemplates(options: {
    q: string
    type?: 'base' | 'addon'
    tags?: string[]
    limit?: number
    offset?: number
  }): Promise<ListTemplatesResponse> {
    const params = new URLSearchParams()
    params.append('q', options.q)
    if (options.type) params.append('type', options.type)
    if (options.tags) params.append('tags', options.tags.join(','))
    if (options.limit) params.append('limit', String(options.limit))
    if (options.offset) params.append('offset', String(options.offset))

    return this.request<ListTemplatesResponse>(
      `/templates/search?${params.toString()}`
    )
  }

  /**
   * Get cache instance
   */
  getCache(): TemplateCache {
    return this.cache
  }
}

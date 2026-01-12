import {
  clearCache as clearStorageCache,
  getCachedTemplatePath,
  getCacheMetadata,
  isCached,
  listCachedTemplates,
  storeTemplate,
  validateCacheIntegrity,
} from './storage'

/**
 * Cache manager for templates
 */
export class TemplateCache {
  /**
   * Check if a template version is cached
   */
  isCached(templateId: string, version: string): boolean {
    return isCached(templateId, version)
  }

  /**
   * Get cached template path
   */
  getCachedPath(templateId: string, version: string): string | null {
    return getCachedTemplatePath(templateId, version)
  }

  /**
   * Store template in cache
   */
  store(
    templateId: string,
    version: string,
    data: Buffer,
    checksum?: string
  ): void {
    storeTemplate(templateId, version, data, checksum)
  }

  /**
   * Validate cache integrity
   */
  validate(
    templateId: string,
    version: string,
    expectedChecksum?: string
  ): boolean {
    return validateCacheIntegrity(templateId, version, expectedChecksum)
  }

  /**
   * Get cache metadata
   */
  getMetadata(
    templateId: string,
    version: string
  ): {
    templateId: string
    version: string
    cachedAt: string
    checksum?: string
    size: number
  } | null {
    return getCacheMetadata(templateId, version)
  }

  /**
   * List all cached templates
   */
  async list(): Promise<
    Array<{
      templateId: string
      version: string
      cachedAt: string
      size: number
    }>
  > {
    return listCachedTemplates()
  }

  /**
   * Clear cache
   */
  async clear(templateId?: string, version?: string): Promise<void> {
    return clearStorageCache(templateId, version)
  }

  /**
   * Check if cached template is valid and not expired
   */
  isValid(
    templateId: string,
    version: string,
    maxAgeDays: number = 7,
    expectedChecksum?: string
  ): boolean {
    if (!this.isCached(templateId, version)) {
      return false
    }

    const metadata = this.getMetadata(templateId, version)
    if (!metadata) {
      return false
    }

    // Check age
    const cachedAt = new Date(metadata.cachedAt)
    const ageDays = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (ageDays > maxAgeDays) {
      return false
    }

    // Validate checksum if provided
    if (expectedChecksum) {
      return this.validate(templateId, version, expectedChecksum)
    }

    return true
  }
}

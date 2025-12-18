import { resolve } from 'node:path'
import type { AddonTemplate, BaseTemplate } from '@hexp/shared'
import { CatalogResolver, type CatalogResult } from './resolver.js'

/**
 * Main catalog class for discovering and querying templates
 */
export class Catalog {
  private readonly templatesDir: string
  private cache: CatalogResult | null = null

  /**
   * Create a new Catalog instance
   * @param templatesDir - Base directory containing templates/bases/ and templates/addons/
   */
  constructor(templatesDir: string) {
    this.templatesDir = resolve(templatesDir)
  }

  /**
   * Get all base templates
   * @returns Array of base templates
   */
  async getBases(): Promise<BaseTemplate[]> {
    const result = await this.getCatalogResult()
    return result.bases
  }

  /**
   * Get all addon templates
   * @returns Array of addon templates
   */
  async getAddons(): Promise<AddonTemplate[]> {
    const result = await this.getCatalogResult()
    return result.addons
  }

  /**
   * Get a template by its ID
   * @param id - Template ID to search for
   * @returns Template if found, null otherwise
   */
  async getTemplateById(
    id: string
  ): Promise<BaseTemplate | AddonTemplate | null> {
    const result = await this.getCatalogResult()

    // Search in bases first
    const base = result.bases.find((b) => b.id === id)
    if (base) {
      return base
    }

    // Then search in addons
    const addon = result.addons.find((a) => a.id === id)
    if (addon) {
      return addon
    }

    return null
  }

  /**
   * Refresh the catalog cache by re-scanning templates
   */
  async refresh(): Promise<void> {
    this.cache = null
    await this.getCatalogResult()
  }

  /**
   * Get catalog result, using cache if available
   */
  private async getCatalogResult(): Promise<CatalogResult> {
    if (this.cache === null) {
      this.cache = await CatalogResolver.scanTemplates(this.templatesDir)
    }
    return this.cache
  }

  /**
   * Get all errors encountered during the last scan
   * @returns Array of scan errors
   */
  async getErrors(): Promise<Array<{ path: string; error: string }>> {
    const result = await this.getCatalogResult()
    return result.errors
  }
}

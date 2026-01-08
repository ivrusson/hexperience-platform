import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { readdir, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

/**
 * Get the cache directory path
 */
export function getCacheDir(): string {
  const home = homedir()
  const xdgCache = process.env.XDG_CACHE_HOME
  if (xdgCache) {
    return join(xdgCache, 'hexperience', 'cache', 'templates')
  }
  return join(home, '.hexperience', 'cache', 'templates')
}

/**
 * Get template cache path
 */
export function getTemplateCachePath(templateId: string, version: string): string {
  return join(getCacheDir(), templateId, version)
}

/**
 * Ensure cache directory exists
 */
export function ensureCacheDir(): void {
  const cacheDir = getCacheDir()
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true })
  }
}

/**
 * Store template in cache
 */
export function storeTemplate(
  templateId: string,
  version: string,
  data: Buffer,
  checksum?: string
): void {
  ensureCacheDir()
  const cachePath = getTemplateCachePath(templateId, version)
  mkdirSync(cachePath, { recursive: true })

  // Write template archive
  const archivePath = join(cachePath, 'template.tar.gz')
  writeFileSync(archivePath, data)

  // Write metadata
  const metadata = {
    templateId,
    version,
    cachedAt: new Date().toISOString(),
    checksum,
    size: data.length,
  }
  writeFileSync(
    join(cachePath, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  )
}

/**
 * Check if template is cached
 */
export function isCached(templateId: string, version: string): boolean {
  const cachePath = getTemplateCachePath(templateId, version)
  return existsSync(join(cachePath, 'template.tar.gz'))
}

/**
 * Get cached template path
 */
export function getCachedTemplatePath(templateId: string, version: string): string | null {
  const cachePath = getTemplateCachePath(templateId, version)
  const archivePath = join(cachePath, 'template.tar.gz')
  if (existsSync(archivePath)) {
    return archivePath
  }
  return null
}

/**
 * Get cache metadata
 */
export function getCacheMetadata(
  templateId: string,
  version: string
): { templateId: string; version: string; cachedAt: string; checksum?: string; size: number } | null {
  const cachePath = getTemplateCachePath(templateId, version)
  const metadataPath = join(cachePath, 'metadata.json')
  if (!existsSync(metadataPath)) {
    return null
  }

  try {
    const content = readFileSync(metadataPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * Validate cache integrity using checksum
 */
export function validateCacheIntegrity(
  templateId: string,
  version: string,
  expectedChecksum?: string
): boolean {
  if (!expectedChecksum) {
    return true // No checksum to validate
  }

  const archivePath = getCachedTemplatePath(templateId, version)
  if (!archivePath) {
    return false
  }

  const data = readFileSync(archivePath)
  const hash = createHash('sha256').update(data).digest('hex')
  const actualChecksum = `sha256:${hash}`

  return actualChecksum === expectedChecksum
}

/**
 * List all cached templates
 */
export async function listCachedTemplates(): Promise<
  Array<{ templateId: string; version: string; cachedAt: string; size: number }>
> {
  const cacheDir = getCacheDir()
  if (!existsSync(cacheDir)) {
    return []
  }

  const templates: Array<{ templateId: string; version: string; cachedAt: string; size: number }> = []

  try {
    const templateDirs = await readdir(cacheDir, { withFileTypes: true })
    for (const templateDir of templateDirs) {
      if (!templateDir.isDirectory()) continue

      const templateId = templateDir.name
      const versionDirs = await readdir(join(cacheDir, templateId), {
        withFileTypes: true,
      })

      for (const versionDir of versionDirs) {
        if (!versionDir.isDirectory()) continue

        const version = versionDir.name
        const metadata = getCacheMetadata(templateId, version)
        if (metadata) {
          templates.push({
            templateId,
            version,
            cachedAt: metadata.cachedAt,
            size: metadata.size,
          })
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return templates
}

/**
 * Clear cache for a specific template or all templates
 */
export async function clearCache(templateId?: string, version?: string): Promise<void> {
  const cacheDir = getCacheDir()
  if (!existsSync(cacheDir)) {
    return
  }

  if (templateId && version) {
    // Clear specific version
    const cachePath = getTemplateCachePath(templateId, version)
    if (existsSync(cachePath)) {
      await rm(cachePath, { recursive: true, force: true })
    }
  } else if (templateId) {
    // Clear all versions of a template
    const templatePath = join(cacheDir, templateId)
    if (existsSync(templatePath)) {
      await rm(templatePath, { recursive: true, force: true })
    }
  } else {
    // Clear all cache
    await rm(cacheDir, { recursive: true, force: true })
  }
}

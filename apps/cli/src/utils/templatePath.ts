import { readdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

/**
 * Find the template directory path by template ID
 */
export async function findTemplatePath(
  templatesDir: string,
  templateId: string,
  type: 'base' | 'addon'
): Promise<string | null> {
  const resolvedTemplatesDir = resolve(templatesDir)
  const typeDir = join(
    resolvedTemplatesDir,
    'templates',
    type === 'base' ? 'bases' : 'addons'
  )

  try {
    const entries = await readdir(typeDir, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const manifestPath = join(typeDir, entry.name, 'manifest.json')
        try {
          const statResult = await stat(manifestPath)
          if (statResult.isFile()) {
            // We found a manifest, but we need to check if the ID matches
            // For now, we'll assume the directory name matches the template ID
            // This is a reasonable assumption based on the structure
            if (entry.name === templateId) {
              return dirname(manifestPath)
            }
          }
        } catch {}
      }
    }
  } catch {
    // Directory doesn't exist
    return null
  }

  return null
}

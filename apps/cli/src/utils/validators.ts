import type { AddonTemplate, BaseTemplate } from '@hexp/catalog'

/**
 * Check if addons are compatible with the base template
 */
export function validateCompatibility(
  base: BaseTemplate,
  addons: AddonTemplate[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const addon of addons) {
    // Check if addon requires capabilities that base provides
    if (addon.requires && addon.requires.length > 0) {
      const missing = addon.requires.filter(
        (req: string) => !base.capabilities.includes(req)
      )
      if (missing.length > 0) {
        errors.push(
          `Addon "${addon.id}" requires capabilities that base "${base.id}" doesn't provide: ${missing.join(', ')}`
        )
      }
    }

    // Check for conflicts between addons
    if (addon.conflicts && addon.conflicts.length > 0) {
      const conflicting = addons.filter(
        (a) => a.id !== addon.id && addon.conflicts?.includes(a.id)
      )
      if (conflicting.length > 0) {
        errors.push(
          `Addon "${addon.id}" conflicts with: ${conflicting.map((a) => a.id).join(', ')}`
        )
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): {
  valid: boolean
  error?: string
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name cannot be empty' }
  }

  // Check for valid package name format
  if (!/^[a-z0-9-]+$/.test(name)) {
    return {
      valid: false,
      error:
        'Project name must contain only lowercase letters, numbers, and hyphens',
    }
  }

  return { valid: true }
}

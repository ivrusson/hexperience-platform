import type { AddonTemplate, BaseTemplate } from '@hexp/catalog'

/**
 * Result of compatibility check
 */
export interface CompatibilityResult {
  /** Whether all addons are compatible with the base */
  isCompatible: boolean
  /** Missing capabilities per addon ID */
  missingCapabilities: Map<string, string[]>
  /** Compatibility matrix: addon ID -> is compatible */
  compatibilityMatrix: Map<string, boolean>
  /** All capabilities available (base + addons) */
  allCapabilities: Set<string>
}

/**
 * CompatibilityChecker validates that base provides all required capabilities
 */
export class CompatibilityChecker {
  /**
   * Check compatibility between base and addons
   */
  static check(
    base: BaseTemplate,
    addons: AddonTemplate[]
  ): CompatibilityResult {
    const missingCapabilities = new Map<string, string[]>()
    const compatibilityMatrix = new Map<string, boolean>()
    const allCapabilities = new Set<string>(base.capabilities)

    // Track capabilities provided by addons
    const addonCapabilities = new Map<string, Set<string>>()

    // First pass: collect all capabilities from addons
    for (const addon of addons) {
      const provided = new Set<string>(addon.provides || [])
      addonCapabilities.set(addon.id, provided)
      for (const cap of provided) {
        allCapabilities.add(cap)
      }
    }

    // Second pass: check compatibility
    for (const addon of addons) {
      const required = addon.requires || []
      const missing: string[] = []

      // Check each required capability
      for (const req of required) {
        // Check if base provides it
        if (base.capabilities.includes(req)) {
          continue
        }

        // Check if any previously processed addon provides it
        let found = false
        for (const [otherAddonId, provided] of addonCapabilities) {
          if (provided.has(req)) {
            found = true
            break
          }
        }

        if (!found) {
          missing.push(req)
        }
      }

      if (missing.length > 0) {
        missingCapabilities.set(addon.id, missing)
        compatibilityMatrix.set(addon.id, false)
      } else {
        compatibilityMatrix.set(addon.id, true)
      }
    }

    const isCompatible = missingCapabilities.size === 0

    return {
      isCompatible,
      missingCapabilities,
      compatibilityMatrix,
      allCapabilities,
    }
  }

  /**
   * Get error message for compatibility issues
   */
  static getErrorMessage(result: CompatibilityResult, base: BaseTemplate): string {
    if (result.isCompatible) {
      return ''
    }

    const messages: string[] = []
    messages.push('Compatibility errors found:')

    for (const [addonId, missing] of result.missingCapabilities) {
      messages.push(
        `  Addon '${addonId}' requires capabilities [${missing.join(', ')}] but base '${base.id}' does not provide them`
      )
    }

    return messages.join('\n')
  }
}

import type { AddonTemplate } from '@hexp/catalog'

/**
 * Conflict information
 */
export interface ConflictInfo {
  addon1: string
  addon2: string
  reason: string
}

/**
 * Result of conflict detection
 */
export interface ConflictResult {
  /** Whether there are any conflicts */
  hasConflicts: boolean
  /** List of conflicts found */
  conflicts: ConflictInfo[]
  /** Suggestions for alternative addons */
  suggestions: Map<string, string[]>
}

/**
 * ConflictDetector finds conflicts between addons
 */
export class ConflictDetector {
  /**
   * Check for conflicts between addons
   */
  static check(addons: AddonTemplate[]): ConflictResult {
    const conflicts: ConflictInfo[] = []
    const addonMap = new Map<string, AddonTemplate>()
    const suggestions = new Map<string, string[]>()

    // Build addon map for quick lookup
    for (const addon of addons) {
      addonMap.set(addon.id, addon)
    }

    // Check for conflicts
    for (let i = 0; i < addons.length; i++) {
      const addon1 = addons[i]
      const conflicts1 = addon1.conflicts || []

      for (let j = i + 1; j < addons.length; j++) {
        const addon2 = addons[j]

        // Check if addon1 conflicts with addon2
        if (conflicts1.includes(addon2.id)) {
          conflicts.push({
            addon1: addon1.id,
            addon2: addon2.id,
            reason: `Addon '${addon1.id}' conflicts with '${addon2.id}'`,
          })
        }

        // Check if addon2 conflicts with addon1 (bidirectional)
        const conflicts2 = addon2.conflicts || []
        if (conflicts2.includes(addon1.id)) {
          // Avoid duplicates
          const alreadyExists = conflicts.some(
            (c) =>
              (c.addon1 === addon1.id && c.addon2 === addon2.id) ||
              (c.addon1 === addon2.id && c.addon2 === addon1.id)
          )

          if (!alreadyExists) {
            conflicts.push({
              addon1: addon2.id,
              addon2: addon1.id,
              reason: `Addon '${addon2.id}' conflicts with '${addon1.id}'`,
            })
          }
        }
      }
    }

    // Generate suggestions for conflicting addons
    for (const conflict of conflicts) {
      const addon1 = addonMap.get(conflict.addon1)
      const addon2 = addonMap.get(conflict.addon2)

      if (!addon1 || !addon2) continue

      // Find alternatives for addon2 that don't conflict with addon1
      const alternatives: string[] = []
      const provides2 = new Set(addon2.provides || [])

      for (const candidate of addons) {
        if (candidate.id === addon1.id || candidate.id === addon2.id) continue

        // Check if candidate provides similar capabilities
        const candidateProvides = new Set(candidate.provides || [])
        const hasSimilarCapabilities = Array.from(provides2).some((cap) =>
          candidateProvides.has(cap)
        )

        if (hasSimilarCapabilities) {
          // Check if candidate conflicts with addon1
          const candidateConflicts = candidate.conflicts || []
          if (!candidateConflicts.includes(addon1.id)) {
            const addon1Conflicts = addon1.conflicts || []
            if (!addon1Conflicts.includes(candidate.id)) {
              alternatives.push(candidate.id)
            }
          }
        }
      }

      if (alternatives.length > 0) {
        suggestions.set(conflict.addon2, alternatives)
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      suggestions,
    }
  }

  /**
   * Get error message for conflicts
   */
  static getErrorMessage(result: ConflictResult): string {
    if (!result.hasConflicts) {
      return ''
    }

    const messages: string[] = []
    messages.push('Conflicts detected between addons:')

    for (const conflict of result.conflicts) {
      messages.push(`  ${conflict.reason}`)
      const suggestions = result.suggestions.get(conflict.addon2)
      if (suggestions && suggestions.length > 0) {
        messages.push(
          `    Suggested alternatives for '${conflict.addon2}': ${suggestions.join(', ')}`
        )
      }
    }

    return messages.join('\n')
  }
}

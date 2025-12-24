import type { AddonTemplate, BaseTemplate } from '@hexp/catalog'
import {
  CompatibilityChecker,
  ConflictDetector,
  DependencyResolver,
  FileCollisionDetector,
  type TemplateWithOps,
} from '@hexp/validation'
import type { Operation } from '@hexp/shared'

/**
 * Consolidated validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean
  /** Compatibility check result */
  compatibility: {
    isCompatible: boolean
    missingCapabilities: Map<string, string[]>
  }
  /** Conflict detection result */
  conflicts: {
    hasConflicts: boolean
    conflicts: Array<{ addon1: string; addon2: string; reason: string }>
    suggestions: Map<string, string[]>
  }
  /** Dependency resolution result */
  dependencies: {
    orderedAddons: AddonTemplate[]
    hasCycles: boolean
    cycles: string[][]
  }
  /** File collision detection result */
  collisions: {
    hasCollisions: boolean
    collisions: Array<{
      file: string
      operations: Operation[]
      sources: string[]
    }>
  }
  /** Consolidated error messages */
  errors: string[]
  /** Warnings (non-blocking) */
  warnings: string[]
}

/**
 * Validate generation plan before executing
 */
export function validateGenerationPlan(
  base: BaseTemplate,
  addons: AddonTemplate[],
  baseOps: Operation[],
  addonOps: Array<{ addon: AddonTemplate; ops: Operation[] }>
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. Check compatibility
  const compatibilityResult = CompatibilityChecker.check(base, addons)
  if (!compatibilityResult.isCompatible) {
    errors.push(CompatibilityChecker.getErrorMessage(compatibilityResult, base))
  }

  // 2. Check conflicts
  const conflictResult = ConflictDetector.check(addons)
  if (conflictResult.hasConflicts) {
    errors.push(ConflictDetector.getErrorMessage(conflictResult))
  }

  // 3. Resolve dependencies
  const dependencyResult = DependencyResolver.resolve(addons, base.capabilities)
  if (dependencyResult.hasCycles) {
    errors.push(DependencyResolver.getErrorMessage(dependencyResult))
  }

  // 4. Check file collisions
  const baseWithOps: TemplateWithOps = {
    templateDir: '', // Not needed for collision detection
    ops: baseOps,
  }

  const addonsWithOps: TemplateWithOps[] = addonOps.map(({ ops }) => ({
    templateDir: '', // Not needed for collision detection
    ops,
  }))

  const collisionResult = FileCollisionDetector.check(baseWithOps, addonsWithOps)
  if (collisionResult.hasCollisions) {
    errors.push(FileCollisionDetector.getErrorMessage(collisionResult))
  }

  const isValid = errors.length === 0

  return {
    isValid,
    compatibility: {
      isCompatible: compatibilityResult.isCompatible,
      missingCapabilities: compatibilityResult.missingCapabilities,
    },
    conflicts: {
      hasConflicts: conflictResult.hasConflicts,
      conflicts: conflictResult.conflicts,
      suggestions: conflictResult.suggestions,
    },
    dependencies: {
      orderedAddons: dependencyResult.orderedAddons,
      hasCycles: dependencyResult.hasCycles,
      cycles: dependencyResult.cycles,
    },
    collisions: {
      hasCollisions: collisionResult.hasCollisions,
      collisions: collisionResult.collisions,
    },
    errors,
    warnings,
  }
}

/**
 * Validation system for Hexperience Platform
 * @packageDocumentation
 */

export { CompatibilityChecker } from './compatibility.js'
export type { CompatibilityResult } from './compatibility.js'

export { ConflictDetector } from './conflicts.js'
export type { ConflictInfo, ConflictResult } from './conflicts.js'

export { DependencyResolver } from './dependencies.js'
export type { ResolvedOrder } from './dependencies.js'

export { FileCollisionDetector } from './fileCollisions.js'
export type { CollisionInfo, CollisionResult, TemplateWithOps } from './fileCollisions.js'

export {
  CompatibilityError,
  ConflictError,
  DependencyCycleError,
  FileCollisionError,
} from './errors.js'

/**
 * Validation system for Hexperience Platform
 * @packageDocumentation
 */

export type { CompatibilityResult } from './compatibility'
export { CompatibilityChecker } from './compatibility'
export type { ConflictInfo, ConflictResult } from './conflicts'
export { ConflictDetector } from './conflicts'
export type { ResolvedOrder } from './dependencies'
export { DependencyResolver } from './dependencies'
export {
  CompatibilityError,
  ConflictError,
  DependencyCycleError,
  FileCollisionError,
} from './errors'
export type {
  CollisionInfo,
  CollisionResult,
  TemplateWithOps,
} from './fileCollisions'
export { FileCollisionDetector } from './fileCollisions'

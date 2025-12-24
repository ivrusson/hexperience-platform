/**
 * Error types for validation system
 */

export class CompatibilityError extends Error {
  constructor(
    message: string,
    public readonly addonId: string,
    public readonly missingCapabilities: string[]
  ) {
    super(message)
    this.name = 'CompatibilityError'
  }
}

export class ConflictError extends Error {
  constructor(
    message: string,
    public readonly conflicts: Array<{ addon1: string; addon2: string }>
  ) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class DependencyCycleError extends Error {
  constructor(
    message: string,
    public readonly cycles: string[][]
  ) {
    super(message)
    this.name = 'DependencyCycleError'
  }
}

export class FileCollisionError extends Error {
  constructor(
    message: string,
    public readonly collisions: Array<{
      file: string
      operations: string[]
      sources: string[]
    }>
  ) {
    super(message)
    this.name = 'FileCollisionError'
  }
}

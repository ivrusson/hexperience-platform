/**
 * Custom error classes for catalog operations
 */

export class ManifestNotFoundError extends Error {
  constructor(public readonly path: string) {
    super(`Manifest not found at path: ${path}`)
    this.name = 'ManifestNotFoundError'
  }
}

export class ManifestParseError extends Error {
  constructor(
    public readonly path: string,
    public readonly cause: Error
  ) {
    super(`Failed to parse manifest at ${path}: ${cause.message}`)
    this.name = 'ManifestParseError'
    this.cause = cause
  }
}

export class ManifestValidationError extends Error {
  constructor(
    public readonly path: string,
    public readonly fieldErrors: Record<string, string[]>,
    public readonly cause: Error
  ) {
    const errorMessages = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
      .join('; ')
    super(`Manifest validation failed at ${path}: ${errorMessages}`)
    this.name = 'ManifestValidationError'
    this.cause = cause
  }
}

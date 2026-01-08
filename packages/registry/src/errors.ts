/**
 * Base registry error
 */
export class RegistryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'RegistryError'
  }
}

/**
 * Template not found error
 */
export class TemplateNotFoundError extends RegistryError {
  constructor(templateId: string) {
    super(`Template '${templateId}' not found`, 'TEMPLATE_NOT_FOUND', 404, {
      templateId,
    })
    this.name = 'TemplateNotFoundError'
  }
}

/**
 * Version not found error
 */
export class VersionNotFoundError extends RegistryError {
  constructor(templateId: string, version: string) {
    super(
      `Version '${version}' not found for template '${templateId}'`,
      'VERSION_NOT_FOUND',
      404,
      { templateId, version }
    )
    this.name = 'VersionNotFoundError'
  }
}

/**
 * Invalid version error
 */
export class InvalidVersionError extends RegistryError {
  constructor(version: string) {
    super(`Invalid version format: '${version}'`, 'INVALID_VERSION', 400, {
      version,
    })
    this.name = 'InvalidVersionError'
  }
}

/**
 * Network error
 */
export class NetworkError extends RegistryError {
  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR', undefined, { cause: cause?.message })
    this.name = 'NetworkError'
    if (cause) {
      this.cause = cause
    }
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends RegistryError {
  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter })
    this.name = 'RateLimitError'
  }
}

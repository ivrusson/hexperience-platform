/**
 * Custom error types for the CLI
 */

export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class TemplateError extends Error {
  constructor(
    message: string,
    public readonly templateId?: string,
    public readonly templatePath?: string
  ) {
    super(message)
    this.name = 'TemplateError'
    Object.setPrototypeOf(this, TemplateError.prototype)
  }
}

export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly configPath?: string,
    public readonly configKey?: string
  ) {
    super(message)
    this.name = 'ConfigError'
    Object.setPrototypeOf(this, ConfigError.prototype)
  }
}

export class SystemError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly syscall?: string
  ) {
    super(message)
    this.name = 'SystemError'
    Object.setPrototypeOf(this, SystemError.prototype)
  }
}

export class OperationError extends Error {
  constructor(
    message: string,
    public readonly operationType?: string,
    public readonly context?: unknown
  ) {
    super(message)
    this.name = 'OperationError'
    Object.setPrototypeOf(this, OperationError.prototype)
  }
}

export type CLIError =
  | ValidationError
  | TemplateError
  | ConfigError
  | SystemError
  | OperationError
  | Error
/**
 * Custom error classes for the engine
 */

/**
 * Base error class for engine operations
 */
export class EngineError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'EngineError'
    Object.setPrototypeOf(this, EngineError.prototype)
  }
}

/**
 * Error thrown when a workspace operation fails
 */
export class WorkspaceError extends EngineError {
  constructor(message: string) {
    super(message, 'WORKSPACE_ERROR')
    this.name = 'WorkspaceError'
    Object.setPrototypeOf(this, WorkspaceError.prototype)
  }
}

/**
 * Error thrown when an operation fails
 */
export class OperationError extends EngineError {
  constructor(
    message: string,
    public readonly operationType: string,
    public readonly details?: unknown
  ) {
    super(message, 'OPERATION_ERROR')
    this.name = 'OperationError'
    Object.setPrototypeOf(this, OperationError.prototype)
  }
}

/**
 * Error thrown when template rendering fails
 */
export class TemplateRenderError extends OperationError {
  constructor(message: string, details?: unknown) {
    super(message, 'templateRender', details)
    this.name = 'TemplateRenderError'
    Object.setPrototypeOf(this, TemplateRenderError.prototype)
  }
}

/**
 * Error thrown when JSON merge fails
 */
export class JsonMergeError extends OperationError {
  constructor(message: string, details?: unknown) {
    super(message, 'jsonMerge', details)
    this.name = 'JsonMergeError'
    Object.setPrototypeOf(this, JsonMergeError.prototype)
  }
}

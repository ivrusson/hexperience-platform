import chalk from 'chalk'
import type { CLIError } from './errors.js'
import {
  ConfigError,
  OperationError,
  SystemError,
  TemplateError,
  ValidationError,
} from './errors.js'
import { getLogger } from './logger.js'

export enum ExitCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  VALIDATION_ERROR = 2,
  CONFIG_ERROR = 3,
  TEMPLATE_ERROR = 4,
  SYSTEM_ERROR = 5,
}

export class ErrorHandler {
  private logger = getLogger()

  /**
   * Handle an error and exit with appropriate code
   */
  handleError(error: unknown, context?: unknown): never {
    const cliError = this.normalizeError(error)
    const exitCode = this.getExitCode(cliError)
    const message = this.formatErrorMessage(cliError)
    const suggestions = this.getSuggestions(cliError)

    // Log error message
    this.logger.error(message)

    // Log suggestions if any
    if (suggestions.length > 0) {
      this.logger.info('\nSuggestions:')
      for (const suggestion of suggestions) {
        this.logger.info(`  • ${suggestion}`)
      }
    }

    // Log stack trace in verbose mode
    if (this.logger['verbose'] && cliError instanceof Error && cliError.stack) {
      this.logger.debug('\nStack trace:')
      this.logger.debug(cliError.stack)
    }

    // Log context in verbose mode
    if (this.logger['verbose'] && context) {
      this.logger.debug('\nContext:')
      this.logger.debug(JSON.stringify(context, null, 2))
    }

    process.exit(exitCode)
  }

  /**
   * Get exit code for an error
   */
  getExitCode(error: Error): ExitCode {
    if (error instanceof ValidationError) {
      return ExitCode.VALIDATION_ERROR
    }
    if (error instanceof ConfigError) {
      return ExitCode.CONFIG_ERROR
    }
    if (error instanceof TemplateError) {
      return ExitCode.TEMPLATE_ERROR
    }
    if (error instanceof SystemError) {
      return ExitCode.SYSTEM_ERROR
    }
    return ExitCode.GENERAL_ERROR
  }

  /**
   * Format error message for display
   */
  formatErrorMessage(error: Error): string {
    if (error instanceof ValidationError) {
      const field = error.field ? chalk.gray(` (field: ${error.field})`) : ''
      return `${chalk.red('Validation Error:')} ${error.message}${field}`
    }
    if (error instanceof ConfigError) {
      const path = error.configPath
        ? chalk.gray(` (file: ${error.configPath})`)
        : ''
      return `${chalk.red('Configuration Error:')} ${error.message}${path}`
    }
    if (error instanceof TemplateError) {
      const template = error.templateId
        ? chalk.gray(` (template: ${error.templateId})`)
        : ''
      return `${chalk.red('Template Error:')} ${error.message}${template}`
    }
    if (error instanceof SystemError) {
      const code = error.code ? chalk.gray(` (code: ${error.code})`) : ''
      return `${chalk.red('System Error:')} ${error.message}${code}`
    }
    if (error instanceof OperationError) {
      const op = error.operationType
        ? chalk.gray(` (operation: ${error.operationType})`)
        : ''
      return `${chalk.red('Operation Error:')} ${error.message}${op}`
    }
    return `${chalk.red('Error:')} ${error.message}`
  }

  /**
   * Get suggestions for fixing the error
   */
  getSuggestions(error: Error): string[] {
    const suggestions: string[] = []

    if (error instanceof ValidationError) {
      if (error.field) {
        suggestions.push(`Check the value of "${error.field}"`)
      }
      suggestions.push('Run with --verbose for more details')
    }

    if (error instanceof ConfigError) {
      if (error.configPath) {
        suggestions.push(`Verify the configuration file: ${error.configPath}`)
      }
      if (error.configKey) {
        suggestions.push(`Check the configuration key: ${error.configKey}`)
      }
      suggestions.push('See documentation for configuration format')
    }

    if (error instanceof TemplateError) {
      if (error.templateId) {
        suggestions.push(`Verify template exists: ${error.templateId}`)
      }
      if (error.templatePath) {
        suggestions.push(`Check template directory: ${error.templatePath}`)
      }
      suggestions.push('Run "create-hexp list" to see available templates')
    }

    if (error instanceof SystemError) {
      if (error.code === 'ENOENT') {
        suggestions.push('Check if the file or directory exists')
        suggestions.push('Verify you have read/write permissions')
      }
      if (error.code === 'EACCES') {
        suggestions.push('Check file permissions')
        suggestions.push('Try running with appropriate permissions')
      }
    }

    if (error instanceof OperationError) {
      suggestions.push('Check the operation configuration in the template')
      suggestions.push('Run with --verbose for detailed error information')
    }

    return suggestions
  }

  /**
   * Normalize unknown error to CLIError
   */
  private normalizeError(error: unknown): CLIError {
    if (error instanceof Error) {
      return error
    }
    if (typeof error === 'string') {
      return new Error(error)
    }
    return new Error('Unknown error occurred')
  }
}

// Singleton instance
let errorHandlerInstance: ErrorHandler | null = null

export function getErrorHandler(): ErrorHandler {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new ErrorHandler()
  }
  return errorHandlerInstance
}
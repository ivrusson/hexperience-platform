import chalk from 'chalk'
import ora, { type Ora } from 'ora'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success'

export class Logger {
  private verbose: boolean
  private spinner: Ora | null = null

  constructor(verbose = false) {
    this.verbose = verbose || process.env.DEBUG === 'true'
  }

  setVerbose(verbose: boolean): void {
    this.verbose = verbose
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      console.log(chalk.gray(`[DEBUG] ${message}`), ...args)
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.log(chalk.blue(`[INFO] ${message}`), ...args)
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(chalk.yellow(`[WARN] ${message}`), ...args)
  }

  error(message: string, ...args: unknown[]): void {
    console.error(chalk.red(`[ERROR] ${message}`), ...args)
  }

  success(message: string, ...args: unknown[]): void {
    console.log(chalk.green(`[SUCCESS] ${message}`), ...args)
  }

  step(message: string): void {
    console.log(chalk.cyan(`→ ${message}`))
  }

  /**
   * Start a spinner for long-running operations
   */
  startSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.stop()
    }
    this.spinner = ora(message).start()
  }

  /**
   * Stop the current spinner with a message
   */
  stopSpinner(message?: string): void {
    if (this.spinner) {
      if (message) {
        this.spinner.succeed(message)
      } else {
        this.spinner.stop()
      }
      this.spinner = null
    }
  }

  /**
   * Fail the current spinner with a message
   */
  failSpinner(message?: string): void {
    if (this.spinner) {
      if (message) {
        this.spinner.fail(message)
      } else {
        this.spinner.stop()
      }
      this.spinner = null
    }
  }
}

// Singleton instance
let loggerInstance: Logger | null = null

export function getLogger(verbose = false): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger(verbose)
  }
  return loggerInstance
}

// Export default logger for backward compatibility
export const logger = {
  info: (message: string, ...args: unknown[]) =>
    getLogger().info(message, ...args),
  success: (message: string, ...args: unknown[]) =>
    getLogger().success(message, ...args),
  warn: (message: string, ...args: unknown[]) =>
    getLogger().warn(message, ...args),
  error: (message: string, ...args: unknown[]) =>
    getLogger().error(message, ...args),
  step: (message: string, ...args: unknown[]) =>
    getLogger().step(message, ...args),
  debug: (message: string, ...args: unknown[]) =>
    getLogger().debug(message, ...args),
}
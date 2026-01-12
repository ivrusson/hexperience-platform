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

  isVerbose(): boolean {
    return this.verbose
  }

  debug(_message: string, ..._args: unknown[]): void {
    if (this.verbose) {
    }
  }

  info(_message: string, ..._args: unknown[]): void {}

  warn(_message: string, ..._args: unknown[]): void {}

  error(_message: string, ..._args: unknown[]): void {}

  success(_message: string, ..._args: unknown[]): void {}

  step(_message: string): void {}

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
  step: (message: string) => getLogger().step(message),
  debug: (message: string, ...args: unknown[]) =>
    getLogger().debug(message, ...args),
}

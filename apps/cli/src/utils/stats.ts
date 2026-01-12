import type { OperationResult, PostStepResult } from '@hexp/shared'
import chalk from 'chalk'
import type { Logger } from './logger'

export interface GenerationStats {
  filesCreated: number
  filesModified: number
  operationsExecuted: number
  operationsByType: Record<string, number>
  postStepsExecuted: number
  postStepsByType: Record<string, number>
  executionTimeMs: number
  startTime: number
  endTime?: number
}

export class StatsCollector {
  private stats: GenerationStats
  private logger: Logger

  constructor(logger: Logger) {
    this.logger = logger
    this.stats = {
      filesCreated: 0,
      filesModified: 0,
      operationsExecuted: 0,
      operationsByType: {},
      postStepsExecuted: 0,
      postStepsByType: {},
      executionTimeMs: 0,
      startTime: Date.now(),
    }
  }

  /**
   * Record operation results
   */
  recordOperations(results: OperationResult[], operationTypes: string[]): void {
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const opType = operationTypes[i] || 'unknown'

      if (result.success) {
        this.stats.operationsExecuted++
        this.stats.operationsByType[opType] =
          (this.stats.operationsByType[opType] || 0) + 1

        if (result.filesAffected) {
          for (const _file of result.filesAffected) {
            // Simple heuristic: if file exists, it's modified; otherwise created
            // This could be improved by tracking file existence before operations
            this.stats.filesCreated++
          }
        }
      }
    }
  }

  /**
   * Record post-step results
   */
  recordPostSteps(results: PostStepResult[], postStepTypes: string[]): void {
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const stepType = postStepTypes[i] || 'unknown'

      if (result.success) {
        this.stats.postStepsExecuted++
        this.stats.postStepsByType[stepType] =
          (this.stats.postStepsByType[stepType] || 0) + 1
      }
    }
  }

  /**
   * Mark generation as complete
   */
  complete(): void {
    this.stats.endTime = Date.now()
    this.stats.executionTimeMs = this.stats.endTime - this.stats.startTime
  }

  /**
   * Get current stats
   */
  getStats(): GenerationStats {
    return { ...this.stats }
  }

  /**
   * Display stats summary
   */
  displaySummary(format: 'text' | 'json' = 'text'): void {
    this.complete()

    if (format === 'json') {
      return
    }

    this.logger.success('Generation completed successfully')
    this.logger.info('\nStatistics:')
    this.logger.info(
      `  Files created: ${chalk.cyan(this.stats.filesCreated.toString())}`
    )
    this.logger.info(
      `  Files modified: ${chalk.cyan(this.stats.filesModified.toString())}`
    )
    this.logger.info(
      `  Operations executed: ${chalk.cyan(
        this.stats.operationsExecuted.toString()
      )}`
    )

    if (Object.keys(this.stats.operationsByType).length > 0) {
      this.logger.info('  Operations by type:')
      for (const [type, count] of Object.entries(this.stats.operationsByType)) {
        this.logger.info(`    - ${type}: ${chalk.cyan(count.toString())}`)
      }
    }

    if (this.stats.postStepsExecuted > 0) {
      this.logger.info(
        `  Post-steps executed: ${chalk.cyan(
          this.stats.postStepsExecuted.toString()
        )}`
      )
      if (Object.keys(this.stats.postStepsByType).length > 0) {
        this.logger.info('  Post-steps by type:')
        for (const [type, count] of Object.entries(
          this.stats.postStepsByType
        )) {
          this.logger.info(`    - ${type}: ${chalk.cyan(count.toString())}`)
        }
      }
    }

    const timeSeconds = (this.stats.executionTimeMs / 1000).toFixed(2)
    this.logger.info(`  Execution time: ${chalk.cyan(`${timeSeconds}s`)}`)
  }
}

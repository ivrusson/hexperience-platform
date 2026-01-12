import chalk from 'chalk'
import { getErrorHandler } from '../utils/errorHandler'
import { getLogger } from '../utils/logger'
import { TemplateValidator } from '../utils/templateValidator'

interface ValidateOptions {
  json?: boolean
  templates?: string
}

export async function validateCommand(options: ValidateOptions): Promise<void> {
  const logger = getLogger()
  const errorHandler = getErrorHandler()
  const projectRoot = process.cwd()

  try {
    logger.info('Validating templates...')

    const validator = new TemplateValidator(projectRoot)
    const result = await validator.validateAll(options.templates)

    if (options.json) {
      process.exit(result.isValid ? 0 : 1)
      return
    }

    // Display results
    if (result.errors.length > 0) {
      logger.error(`\nFound ${result.errors.length} error(s):`)
      for (const error of result.errors) {
        const template = error.templateId
          ? chalk.gray(` [${error.templateId}]`)
          : ''
        const path = error.path ? chalk.gray(` (${error.path})`) : ''
        const field = error.field ? chalk.gray(` → ${error.field}`) : ''
        logger.error(`  ✗ ${error.message}${template}${path}${field}`)
      }
    }

    if (result.warnings.length > 0) {
      logger.warn(`\nFound ${result.warnings.length} warning(s):`)
      for (const warning of result.warnings) {
        const template = warning.templateId
          ? chalk.gray(` [${warning.templateId}]`)
          : ''
        const path = warning.path ? chalk.gray(` (${warning.path})`) : ''
        const field = warning.field ? chalk.gray(` → ${warning.field}`) : ''
        logger.warn(`  ⚠ ${warning.message}${template}${path}${field}`)
      }
    }

    // Summary
    logger.info(`\n${'='.repeat(50)}`)
    if (result.isValid) {
      logger.success(
        `✓ Validation passed: ${result.templatesValidated} template(s) valid`
      )
      if (result.warnings.length > 0) {
        logger.warn(`  (${result.warnings.length} warning(s) found)`)
      }
    } else {
      logger.error(
        `✗ Validation failed: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`
      )
      logger.error(`  ${result.templatesValidated} template(s) validated`)
    }
    logger.info('='.repeat(50))

    process.exit(result.isValid ? 0 : 1)
  } catch (error) {
    errorHandler.handleError(error, { command: 'validate', options })
  }
}

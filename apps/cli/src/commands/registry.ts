import { RegistryClient } from '@hexp/registry'
import chalk from 'chalk'
import { getErrorHandler } from '../utils/errorHandler'
import { getLogger } from '../utils/logger'

interface RegistryListOptions {
  type?: 'base' | 'addon'
  search?: string
  limit?: number
}

interface RegistryInfoOptions {
  json?: boolean
}

interface RegistrySearchOptions {
  type?: 'base' | 'addon'
  tags?: string
  limit?: number
}

export async function registryListCommand(
  options: RegistryListOptions
): Promise<void> {
  const logger = getLogger()
  const errorHandler = getErrorHandler()
  const client = new RegistryClient()

  try {
    const response = await client.listTemplates({
      type: options.type,
      search: options.search,
      limit: options.limit || 100,
    })

    if (response.templates.length === 0) {
      logger.info('No templates found')
      return
    }

    logger.info(`\nFound ${response.total} template(s):\n`)

    for (const template of response.templates) {
      logger.info(chalk.bold(template.name))
      logger.info(`  ID: ${chalk.gray(template.id)}`)
      logger.info(`  Type: ${chalk.cyan(template.type)}`)
      logger.info(`  Version: ${chalk.yellow(template.latestVersion)}`)
      if (template.description) {
        logger.info(`  Description: ${template.description}`)
      }
      if (template.capabilities && template.capabilities.length > 0) {
        logger.info(
          `  Capabilities: ${chalk.gray(template.capabilities.join(', '))}`
        )
      }
      logger.info('')
    }
  } catch (error) {
    errorHandler.handleError(error, { command: 'registry list', options })
  }
}

export async function registryInfoCommand(
  templateId: string,
  options: RegistryInfoOptions
): Promise<void> {
  const logger = getLogger()
  const errorHandler = getErrorHandler()
  const client = new RegistryClient()

  try {
    const template = await client.getTemplate(templateId)
    const versions = await client.getVersions(templateId)

    if (options.json) {
      return
    }

    logger.info(`\n${chalk.bold(template.name)}`)
    logger.info(`  ID: ${chalk.gray(template.id)}`)
    logger.info(`  Type: ${chalk.cyan(template.type)}`)
    logger.info(`  Latest Version: ${chalk.yellow(template.latestVersion)}`)
    if (template.description) {
      logger.info(`  Description: ${template.description}`)
    }
    if (template.capabilities && template.capabilities.length > 0) {
      logger.info(
        `  Capabilities: ${chalk.gray(template.capabilities.join(', '))}`
      )
    }
    if (template.projectType) {
      logger.info(`  Project Type: ${chalk.gray(template.projectType)}`)
    }
    if (template.author) {
      logger.info(`  Author: ${chalk.gray(template.author.name)}`)
    }
    if (template.repository) {
      logger.info(`  Repository: ${chalk.blue(template.repository)}`)
    }
    if (template.license) {
      logger.info(`  License: ${chalk.gray(template.license)}`)
    }
    logger.info(`  Downloads: ${chalk.gray(String(template.downloads))}`)

    logger.info(`\n${chalk.bold('Available Versions:')}`)
    for (const version of versions.versions.slice(0, 10)) {
      const marker = version.isLatest ? chalk.green('(latest)') : ''
      logger.info(
        `  ${chalk.yellow(version.version)} ${marker} - ${version.publishedAt}`
      )
      if (version.changelog) {
        logger.info(`    ${chalk.gray(version.changelog)}`)
      }
    }
    if (versions.versions.length > 10) {
      logger.info(`  ... and ${versions.versions.length - 10} more version(s)`)
    }
  } catch (error) {
    errorHandler.handleError(error, {
      command: 'registry info',
      templateId,
      options,
    })
  }
}

export async function registrySearchCommand(
  query: string,
  options: RegistrySearchOptions
): Promise<void> {
  const logger = getLogger()
  const errorHandler = getErrorHandler()
  const client = new RegistryClient()

  try {
    const tags = options.tags ? options.tags.split(',') : undefined
    const response = await client.searchTemplates({
      q: query,
      type: options.type,
      tags,
      limit: options.limit || 20,
    })

    if (response.templates.length === 0) {
      logger.info(`No templates found matching "${query}"`)
      return
    }

    logger.info(`\nFound ${response.total} template(s) matching "${query}":\n`)

    for (const template of response.templates) {
      logger.info(chalk.bold(template.name))
      logger.info(`  ID: ${chalk.gray(template.id)}`)
      logger.info(`  Type: ${chalk.cyan(template.type)}`)
      logger.info(`  Version: ${chalk.yellow(template.latestVersion)}`)
      if (template.description) {
        logger.info(`  Description: ${template.description}`)
      }
      logger.info('')
    }
  } catch (error) {
    errorHandler.handleError(error, {
      command: 'registry search',
      query,
      options,
    })
  }
}

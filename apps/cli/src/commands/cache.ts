import { RegistryClient } from '@hexp/registry'
import chalk from 'chalk'
import { getErrorHandler } from '../utils/errorHandler'
import { getLogger } from '../utils/logger'

export async function cacheListCommand(): Promise<void> {
  const logger = getLogger()
  const errorHandler = getErrorHandler()
  const client = new RegistryClient()

  try {
    const cache = client.getCache()
    const cached = await cache.list()

    if (cached.length === 0) {
      logger.info('No cached templates found')
      return
    }

    logger.info(`\nCached Templates (${cached.length}):\n`)

    for (const item of cached) {
      const sizeMB = (item.size / (1024 * 1024)).toFixed(2)
      logger.info(
        `${chalk.bold(item.templateId)} ${chalk.yellow(item.version)}`
      )
      logger.info(`  Cached: ${chalk.gray(item.cachedAt)}`)
      logger.info(`  Size: ${chalk.gray(`${sizeMB} MB`)}`)
      logger.info('')
    }
  } catch (error) {
    errorHandler.handleError(error, { command: 'cache list' })
  }
}

export async function cacheClearCommand(
  templateId?: string,
  version?: string
): Promise<void> {
  const logger = getLogger()
  const errorHandler = getErrorHandler()
  const client = new RegistryClient()

  try {
    const cache = client.getCache()

    if (templateId && version) {
      await cache.clear(templateId, version)
      logger.success(
        `Cleared cache for ${chalk.bold(templateId)} ${chalk.yellow(version)}`
      )
    } else if (templateId) {
      await cache.clear(templateId)
      logger.success(`Cleared cache for ${chalk.bold(templateId)}`)
    } else {
      await cache.clear()
      logger.success('Cleared all cached templates')
    }
  } catch (error) {
    errorHandler.handleError(error, {
      command: 'cache clear',
      templateId,
      version,
    })
  }
}

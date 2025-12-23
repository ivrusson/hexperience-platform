import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { logger } from './logger.js'

export interface ConfigFile {
  base?: string
  addons?: string[]
  name?: string
  monorepo?: boolean
  single?: boolean
  output?: string
  variables?: Record<string, unknown>
}

/**
 * Load configuration from a JSON file
 */
export function loadConfig(configPath: string): ConfigFile {
  try {
    const resolvedPath = resolve(configPath)
    const content = readFileSync(resolvedPath, 'utf-8')
    const config = JSON.parse(content) as ConfigFile

    // Validate config structure
    if (config.base && typeof config.base !== 'string') {
      throw new Error('Config "base" must be a string')
    }
    if (config.addons && !Array.isArray(config.addons)) {
      throw new Error('Config "addons" must be an array')
    }
    if (config.name && typeof config.name !== 'string') {
      throw new Error('Config "name" must be a string')
    }
    if (config.output && typeof config.output !== 'string') {
      throw new Error('Config "output" must be a string')
    }
    if (config.variables && typeof config.variables !== 'object') {
      throw new Error('Config "variables" must be an object')
    }

    return config
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file: ${error.message}`)
    }
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Config file not found: ${configPath}`)
    }
    throw error
  }
}

/**
 * Merge CLI options with config file, CLI options take precedence
 */
export function mergeConfig(
  cliOptions: CreateOptions,
  config?: ConfigFile
): CreateOptions {
  if (!config) {
    return cliOptions
  }

  return {
    base: cliOptions.base ?? config.base,
    addons: cliOptions.addons ?? config.addons,
    name: cliOptions.name ?? config.name,
    monorepo: cliOptions.monorepo ?? config.monorepo,
    single: cliOptions.single ?? config.single,
    output: cliOptions.output ?? config.output,
    config: cliOptions.config,
    dryRun: cliOptions.dryRun,
    preview: cliOptions.preview,
    variables: config.variables,
  }
}

interface CreateOptions {
  base?: string
  addons?: string[]
  name?: string
  monorepo?: boolean
  single?: boolean
  output?: string
  config?: string
  dryRun?: boolean
  preview?: boolean
  variables?: Record<string, unknown>
}

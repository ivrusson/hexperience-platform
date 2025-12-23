import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import yaml from 'js-yaml'
import { z } from 'zod'

const ConfigSchema = z.object({
  base: z.string().min(1).optional(),
  addons: z.array(z.string()).optional(),
  name: z.string().min(1).optional(),
  monorepo: z.boolean().optional(),
  single: z.boolean().optional(),
  output: z.string().optional(),
  variables: z.record(z.unknown()).optional(),
})

export type ConfigFile = z.infer<typeof ConfigSchema>

/**
 * Detect if content is YAML format
 */
function isYamlContent(content: string): boolean {
  const trimmed = content.trim()
  // YAML typically starts with --- or has key: value patterns without { or [
  return (
    trimmed.startsWith('---') ||
    (trimmed.includes(':') &&
      !trimmed.startsWith('{') &&
      !trimmed.startsWith('['))
  )
}

/**
 * Detect format by file extension
 */
function detectFormatByExtension(filePath: string): 'yaml' | 'json' | 'auto' {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.yaml' || ext === '.yml') {
    return 'yaml'
  }
  if (ext === '.json') {
    return 'json'
  }
  return 'auto'
}

/**
 * Parse content based on format
 */
function parseContent(
  content: string,
  format: 'yaml' | 'json' | 'auto'
): unknown {
  if (format === 'json') {
    return JSON.parse(content)
  }
  if (format === 'yaml') {
    try {
      return yaml.load(content, { schema: yaml.DEFAULT_SCHEMA })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid YAML in config file: ${error.message}`)
      }
      throw error
    }
  }
  // Auto-detect format
  if (isYamlContent(content)) {
    try {
      return yaml.load(content, { schema: yaml.DEFAULT_SCHEMA })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid YAML in config file: ${error.message}`)
      }
      throw error
    }
  }
  // Default to JSON
  try {
    return JSON.parse(content)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file: ${error.message}`)
    }
    throw error
  }
}

/**
 * Load configuration from a JSON or YAML file
 */
export function loadConfig(configPath: string): ConfigFile {
  try {
    const resolvedPath = resolve(configPath)
    const content = readFileSync(resolvedPath, 'utf-8')
    const format = detectFormatByExtension(resolvedPath)
    const parsed = parseContent(content, format)

    // Validate with Zod schema
    const config = ConfigSchema.parse(parsed)
    return config
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      throw new Error(`Config validation failed: ${errors}`)
    }
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Config file not found: ${configPath}`)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to load config: ${String(error)}`)
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

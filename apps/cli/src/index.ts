#!/usr/bin/env node

import { Command } from 'commander'
import { createCommand } from './commands/create.js'
import { listCommand } from './commands/list.js'
import { tuiCommand } from './commands/tui.jsx'
import { validateCommand } from './commands/validate.js'
import {
  registryInfoCommand,
  registryListCommand,
  registrySearchCommand,
} from './commands/registry.js'
import { cacheClearCommand, cacheListCommand } from './commands/cache.js'
import { getLogger } from './utils/logger.js'

const program = new Command()

program
  .name('create-hexp')
  .description('Generate projects from templates')
  .version('0.0.0')
  .option('-v, --verbose', 'Enable verbose logging (debug mode)')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts()
    if (opts.verbose) {
      getLogger(true).setVerbose(true)
    }
  })

program
  .command('list')
  .description('List available base templates and addons')
  .option('--bases', 'Show only base templates')
  .option('--addons', 'Show only addon templates')
  .option('--all', 'Show all templates (default)')
  .option('--json', 'Output in JSON format')
  .action(listCommand)

program
  .command('create')
  .description('Create a new project from templates')
  .option('--base <id>', 'Base template ID')
  .option('--addons <ids...>', 'Addon template IDs')
  .option('--name <name>', 'Project name')
  .option('--monorepo', 'Force monorepo project type')
  .option('--single', 'Force single package project type')
  .option('--output <dir>', 'Output directory', process.cwd())
  .option('--config <file>', 'Configuration file (JSON or YAML)')
  .option('--dry-run', 'Preview generation plan without executing')
  .option('--preview', 'Alias for --dry-run')
  .option('--stats', 'Show generation statistics')
  .option('--json', 'Output in JSON format')
  .option('--save-progress', 'Save partial progress on cancellation')
  .action(createCommand)

program
  .command('validate')
  .description('Validate all templates')
  .option('--json', 'Output validation results in JSON format')
  .option('--templates <path>', 'Path to templates directory (optional)')
  .action(validateCommand)

program
  .command('tui')
  .description('Interactive TUI for complex tasks')
  .argument('[subcommand]', 'Subcommand: models or monorepo', 'models')
  .action((subcommand: string) => {
    tuiCommand({ subcommand })
  })

const registryCommand = program
  .command('registry')
  .description('Manage remote templates from registry')

registryCommand
  .command('list')
  .description('List templates in registry')
  .option('--type <type>', 'Filter by type (base or addon)')
  .option('--search <query>', 'Search templates')
  .option('--limit <number>', 'Maximum number of results', '100')
  .action((options) => {
    registryListCommand({
      type: options.type,
      search: options.search,
      limit: options.limit ? parseInt(options.limit, 10) : undefined,
    })
  })

registryCommand
  .command('info')
  .description('Get information about a template')
  .argument('<template-id>', 'Template ID')
  .option('--json', 'Output in JSON format')
  .action((templateId, options) => {
    registryInfoCommand(templateId, options)
  })

registryCommand
  .command('search')
  .description('Search templates')
  .argument('<query>', 'Search query')
  .option('--type <type>', 'Filter by type (base or addon)')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--limit <number>', 'Maximum number of results', '20')
  .action((query, options) => {
    registrySearchCommand(query, {
      type: options.type,
      tags: options.tags,
      limit: options.limit ? parseInt(options.limit, 10) : undefined,
    })
  })

const cacheCommand = program
  .command('cache')
  .description('Manage local template cache')

cacheCommand
  .command('list')
  .description('List cached templates')
  .action(() => {
    cacheListCommand()
  })

cacheCommand
  .command('clear')
  .description('Clear cached templates')
  .argument('[template-id]', 'Template ID (optional)')
  .argument('[version]', 'Version (optional)')
  .action((templateId, version) => {
    cacheClearCommand(templateId, version)
  })

// If no command provided, show help
if (process.argv.length === 2) {
  program.help()
} else {
  program.parse()
}

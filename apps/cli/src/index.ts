#!/usr/bin/env node

import { Command } from 'commander'
import { createCommand } from './commands/create.js'
import { listCommand } from './commands/list.js'
import { tuiCommand } from './commands/tui.jsx'

const program = new Command()

program
  .name('create-hexp')
  .description('Generate projects from templates')
  .version('0.0.0')

program
  .command('list')
  .description('List available base templates and addons')
  .option('--bases', 'Show only base templates')
  .option('--addons', 'Show only addon templates')
  .option('--all', 'Show all templates (default)')
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
  .action(createCommand)

program
  .command('tui')
  .description('Interactive TUI for complex tasks')
  .argument('[subcommand]', 'Subcommand: models or monorepo', 'models')
  .action((subcommand: string) => {
    tuiCommand({ subcommand })
  })

// If no command provided, show help
if (process.argv.length === 2) {
  program.help()
} else {
  program.parse()
}

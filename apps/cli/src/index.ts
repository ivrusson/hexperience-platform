#!/usr/bin/env node

import { Command } from 'commander'
import { createCommand } from './commands/create.js'
import { listCommand } from './commands/list.js'

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
  .option('--dry-run', 'Preview generation plan without executing')
  .option('--preview', 'Alias for --dry-run')
  .action(createCommand)

// If no command provided, show help
if (process.argv.length === 2) {
  program.help()
} else {
  program.parse()
}

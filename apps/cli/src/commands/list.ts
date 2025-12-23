import { resolve } from 'node:path'
import type { AddonTemplate, BaseTemplate } from '@hexp/catalog'
import { Catalog } from '@hexp/catalog'
import chalk from 'chalk'

interface ListOptions {
  bases?: boolean
  addons?: boolean
  all?: boolean
}

export async function listCommand(options: ListOptions): Promise<void> {
  const templatesDir = resolve(process.cwd(), 'templates')
  const catalog = new Catalog(templatesDir)

  try {
    const bases = await catalog.getBases()
    const addons = await catalog.getAddons()
    const errors = await catalog.getErrors()

    // Show errors if any
    if (errors.length > 0) {
      console.error(chalk.yellow('\n⚠️  Some templates had errors:\n'))
      for (const { path, error } of errors) {
        console.error(chalk.red(`  ${path}: ${error}`))
      }
      console.error()
    }

    const showBases =
      options.bases || options.all || (!options.addons && !options.bases)
    const showAddons =
      options.addons || options.all || (!options.bases && !options.addons)

    if (showBases) {
      console.log(chalk.bold.cyan('\n📦 Base Templates:\n'))
      if (bases.length === 0) {
        console.log(chalk.gray('  No base templates found.\n'))
      } else {
        for (const base of bases) {
          console.log(chalk.bold(`  ${base.id}`))
          console.log(chalk.gray(`    ${base.name}`))
          if (base.description) {
            console.log(chalk.white(`    ${base.description}`))
          }
          if (base.capabilities && base.capabilities.length > 0) {
            console.log(
              chalk.blue(`    Capabilities: ${base.capabilities.join(', ')}`)
            )
          }
          if (base.projectType) {
            console.log(chalk.magenta(`    Project Type: ${base.projectType}`))
          }
          console.log()
        }
      }
    }

    if (showAddons) {
      console.log(chalk.bold.cyan('\n🔌 Addon Templates:\n'))
      if (addons.length === 0) {
        console.log(chalk.gray('  No addon templates found.\n'))
      } else {
        for (const addon of addons) {
          console.log(chalk.bold(`  ${addon.id}`))
          console.log(chalk.gray(`    ${addon.name}`))
          if (addon.description) {
            console.log(chalk.white(`    ${addon.description}`))
          }
          if (addon.requires && addon.requires.length > 0) {
            console.log(
              chalk.yellow(`    Requires: ${addon.requires.join(', ')}`)
            )
          }
          if (addon.provides && addon.provides.length > 0) {
            console.log(
              chalk.green(`    Provides: ${addon.provides.join(', ')}`)
            )
          }
          if (addon.conflicts && addon.conflicts.length > 0) {
            console.log(
              chalk.red(`    Conflicts: ${addon.conflicts.join(', ')}`)
            )
          }
          console.log()
        }
      }
    }

    // Summary
    console.log(
      chalk.gray(
        `\nTotal: ${bases.length} base(s), ${addons.length} addon(s)\n`
      )
    )
  } catch (error) {
    console.error(
      chalk.red(
        `\n❌ Error listing templates: ${error instanceof Error ? error.message : String(error)}\n`
      )
    )
    process.exit(1)
  }
}

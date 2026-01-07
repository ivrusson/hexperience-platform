import chalk from 'chalk'
import type { AddonTemplate, BaseTemplate } from '@hexp/catalog'
import { Catalog } from '@hexp/catalog'

interface ListOptions {
  bases?: boolean
  addons?: boolean
  all?: boolean
  json?: boolean
}

export async function listCommand(options: ListOptions): Promise<void> {
  // Catalog expects the base directory (project root), not templates/ directory
  const projectRoot = process.cwd()
  const catalog = new Catalog(projectRoot)

  try {
    const bases = await catalog.getBases()
    const addons = await catalog.getAddons()
    const errors = await catalog.getErrors()

    // JSON output
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            bases: bases.map((b: BaseTemplate) => ({
              id: b.id,
              name: b.name,
              description: b.description,
              projectType: b.projectType,
              capabilities: b.capabilities,
            })),
            addons: addons.map((a: AddonTemplate) => ({
              id: a.id,
              name: a.name,
              description: a.description,
              requires: a.requires,
              provides: a.provides,
              conflicts: a.conflicts,
            })),
            errors: errors.map((e: { path: string; error: string }) => ({
              path: e.path,
              error: e.error,
            })),
          },
          null,
          2
        )
      )
      return
    }

    // Show errors if any
    if (errors.length > 0) {
      console.error(chalk.red(`\n⚠ Found ${errors.length} error(s) loading templates:\n`))
      for (const { path, error } of errors) {
        console.error(chalk.red(`  ✗ ${path}: ${error}`))
      }
      console.error('')
    }

    const showBases =
      options.bases || options.all || (!options.addons && !options.bases)
    const showAddons =
      options.addons || options.all || (!options.bases && !options.addons)

    if (showBases) {
      if (bases.length === 0) {
        console.log(chalk.yellow('\nNo base templates found.\n'))
      } else {
        console.log(chalk.bold.cyan(`\n📦 Base Templates (${bases.length}):\n`))
        for (const base of bases) {
          console.log(chalk.bold(`  ${base.name}`))
          console.log(chalk.gray(`    ID: ${base.id}`))
          if (base.description) {
            console.log(chalk.white(`    ${base.description}`))
          }
          if (base.capabilities && base.capabilities.length > 0) {
            console.log(
              chalk.blue(
                `    Capabilities: ${base.capabilities.join(', ')}`
              )
            )
          }
          if (base.projectType) {
            console.log(
              chalk.magenta(`    Project Type: ${base.projectType}`)
            )
          }
          console.log('')
        }
      }
    }

    if (showAddons) {
      if (addons.length === 0) {
        console.log(chalk.yellow('\nNo addon templates found.\n'))
      } else {
        console.log(chalk.bold.cyan(`\n🔌 Addon Templates (${addons.length}):\n`))
        for (const addon of addons) {
          console.log(chalk.bold(`  ${addon.name}`))
          console.log(chalk.gray(`    ID: ${addon.id}`))
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
          console.log('')
        }
      }
    }
  } catch (error) {
    console.error(
      chalk.red(
        `Error loading templates: ${error instanceof Error ? error.message : String(error)}`
      )
    )
    process.exit(1)
  }
}

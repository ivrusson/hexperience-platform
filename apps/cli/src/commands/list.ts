import { Catalog } from '@hexp/catalog'

interface ListOptions {
  bases?: boolean
  addons?: boolean
  all?: boolean
}

export async function listCommand(options: ListOptions): Promise<void> {
  // Catalog expects the base directory (project root), not templates/ directory
  const projectRoot = process.cwd()
  const catalog = new Catalog(projectRoot)

  try {
    const bases = await catalog.getBases()
    const addons = await catalog.getAddons()
    const errors = await catalog.getErrors()

    // Show errors if any
    if (errors.length > 0) {
      for (const { path, error } of errors) {
      }
    }

    const showBases =
      options.bases || options.all || (!options.addons && !options.bases)
    const showAddons =
      options.addons || options.all || (!options.bases && !options.addons)

    if (showBases) {
      if (bases.length === 0) {
      } else {
        for (const base of bases) {
          if (base.description) {
          }
          if (base.capabilities && base.capabilities.length > 0) {
          }
          if (base.projectType) {
          }
        }
      }
    }

    if (showAddons) {
      if (addons.length === 0) {
      } else {
        for (const addon of addons) {
          if (addon.description) {
          }
          if (addon.requires && addon.requires.length > 0) {
          }
          if (addon.provides && addon.provides.length > 0) {
          }
          if (addon.conflicts && addon.conflicts.length > 0) {
          }
        }
      }
    }
  } catch (_error) {
    process.exit(1)
  }
}

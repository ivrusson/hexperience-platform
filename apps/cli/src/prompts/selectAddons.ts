import { multiselect } from '@clack/prompts'
import type { AddonTemplate } from '@hexp/catalog'
import chalk from 'chalk'

export async function selectAddons(
  addons: AddonTemplate[],
  baseCapabilities: string[] = []
): Promise<AddonTemplate[]> {
  if (addons.length === 0) {
    return []
  }

  // Filter compatible addons
  const compatibleAddons = addons.filter((addon) => {
    if (!addon.requires || addon.requires.length === 0) {
      return true
    }
    return addon.requires.every((req: string) => baseCapabilities.includes(req))
  })

  if (compatibleAddons.length === 0) {
    return []
  }

  const options = compatibleAddons.map((addon) => ({
    value: addon.id,
    label: `${chalk.bold(addon.name)} - ${addon.description || 'No description'}`,
    hint: addon.requires?.join(', ') || 'No requirements',
  }))

  const selectedIds = await multiselect({
    message: 'Select addons (optional):',
    options,
  })

  if (!Array.isArray(selectedIds)) {
    return []
  }

  return compatibleAddons.filter((a) => selectedIds.includes(a.id))
}

import { select } from '@clack/prompts'
import type { BaseTemplate } from '@hexp/catalog'
import chalk from 'chalk'

export async function selectBase(
  bases: BaseTemplate[]
): Promise<BaseTemplate | null> {
  if (bases.length === 0) {
    console.error(chalk.red('No base templates available'))
    return null
  }

  const options = bases.map((base) => ({
    value: base.id,
    label: `${chalk.bold(base.name)} - ${base.description || 'No description'}`,
    hint: base.capabilities?.join(', ') || '',
  }))

  const selectedId = await select({
    message: 'Select a base template:',
    options,
  })

  if (typeof selectedId !== 'string') {
    return null
  }

  return bases.find((b) => b.id === selectedId) || null
}

import { confirm, select as selectPrompt, text } from '@clack/prompts'
import type { Prompt } from '@hexp/shared'

export async function collectVars(
  prompts: Prompt[] = []
): Promise<Record<string, unknown>> {
  const variables: Record<string, unknown> = {}

  for (const prompt of prompts) {
    let value: unknown

    switch (prompt.type) {
      case 'text': {
        const result = await text({
          message: prompt.label,
          defaultValue:
            typeof prompt.default === 'string' ? prompt.default : undefined,
          validate: (input) => {
            if (prompt.required && !input) {
              return prompt.validation || 'This field is required'
            }
            return undefined
          },
        })
        value = result
        break
      }
      case 'confirm': {
        const result = await confirm({
          message: prompt.label,
          initialValue:
            typeof prompt.default === 'boolean' ? prompt.default : false,
        })
        value = result
        break
      }
      case 'select': {
        if (!prompt.options || prompt.options.length === 0) {
          continue
        }
        const result = await selectPrompt({
          message: prompt.label,
          options: prompt.options.map(
            (opt: { label: string; value: string }) => ({
              value: opt.value,
              label: opt.label,
            })
          ),
        })
        value = result
        break
      }
      case 'multiselect': {
        // For multiselect, we'll use the selectAddons function separately
        // This is handled in the create command
        continue
      }
      default:
        continue
    }

    if (value !== undefined && value !== null && value !== '') {
      variables[prompt.id] = value
    } else if (prompt.default !== undefined) {
      variables[prompt.id] = prompt.default
    }
  }

  return variables
}

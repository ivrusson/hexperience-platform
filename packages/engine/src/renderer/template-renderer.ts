import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import mustache from 'mustache'
import { TemplateRenderError } from '../errors.js'

export async function renderTemplate(
  sourcePath: string,
  destinationPath: string,
  variables: Record<string, unknown>
): Promise<void> {
  try {
    const templateContent = await readFile(sourcePath, 'utf-8')
    const rendered = mustache.render(templateContent, variables)
    const destDir = dirname(destinationPath)
    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true })
    }
    await writeFile(destinationPath, rendered, 'utf-8')
  } catch (error) {
    if (error instanceof TemplateRenderError) throw error
    throw new TemplateRenderError(
      `Failed to render template from ${sourcePath} to ${destinationPath}: ${error instanceof Error ? error.message : String(error)}`,
      { sourcePath, destinationPath, error }
    )
  }
}

export function renderTemplateString(
  template: string,
  variables: Record<string, unknown>
): string {
  try {
    return mustache.render(template, variables)
  } catch (error) {
    throw new TemplateRenderError(
      `Failed to render template string: ${error instanceof Error ? error.message : String(error)}`,
      { template: template.substring(0, 100), error }
    )
  }
}

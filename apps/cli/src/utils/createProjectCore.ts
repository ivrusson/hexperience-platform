import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AddonTemplate, BaseTemplate } from '@hexp/catalog'
import { Catalog } from '@hexp/catalog'
import { createEngine, createWorkspace } from '@hexp/engine'
import type { OperationResult, PostStep } from '@hexp/shared'
import { findProjectRoot } from './findProjectRoot'
import { getLogger } from './logger'
import { generateMonorepoFiles } from './monorepoGenerator'
import { generateQualityStandards } from './qualityStandardsGenerator'
import { findTemplatePath } from './templatePath'
import { validateGenerationPlan } from './validation'

interface CreateProjectCoreOptions {
  baseId: string
  addonIds: string[]
  projectName: string
  projectType: 'monorepo' | 'single'
  outputDir: string
  skipInstall?: boolean
  skipFormat?: boolean
  skipLint?: boolean
  skipTypeCheck?: boolean
  skipGitInit?: boolean
  skipDocs?: boolean
  gitInit?: boolean
}

export async function createProjectCore(
  options: CreateProjectCoreOptions
): Promise<void> {
  const logger = getLogger()
  const projectRoot = findProjectRoot()

  if (!projectRoot) {
    throw new Error(
      'Could not find templates directory. Please ensure templates/bases/ directory exists.'
    )
  }

  const catalog = new Catalog(projectRoot)
  const bases = await catalog.getBases()
  const addons = await catalog.getAddons()

  const selectedBase = bases.find((b: BaseTemplate) => b.id === options.baseId)
  if (!selectedBase) {
    throw new Error(`Base template "${options.baseId}" not found`)
  }

  const selectedAddons = addons.filter((a: AddonTemplate) =>
    options.addonIds.includes(a.id)
  )
  const notFound = options.addonIds.filter(
    (id) => !selectedAddons.some((a: AddonTemplate) => a.id === id)
  )
  if (notFound.length > 0) {
    logger.warn(`Addons not found: ${notFound.join(', ')}`)
  }

  // Prepare output directory
  const outputDir = resolve(options.outputDir, options.projectName)
  if (existsSync(outputDir)) {
    throw new Error(`Directory ${outputDir} already exists`)
  }

  // Create workspace
  const workspace = createWorkspace(outputDir)
  if (!workspace.exists()) {
    mkdirSync(outputDir, { recursive: true })
  }

  // Find template paths
  const baseTemplatePath = await findTemplatePath(
    projectRoot,
    selectedBase.id,
    'base'
  )
  if (!baseTemplatePath) {
    throw new Error(`Template directory not found for base: ${selectedBase.id}`)
  }

  const addonTemplatePaths: Array<{ template: AddonTemplate; path: string }> =
    []
  for (const addon of selectedAddons) {
    const addonPath = await findTemplatePath(projectRoot, addon.id, 'addon')
    if (addonPath) {
      addonTemplatePaths.push({ template: addon, path: addonPath })
    } else {
      logger.warn(`Template directory not found for addon: ${addon.id}`)
    }
  }

  // Validate generation plan
  const validationResult = validateGenerationPlan(
    selectedBase,
    selectedAddons,
    selectedBase.ops || [],
    addonTemplatePaths.map(({ template }) => ({
      addon: template,
      ops: template.ops || [],
    }))
  )

  if (!validationResult.isValid) {
    const errorMessage = validationResult.errors.join('\n')
    throw new Error(`Validation failed:\n${errorMessage}`)
  }

  // Use resolved addon order from dependency resolution
  const orderedAddons = validationResult.dependencies.orderedAddons
  const orderedAddonPaths = orderedAddons.map((addon) => {
    const found = addonTemplatePaths.find((a) => a.template.id === addon.id)
    if (!found) {
      throw new Error(`Addon path not found for ${addon.id}`)
    }
    return found
  })

  // Create execution context
  const contextVariables: Record<string, unknown> = {
    projectName: options.projectName,
    projectType: options.projectType,
  }

  const context = {
    variables: contextVariables,
    templateRoot: baseTemplatePath,
    workspaceRoot: outputDir,
  }

  // Create engine
  const engine = createEngine(workspace, context)

  // Prepare post-steps
  const postSteps: PostStep[] = []

  if (!options.skipInstall) {
    postSteps.push({
      type: 'installDependencies',
      enabled: true,
      options: {},
    })
  }

  if (!options.skipFormat) {
    postSteps.push({
      type: 'formatCode',
      enabled: true,
      options: {},
    })
  }

  if (!options.skipLint) {
    postSteps.push({
      type: 'lintCode',
      enabled: true,
      options: { failOnError: false },
    })
  }

  if (!options.skipTypeCheck) {
    postSteps.push({
      type: 'typeCheck',
      enabled: true,
      options: { failOnError: false },
    })
  }

  if (options.gitInit || (!options.skipGitInit && options.gitInit !== false)) {
    postSteps.push({
      type: 'gitInit',
      enabled: true,
      options: {
        createInitialCommit: true,
        commitMessage: 'Initial commit from hexperience platform',
      },
    })
  }

  if (!options.skipDocs) {
    postSteps.push({
      type: 'generateDocs',
      enabled: true,
      options: {},
    })
  }

  const baseWithOps = {
    templateDir: baseTemplatePath,
    ops: selectedBase.ops,
  }

  const addonsWithOps = orderedAddonPaths.map(({ template, path }) => ({
    templateDir: path,
    ops: template.ops,
  }))

  // Generate project
  logger.info(`Generating project at: ${outputDir}`)
  logger.info(`Base template: ${selectedBase.id} at ${baseTemplatePath}`)
  logger.info(`Base operations: ${JSON.stringify(selectedBase.ops, null, 2)}`)

  const results = await engine.compose(baseWithOps, addonsWithOps, postSteps)

  // Log results
  const successCount = results.filter((r: OperationResult) => r.success).length
  const failureCount = results.filter((r: OperationResult) => !r.success).length
  logger.info(
    `Operations completed: ${successCount} successful, ${failureCount} failed`
  )

  // Log files affected
  const allFiles = results.flatMap(
    (r: OperationResult) => r.filesAffected || []
  )
  logger.info(`Files created: ${allFiles.length}`)
  if (allFiles.length > 0) {
    logger.info(`First few files: ${allFiles.slice(0, 5).join(', ')}`)
  }

  if (failureCount > 0) {
    const failures = results.filter((r: OperationResult) => !r.success)
    for (const failure of failures) {
      const errorMsg = failure.error?.message || 'Unknown error'
      logger.error(`Operation failed: ${errorMsg}`)
    }
    throw new Error(
      `Project generation failed: ${failureCount} operation(s) failed. Check logs for details.`
    )
  }

  // Verify output directory has files
  const { readdirSync } = await import('node:fs')
  try {
    const files = readdirSync(outputDir)
    logger.info(
      `Output directory contains ${files.length} items: ${files.slice(0, 10).join(', ')}`
    )
  } catch (err) {
    logger.warn(
      `Could not read output directory: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  // Generate monorepo files if project type is monorepo
  if (options.projectType === 'monorepo') {
    try {
      await generateMonorepoFiles(outputDir)
    } catch (error) {
      logger.warn(
        `Failed to generate monorepo files: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // Generate quality standards files
  try {
    await generateQualityStandards(outputDir, options.projectName)
  } catch (error) {
    logger.warn(
      `Failed to generate quality standards: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

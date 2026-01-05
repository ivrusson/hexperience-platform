import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { confirm as confirmPrompt, intro, outro, spinner } from '@clack/prompts'
import type { AddonTemplate, BaseTemplate } from '@hexp/catalog'
import { Catalog } from '@hexp/catalog'
import { createEngine, createWorkspace } from '@hexp/engine'
import chalk from 'chalk'
import { collectVars } from '../prompts/collectVars.js'
import { selectAddons } from '../prompts/selectAddons.js'
import { selectBase } from '../prompts/selectBase.js'
import { loadConfig, mergeConfig } from '../utils/configLoader.js'
import { logger } from '../utils/logger.js'
import { generateMonorepoFiles } from '../utils/monorepoGenerator.js'
import { generateQualityStandards } from '../utils/qualityStandardsGenerator.js'
import { findTemplatePath } from '../utils/templatePath.js'
import { validateGenerationPlan } from '../utils/validation.js'
import { validateProjectName } from '../utils/validators.js'

interface CreateOptions {
  base?: string
  addons?: string[]
  name?: string
  monorepo?: boolean
  single?: boolean
  output?: string
  config?: string
  dryRun?: boolean
  preview?: boolean
  variables?: Record<string, unknown>
}

export async function createCommand(options: CreateOptions): Promise<void> {
  const isDryRun = options.dryRun || options.preview

  try {
    intro(chalk.bold.cyan('Create Hexperience Project'))

    // Load config file if provided
    let configFile
    if (options.config) {
      try {
        configFile = loadConfig(options.config)
        logger.info(`Loaded configuration from ${options.config}`)
      } catch (error) {
        logger.error(
          `Failed to load config file: ${error instanceof Error ? error.message : String(error)}`
        )
        process.exit(1)
      }
    }

    // Merge config with CLI options (CLI takes precedence)
    const mergedOptions = mergeConfig(options, configFile)

    // Catalog expects the base directory (project root), not templates/ directory
    const projectRoot = process.cwd()
    const catalog = new Catalog(projectRoot)

    // Get available templates
    const s = spinner()
    s.start('Loading templates...')
    const bases = await catalog.getBases()
    const addons = await catalog.getAddons()
    s.stop('Templates loaded')

    if (bases.length === 0) {
      logger.error('No base templates found')
      process.exit(1)
    }

    // Determine if we're in interactive or non-interactive mode
    const isInteractive = !mergedOptions.base && !mergedOptions.name

    let selectedBase: BaseTemplate | null = null
    let selectedAddons: AddonTemplate[] = []
    let projectName = mergedOptions.name || ''
    let projectType: 'monorepo' | 'single' | undefined = mergedOptions.monorepo
      ? 'monorepo'
      : mergedOptions.single
        ? 'single'
        : undefined
    let outputDir = mergedOptions.output || process.cwd()

    if (isInteractive) {
      // Interactive mode
      selectedBase = await selectBase(bases)
      if (!selectedBase) {
        logger.error('No base template selected')
        process.exit(1)
      }

      selectedAddons = await selectAddons(addons, selectedBase.capabilities)

      // Collect project name
      const nameResult = await import('@clack/prompts').then((m) =>
        m.text({
          message: 'Project name:',
          validate: (input) => {
            const validation = validateProjectName(input)
            return validation.valid ? undefined : validation.error
          },
        })
      )
      if (typeof nameResult !== 'string') {
        logger.error('Project name is required')
        process.exit(1)
      }
      projectName = nameResult

      // Collect project type if not specified
      if (!projectType && selectedBase.projectType) {
        projectType = selectedBase.projectType
      } else if (!projectType) {
        const typeResult = await import('@clack/prompts').then((m) =>
          m.select({
            message: 'Project type:',
            options: [
              { value: 'single', label: 'Single Package' },
              { value: 'monorepo', label: 'Monorepo (Turbo)' },
            ],
          })
        )
        projectType = (typeResult as 'single' | 'monorepo') || 'single'
      }

      // Collect variables from prompts
      const baseVars = await collectVars(selectedBase.prompts)
      const addonVars: Record<string, unknown> = {}
      for (const addon of selectedAddons) {
        const vars = await collectVars(addon.prompts)
        Object.assign(addonVars, vars)
      }

      // Merge all variables (config file variables take precedence over prompts)
      const allVars = {
        projectName,
        projectType,
        ...baseVars,
        ...addonVars,
        ...(mergedOptions.variables || {}),
      }

      // Store for later use in context
      if (!mergedOptions.variables) {
        mergedOptions.variables = {}
      }
      Object.assign(mergedOptions.variables, allVars)
      if (selectedAddons.length > 0) {
      }

      const shouldProceed = await confirmPrompt({
        message: 'Proceed with generation?',
        initialValue: true,
      })

      if (!shouldProceed) {
        logger.warn('Generation cancelled')
        process.exit(0)
      }
    } else {
      // Non-interactive mode
      if (!mergedOptions.base) {
        logger.error('--base is required in non-interactive mode')
        process.exit(1)
      }

      selectedBase =
        bases.find((b: BaseTemplate) => b.id === mergedOptions.base!) || null
      if (!selectedBase) {
        logger.error(`Base template "${mergedOptions.base}" not found`)
        process.exit(1)
      }

      if (mergedOptions.addons && mergedOptions.addons.length > 0) {
        selectedAddons = addons.filter((a: AddonTemplate) =>
          mergedOptions.addons?.includes(a.id)
        )
        const notFound = mergedOptions.addons.filter(
          (id) => !selectedAddons.some((a) => a.id === id)
        )
        if (notFound.length > 0) {
          logger.warn(`Addons not found: ${notFound.join(', ')}`)
        }
      }

      if (!projectName) {
        logger.error('--name is required in non-interactive mode')
        process.exit(1)
      }

      const nameValidation = validateProjectName(projectName)
      if (!nameValidation.valid) {
        logger.error(nameValidation.error || 'Invalid project name')
        process.exit(1)
      }

      if (!projectType && selectedBase.projectType) {
        projectType = selectedBase.projectType
      } else if (!projectType) {
        projectType = 'single'
      }

      // Merge config variables if provided
      if (!mergedOptions.variables) {
        mergedOptions.variables = {}
      }
      mergedOptions.variables.projectName = projectName
      mergedOptions.variables.projectType = projectType
    }

    // Prepare output directory
    outputDir = resolve(outputDir, projectName)
    if (existsSync(outputDir) && !isDryRun) {
      logger.error(`Directory ${outputDir} already exists`)
      process.exit(1)
    }

    if (isDryRun) {
      if (selectedAddons.length > 0) {
        for (const _addon of selectedAddons) {
        }
      }

      outro(chalk.green('Dry run completed. No files were created.'))
      return
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
      logger.error(`Template directory not found for base: ${selectedBase.id}`)
      process.exit(1)
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

    // Validate generation plan (compatibility, conflicts, dependencies, collisions)
    const validationResult = validateGenerationPlan(
      selectedBase,
      selectedAddons,
      selectedBase.ops || [],
      addonTemplatePaths.map(({ template, path }) => ({
        addon: template,
        ops: template.ops || [],
      }))
    )

    if (!validationResult.isValid) {
      logger.error('Validation failed:')
      for (const error of validationResult.errors) {
        logger.error(error)
      }
      process.exit(1)
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

    // Merge variables from config file if in non-interactive mode
    const contextVariables: Record<string, unknown> = {
      projectName,
      projectType,
      ...(mergedOptions.variables || {}),
    }

    // Create execution context
    const context = {
      variables: contextVariables,
      templateRoot: baseTemplatePath,
      workspaceRoot: outputDir,
    }

    // Create engine
    const engine = createEngine(workspace, context)

    // Generate project
    const genSpinner = spinner()
    genSpinner.start('Generating project...')

    try {
      const baseWithOps = {
        templateDir: baseTemplatePath,
        ops: selectedBase.ops,
      }

      const addonsWithOps = orderedAddonPaths.map(({ template, path }) => ({
        templateDir: path,
        ops: template.ops,
      }))

      const _results = await engine.compose(baseWithOps, addonsWithOps)

      genSpinner.stop('Project generated successfully')

      // Generate monorepo files if project type is monorepo
      if (projectType === 'monorepo') {
        const monoSpinner = spinner()
        monoSpinner.start('Generating monorepo structure...')
        try {
          await generateMonorepoFiles(outputDir)
          monoSpinner.stop('Monorepo structure generated')
        } catch (error) {
          monoSpinner.stop('Failed to generate monorepo structure')
          logger.warn(
            `Failed to generate monorepo files: ${error instanceof Error ? error.message : String(error)}`
          )
        }
      }

      // Generate quality standards files
      const qualitySpinner = spinner()
      qualitySpinner.start('Generating quality standards...')
      try {
        await generateQualityStandards(outputDir, projectName)
        qualitySpinner.stop('Quality standards generated')
      } catch (error) {
        qualitySpinner.stop('Failed to generate quality standards')
        logger.warn(
          `Failed to generate quality standards: ${error instanceof Error ? error.message : String(error)}`
        )
      }
      if (projectType === 'monorepo') {
      }

      outro(chalk.green('Done!'))
    } catch (error) {
      genSpinner.stop('Generation failed')
      logger.error(
        `Failed to generate project: ${error instanceof Error ? error.message : String(error)}`
      )
      process.exit(1)
    }
  } catch (error) {
    logger.error(
      `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    )
    process.exit(1)
  }
}

import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { confirm as confirmPrompt, intro, outro, spinner } from '@clack/prompts'
import type { AddonTemplate, BaseTemplate } from '@hexp/catalog'
import { Catalog } from '@hexp/catalog'
import { createEngine, createWorkspace } from '@hexp/engine'
import type { PostStep, PostStepResult } from '@hexp/shared'
import { RegistryClient } from '@hexp/registry'
import chalk from 'chalk'
import { collectVars } from '../prompts/collectVars.js'
import { selectAddons } from '../prompts/selectAddons.js'
import { selectBase } from '../prompts/selectBase.js'
import {
  type CreateOptions,
  loadConfig,
  mergeConfig,
} from '../utils/configLoader.js'
import { getErrorHandler } from '../utils/errorHandler.js'
import { getLogger } from '../utils/logger.js'
import { StatsCollector } from '../utils/stats.js'
import { generateMonorepoFiles } from '../utils/monorepoGenerator.js'
import { generateQualityStandards } from '../utils/qualityStandardsGenerator.js'
import { findTemplatePath } from '../utils/templatePath.js'
import { validateGenerationPlan } from '../utils/validation.js'
import { validateProjectName } from '../utils/validators.js'

export async function createCommand(options: CreateOptions): Promise<void> {
  const isDryRun = options.dryRun || options.preview
  const logger = getLogger()
  const errorHandler = getErrorHandler()
  let workspace: ReturnType<typeof createWorkspace> | null = null
  let statsCollector: StatsCollector | null = null
  let cancelled = false

  // Setup cancellation handlers
  const cleanup = async (saveProgress = false): Promise<void> => {
    if (workspace && !saveProgress) {
      try {
        await workspace.cleanup()
        logger.info('Workspace cleaned up')
      } catch (error) {
        logger.warn(
          `Failed to cleanup workspace: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    } else if (workspace && saveProgress) {
      logger.info(`Workspace saved at: ${workspace.root}`)
    }
  }

  const handleCancel = async (signal: string): Promise<void> => {
    if (cancelled) {
      // Force exit on second interrupt
      logger.warn('\nForce exiting...')
      await cleanup(false)
      process.exit(130)
      return
    }

    cancelled = true
    logger.warn(`\n${signal} received. Cancelling generation...`)

    if (options.saveProgress) {
      await cleanup(true)
      logger.info('Progress saved. Exiting...')
      process.exit(130)
      return
    }

    const shouldSave = await confirmPrompt({
      message: 'Save partial progress? (y/n)',
      initialValue: false,
    })

    await cleanup(shouldSave)
    if (shouldSave) {
      logger.info('Progress saved. Exiting...')
    } else {
      logger.info('Generation cancelled. Exiting...')
    }
    process.exit(130)
  }

  process.on('SIGINT', () => {
    handleCancel('SIGINT').catch((error) => {
      logger.error(`Error handling cancellation: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(130)
    })
  })

  process.on('SIGTERM', () => {
    handleCancel('SIGTERM').catch((error) => {
      logger.error(`Error handling cancellation: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(143)
    })
  })

  try {
    intro(chalk.bold.cyan('Create Hexperience Project'))

    // Initialize stats collector
    if (options.stats || options.json) {
      statsCollector = new StatsCollector(logger)
    }

    // Load config file if provided
    let configFile
    if (options.config) {
      try {
        configFile = loadConfig(options.config)
        logger.info(`Loaded configuration from ${options.config}`)
      } catch (error) {
        errorHandler.handleError(error, { configPath: options.config })
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
      errorHandler.handleError(
        new Error('No base templates found'),
        { projectRoot }
      )
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
        errorHandler.handleError(new Error('No base template selected'))
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
        errorHandler.handleError(new Error('Project name is required'))
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
        errorHandler.handleError(
          new Error('--base is required in non-interactive mode')
        )
      }

      // Parse template@version syntax
      const baseId = mergedOptions.base!
      const [baseTemplateId, baseVersion] = baseId.includes('@')
        ? baseId.split('@')
        : [baseId, undefined]

      selectedBase =
        bases.find((b: BaseTemplate) => b.id === baseTemplateId) || null

      // If not found locally and version specified, try registry
      if (!selectedBase && baseVersion) {
        logger.info(
          `Template "${baseTemplateId}" not found locally. Checking registry...`
        )
        try {
          const registryClient = new RegistryClient()
          const { path: cachedPath } = await registryClient.downloadTemplateCached(
            baseTemplateId,
            baseVersion
          )
          logger.info(
            `Downloaded template from registry: ${baseTemplateId}@${baseVersion}`
          )
          // TODO: Extract and load template from cache
          // For now, show a message that remote templates need full implementation
          logger.warn(
            'Remote template support is partially implemented. Please use local templates for now.'
          )
        } catch (error) {
          logger.warn(
            `Failed to download from registry: ${error instanceof Error ? error.message : String(error)}`
          )
        }
      }

      if (!selectedBase) {
        errorHandler.handleError(
          new Error(`Base template "${baseTemplateId}" not found`),
          { baseId: baseTemplateId }
        )
      }

      if (mergedOptions.addons && mergedOptions.addons.length > 0) {
        // Parse addon@version syntax
        const parsedAddons = mergedOptions.addons.map((addonId) => {
          if (addonId.includes('@')) {
            const [id] = addonId.split('@')
            return id
          }
          return addonId
        })

        selectedAddons = addons.filter((a: AddonTemplate) =>
          parsedAddons.includes(a.id)
        )
        const notFound = parsedAddons.filter(
          (id) => !selectedAddons.some((a) => a.id === id)
        )
        if (notFound.length > 0) {
          logger.warn(`Addons not found: ${notFound.join(', ')}`)
        }
      }

      if (!projectName) {
        errorHandler.handleError(
          new Error('--name is required in non-interactive mode')
        )
      }

      const nameValidation = validateProjectName(projectName)
      if (!nameValidation.valid) {
        errorHandler.handleError(
          new Error(nameValidation.error || 'Invalid project name'),
          { projectName }
        )
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
      errorHandler.handleError(
        new Error(`Directory ${outputDir} already exists`),
        { outputDir }
      )
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
    workspace = createWorkspace(outputDir)
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
      errorHandler.handleError(
        new Error(`Template directory not found for base: ${selectedBase.id}`),
        { templateId: selectedBase.id, type: 'base' }
      )
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
      const errorMessage = validationResult.errors.join('\n')
      errorHandler.handleError(
        new Error(`Validation failed:\n${errorMessage}`),
        { validationResult }
      )
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

      // Prepare post-steps
      const postSteps: PostStep[] = []

      // Install dependencies (default: true unless skipped)
      if (!mergedOptions.skipInstall && mergedOptions.installDeps !== false) {
        postSteps.push({
          type: 'installDependencies',
          enabled: true,
          options: {},
        })
      }

      // Format code (default: true unless skipped)
      if (!mergedOptions.skipFormat && mergedOptions.formatCode !== false) {
        postSteps.push({
          type: 'formatCode',
          enabled: true,
          options: {},
        })
      }

      // Lint code (default: true unless skipped)
      if (!mergedOptions.skipLint && mergedOptions.lintCode !== false) {
        postSteps.push({
          type: 'lintCode',
          enabled: true,
          options: { failOnError: false },
        })
      }

      // Type check (default: true unless skipped)
      if (!mergedOptions.skipTypeCheck && mergedOptions.typeCheck !== false) {
        postSteps.push({
          type: 'typeCheck',
          enabled: true,
          options: { failOnError: false },
        })
      }

      // Git init (default: false unless explicitly enabled)
      if (
        mergedOptions.gitInit ||
        (!mergedOptions.skipGitInit && isInteractive)
      ) {
        const shouldInitGit = isInteractive
          ? await confirmPrompt({
              message: 'Initialize git repository?',
              initialValue: true,
            })
          : mergedOptions.gitInit

        if (shouldInitGit) {
          postSteps.push({
            type: 'gitInit',
            enabled: true,
            options: {
              createInitialCommit: true,
              commitMessage: 'Initial commit from hexperience platform',
            },
          })
        }
      }

      // Generate docs (default: true unless skipped)
      if (!mergedOptions.skipDocs && mergedOptions.generateDocs !== false) {
        postSteps.push({
          type: 'generateDocs',
          enabled: true,
          options: {},
        })
      }

      const results = await engine.compose(
        baseWithOps,
        addonsWithOps,
        postSteps
      )

      // Collect operation statistics
      if (statsCollector) {
        const operationTypes: string[] = []
        // Collect operation types from base and addons
        if (selectedBase.ops) {
          operationTypes.push(...selectedBase.ops.map((op) => op.type))
        }
        for (const addon of orderedAddons) {
          if (addon.ops) {
            operationTypes.push(...addon.ops.map((op) => op.type))
          }
        }
        statsCollector.recordOperations(results, operationTypes)
      }

      genSpinner.stop('Project generated successfully')

      // Execute post-steps and collect stats
      if (postSteps.length > 0 && statsCollector) {
        // Note: post-steps are executed inside engine.compose, but we need to track them
        // For now, we'll track them separately if needed
        const postStepTypes = postSteps.map((s) => s.type)
        // We would need to get post-step results from engine, but for now we'll estimate
        // This could be improved by returning post-step results from engine.compose
      }

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
      // Display statistics if requested
      if (statsCollector) {
        statsCollector.displaySummary(options.json ? 'json' : 'text')
      } else {
        // Show next steps
        outro(chalk.green('Done!'))
        logger.info(chalk.cyan('\nNext steps:'))
        logger.info(chalk.gray(`  cd ${projectName}`))
        if (postSteps.some((s) => s.type === 'installDependencies')) {
          logger.info(chalk.gray('  Dependencies have been installed'))
        } else {
          logger.info(
            chalk.gray(`  ${projectType === 'monorepo' ? 'pnpm' : 'npm'} install`)
          )
        }
        logger.info(
          chalk.gray(`  ${projectType === 'monorepo' ? 'pnpm' : 'npm'} run dev`)
        )
      }
    } catch (error) {
      genSpinner.stop('Generation failed')
      if (cancelled) {
        // Don't show error if cancelled
        return
      }
      errorHandler.handleError(error, { command: 'create', options })
    }
  } catch (error) {
    if (cancelled) {
      // Don't show error if cancelled
      return
    }
    errorHandler.handleError(error, { command: 'create', options })
  }
}

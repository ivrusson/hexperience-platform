import { resolve } from 'node:path'
import type { AddonTemplate, BaseTemplate } from '@hexp/catalog'
import { Catalog } from '@hexp/catalog'
import { Box, Text, useInput } from 'ink'
import React, { useEffect, useMemo, useState } from 'react'
import { findProjectRoot } from '../../utils/findProjectRoot'
import { validateProjectName } from '../../utils/validators'
import { useFocus } from '../hooks/useFocus'
import { useKeyboard } from '../hooks/useKeyboard'

type Step =
  | 'select-base'
  | 'select-addons'
  | 'enter-name'
  | 'select-type'
  | 'summary'
  | 'creating'
  | 'done'
  | 'continue'
  | 'error'

interface ProjectConfig {
  base: BaseTemplate | null
  addons: AddonTemplate[]
  name: string
  type: 'monorepo' | 'single' | null
  outputDir: string
}

interface ProjectCreatorProps {
  onContinueToModels?: (projectPath: string) => void
}

export function ProjectCreator({
  onContinueToModels,
}: ProjectCreatorProps = {}) {
  const [step, setStep] = useState<Step>('select-base')
  const [bases, setBases] = useState<BaseTemplate[]>([])
  const [addons, setAddons] = useState<AddonTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<ProjectConfig>({
    base: null,
    addons: [],
    name: '',
    type: null,
    outputDir: process.cwd(),
  })
  const [nameInput, setNameInput] = useState('')
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(
    new Set()
  )
  const [nameError, setNameError] = useState<string | null>(null)

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true)
        const projectRoot = findProjectRoot()

        if (!projectRoot) {
          setError(
            `Could not find templates directory.\n` +
              `Searched from: ${process.cwd()}\n` +
              `Please ensure templates/bases/ directory exists in the project.`
          )
          setStep('error')
          setLoading(false)
          return
        }

        const catalog = new Catalog(projectRoot)
        const loadedBases = await catalog.getBases()
        const loadedAddons = await catalog.getAddons()

        if (loadedBases.length === 0) {
          const templatesPath = `${projectRoot}/templates/bases`
          setError(
            `No base templates found.\n` +
              `Looking in: ${templatesPath}\n` +
              `Please ensure base templates exist in the templates/bases/ directory.`
          )
          setStep('error')
        } else {
          setBases(loadedBases)
          setAddons(loadedAddons)
        }
        setLoading(false)
      } catch (err) {
        const projectRoot = findProjectRoot() || process.cwd()
        const templatesPath = `${projectRoot}/templates/bases`
        setError(
          (err instanceof Error ? err.message : 'Failed to load templates') +
            `\nLooking in: ${templatesPath}`
        )
        setStep('error')
        setLoading(false)
      }
    }
    loadTemplates()
  }, [])

  // Base selection
  const baseIds = bases.map((b) => b.id)
  const {
    focused: focusedBase,
    focusNext: nextBase,
    focusPrevious: prevBase,
  } = useFocus({
    items: baseIds,
    onFocusChange: (id) => {
      const base = bases.find((b) => b.id === id)
      if (base) {
        setConfig((c) => ({ ...c, base }))
      }
    },
  })

  // Addon selection - memoized to prevent infinite loops
  const compatibleAddons = useMemo(() => {
    if (!config.base) return []
    return addons.filter((addon) => {
      if (!addon.requires || addon.requires.length === 0) return true
      return addon.requires.every((req) =>
        config.base?.capabilities?.includes(req)
      )
    })
  }, [addons, config.base])
  const addonIds = compatibleAddons.map((a) => a.id)
  const {
    focused: focusedAddon,
    focusNext: nextAddon,
    focusPrevious: prevAddon,
  } = useFocus({
    items: addonIds,
  })

  // Project type selection
  const projectTypes: Array<'monorepo' | 'single'> = ['monorepo', 'single']
  const {
    focused: focusedType,
    focusNext: nextType,
    focusPrevious: prevType,
  } = useFocus({
    items: projectTypes,
  })

  // Handle keyboard input for name entry
  useInput(
    (input, key) => {
      if (step === 'enter-name') {
        // Don't handle arrow keys here - let useKeyboard handle them
        if (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow) {
          return
        }
        if (key.return) {
          const trimmed = nameInput.trim()
          if (trimmed) {
            const validation = validateProjectName(trimmed)
            if (validation.valid) {
              const newName = trimmed
              setConfig((c) => {
                const newConfig = { ...c, name: newName }
                // Set type from base if available
                if (c.base?.projectType) {
                  newConfig.type = c.base.projectType
                }
                return newConfig
              })
              setNameInput('')
              setNameError(null)
              // Skip type selection if base already defines it
              if (config.base?.projectType) {
                setStep('summary')
              } else {
                setStep('select-type')
              }
            } else {
              setNameError(validation.error || 'Invalid project name')
            }
          } else {
            setNameError('Project name cannot be empty')
          }
        } else if (key.backspace || key.delete) {
          setNameInput((prev) => prev.slice(0, -1))
          setNameError(null)
        } else if (input && !key.ctrl && !key.meta) {
          setNameInput((prev) => prev + input)
          setNameError(null)
        }
      }
    },
    { isActive: step === 'enter-name' }
  )

  // Helper function to go back
  const goBack = () => {
    if (step === 'select-addons') {
      setStep('select-base')
    } else if (step === 'enter-name') {
      // Go back to addons if there are any, otherwise to base
      if (compatibleAddons.length > 0) {
        setStep('select-addons')
      } else {
        setStep('select-base')
      }
    } else if (step === 'select-type') {
      setStep('enter-name')
    } else if (step === 'summary') {
      // Go back to type selection if it wasn't skipped
      if (!config.base?.projectType) {
        setStep('select-type')
      } else {
        setStep('enter-name')
      }
    }
  }

  // Keyboard navigation - disabled during name entry to avoid conflicts
  useKeyboard({
    enabled: step !== 'enter-name',
    onArrowUp: () => {
      if (step === 'select-base') prevBase()
      else if (step === 'select-addons') prevAddon()
      else if (step === 'select-type') prevType()
    },
    onArrowDown: () => {
      if (step === 'select-base') nextBase()
      else if (step === 'select-addons') nextAddon()
      else if (step === 'select-type') nextType()
    },
    onArrowLeft: () => {
      // Go back with left arrow
      goBack()
    },
    onEnter: () => {
      if (step === 'select-base' && focusedBase) {
        // Skip addons if none are compatible
        if (compatibleAddons.length === 0) {
          setStep('enter-name')
        } else {
          setStep('select-addons')
        }
      } else if (step === 'select-addons') {
        // Advance to name entry
        setStep('enter-name')
      } else if (step === 'select-type' && focusedType) {
        setConfig((c) => ({ ...c, type: focusedType }))
        setStep('summary')
      } else if (step === 'summary') {
        // Start creation
        setStep('creating')
        createProject()
      } else if (step === 'done') {
        // Continue to next step
        setStep('continue')
      }
    },
    onKeyPress: (key) => {
      if (step === 'select-addons' && key === ' ') {
        if (focusedAddon) {
          setSelectedAddonIds((prev) => {
            const next = new Set(prev)
            if (next.has(focusedAddon)) {
              next.delete(focusedAddon)
            } else {
              next.add(focusedAddon)
            }
            return next
          })
        }
      } else if (step === 'summary' && key === 'c') {
        createProject()
      } else if (step === 'enter-name' && key === '\r') {
        // Already handled by useInput
      } else if (
        (step === 'select-addons' ||
          step === 'enter-name' ||
          step === 'select-type' ||
          step === 'summary') &&
        key === 'b'
      ) {
        // Go back with 'b' key
        goBack()
      } else if (step === 'done' && key === 'm') {
        // Continue to model editor with project path
        const outputPath = resolve(config.outputDir, config.name)
        if (onContinueToModels) {
          onContinueToModels(outputPath)
        }
      } else if (step === 'continue') {
        if (key === 'm') {
          // Open model editor - handled by switching the component
        }
      }
    },
    onEscape: () => {
      if (step === 'select-base') {
        process.exit(0)
      } else if (step === 'select-addons') {
        setStep('select-base')
      } else if (step === 'select-type') {
        setStep('select-addons')
      } else if (step === 'enter-name') {
        setStep('select-addons')
      } else if (step === 'summary') {
        setStep('select-type')
      } else if (step === 'done' || step === 'error') {
        process.exit(0)
      }
    },
  })

  // Update selected addons when selection changes
  useEffect(() => {
    const selected = compatibleAddons.filter((a) => selectedAddonIds.has(a.id))
    setConfig((c) => {
      // Only update if addons actually changed
      const currentIds = c.addons
        .map((a) => a.id)
        .sort()
        .join(',')
      const newIds = selected
        .map((a) => a.id)
        .sort()
        .join(',')
      if (currentIds !== newIds) {
        return { ...c, addons: selected }
      }
      return c
    })
  }, [selectedAddonIds, compatibleAddons])

  // Set default project type from base when base is selected
  useEffect(() => {
    if (config.base?.projectType && !config.type) {
      setConfig((c) => {
        // Only update if type is not already set
        if (!c.type && c.base?.projectType) {
          return { ...c, type: c.base.projectType }
        }
        return c
      })
    }
  }, [config.base?.projectType, config.type])

  // Helper function to render stepper
  const renderStepper = () => {
    const steps = [
      { id: 'select-base', label: 'Base', step: 'select-base' },
      { id: 'select-addons', label: 'Addons', step: 'select-addons' },
      { id: 'enter-name', label: 'Name', step: 'enter-name' },
      { id: 'select-type', label: 'Type', step: 'select-type' },
      { id: 'summary', label: 'Summary', step: 'summary' },
    ]

    // Determine which steps are visible (skip addons if none compatible, skip type if base defines it)
    const visibleSteps = steps.filter((s) => {
      if (s.id === 'select-addons' && compatibleAddons.length === 0)
        return false
      if (s.id === 'select-type' && config.base?.projectType) return false
      return true
    })

    const currentStepIndex = visibleSteps.findIndex((s) => s.step === step)

    return (
      <Box marginBottom={1} flexDirection="row">
        {visibleSteps.map((s, index) => {
          const isActive = s.step === step
          const isCompleted = currentStepIndex > index

          return (
            <React.Fragment key={s.id}>
              <Box marginRight={1}>
                <Text>
                  {isCompleted ? (
                    <Text color="green">✓</Text>
                  ) : isActive ? (
                    <Text color="cyan" bold>
                      ●
                    </Text>
                  ) : (
                    <Text color="gray">○</Text>
                  )}
                  <Text
                    color={isActive ? 'cyan' : isCompleted ? 'green' : 'gray'}
                  >
                    {' '}
                    {s.label}
                  </Text>
                </Text>
              </Box>
              {index < visibleSteps.length - 1 && (
                <Box marginRight={1}>
                  <Text color="gray">→</Text>
                </Box>
              )}
            </React.Fragment>
          )
        })}
      </Box>
    )
  }

  const createProject = async () => {
    try {
      if (!config.base || !config.name || !config.type) {
        throw new Error('Missing required configuration')
      }

      const projectOutputPath = resolve(config.outputDir, config.name)

      const { createProjectCore } = await import(
        '../../utils/createProjectCore'
      )
      await createProjectCore({
        baseId: config.base.id,
        addonIds: config.addons.map((a) => a.id),
        projectName: config.name,
        projectType: config.type,
        outputDir: config.outputDir,
        skipInstall: false,
        skipFormat: false,
        skipLint: false,
        skipTypeCheck: false,
        skipGitInit: true, // Don't init git from TUI by default
        skipDocs: false,
      })

      // Verify the directory was created and has files
      const { readdirSync, existsSync } = await import('node:fs')
      if (!existsSync(projectOutputPath)) {
        throw new Error(
          `Output directory was not created: ${projectOutputPath}`
        )
      }

      const files = readdirSync(projectOutputPath)
      if (files.length === 0) {
        throw new Error(
          `Project directory was created but is empty: ${projectOutputPath}\n` +
            `This might indicate that template operations failed silently.`
        )
      }

      // Change to project directory for next steps
      process.chdir(projectOutputPath)

      setStep('done')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create project'
      const errorStack = err instanceof Error ? err.stack : undefined
      setError(errorMessage + (errorStack ? `\n\nStack:\n${errorStack}` : ''))
      setStep('error')
    }
  }

  if (loading) {
    return (
      <Box flexDirection="column">
        <Text color="cyan">Loading templates...</Text>
      </Box>
    )
  }

  if (error && step === 'error') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="red" bold>
            Error
          </Text>
        </Box>
        <Box flexDirection="column" marginBottom={1}>
          {error.split('\n').map((line) => (
            <Text key={line} color="red">
              {line}
            </Text>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Press ESC to exit</Text>
        </Box>
      </Box>
    )
  }

  if (step === 'creating') {
    return (
      <Box flexDirection="column">
        <Text color="cyan">Creating project...</Text>
        <Text color="gray">Please wait...</Text>
      </Box>
    )
  }

  if (step === 'done') {
    const outputPath = resolve(config.outputDir, config.name)
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="green" bold>
            Project created successfully!
          </Text>
        </Box>
        <Box flexDirection="column" marginBottom={1}>
          <Text>
            <Text color="gray">Project: </Text>
            <Text>{config.name}</Text>
          </Text>
          <Text>
            <Text color="gray">Location: </Text>
            <Text>{outputPath}</Text>
          </Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text color="yellow">What would you like to do next?</Text>
          {config.base?.capabilities?.includes('orm') && (
            <Text color="gray">
              Press 'm' to edit models/schemas, Enter to finish, ESC to exit
            </Text>
          )}
          {!config.base?.capabilities?.includes('orm') && (
            <Text color="gray">Press Enter to finish, ESC to exit</Text>
          )}
        </Box>
      </Box>
    )
  }

  if (step === 'continue') {
    // Check if base has database/orm capabilities to show model editor
    const hasDatabase =
      config.base?.capabilities?.includes('orm') ||
      config.base?.capabilities?.includes('database') ||
      config.base?.id === 'base-hono-drizzle'

    if (hasDatabase && onContinueToModels) {
      // Switch to model editor with project path
      const outputPath = resolve(config.outputDir, config.name)
      onContinueToModels(outputPath)
      return null
    }

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="cyan" bold>
            Continue Setup
          </Text>
        </Box>
        <Box flexDirection="column" marginBottom={1}>
          <Text color="gray">Choose what to do next:</Text>
        </Box>
        <Box flexDirection="column">
          {hasDatabase && (
            <Box>
              <Text color="cyan">[m] Edit Models/Schemas</Text>
            </Box>
          )}
          <Box>
            <Text color="gray">[ESC] Exit</Text>
          </Box>
        </Box>
      </Box>
    )
  }

  if (step === 'select-base') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="cyan" bold>
            Create Hexperience Project
          </Text>
        </Box>
        {renderStepper()}
        <Box marginBottom={1}>
          <Text color="gray">
            Arrow keys to navigate, Enter to select, ← or 'b' to go back
          </Text>
        </Box>
        <Box flexDirection="column">
          {bases.length === 0 ? (
            <Text color="yellow">No base templates found</Text>
          ) : (
            bases.map((base) => {
              const isFocused = base.id === focusedBase
              return (
                <Box key={base.id}>
                  <Text color={isFocused ? 'cyan' : 'white'}>
                    {isFocused ? '> ' : '  '}
                    {base.name} - {base.description || 'No description'}
                  </Text>
                </Box>
              )
            })
          )}
        </Box>
      </Box>
    )
  }

  if (step === 'select-addons') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="cyan" bold>
            Select Addons (Optional)
          </Text>
        </Box>
        {renderStepper()}
        <Box marginBottom={1}>
          <Text color="gray">
            Space to toggle, Arrow keys to navigate, Enter to continue, ← or 'b'
            to go back
          </Text>
        </Box>
        <Box flexDirection="column">
          {compatibleAddons.length === 0 ? (
            <Text color="yellow">No compatible addons available</Text>
          ) : (
            compatibleAddons.map((addon) => {
              const isFocused = addon.id === focusedAddon
              const isSelected = selectedAddonIds.has(addon.id)
              return (
                <Box key={addon.id}>
                  <Text color={isFocused ? 'cyan' : 'white'}>
                    {isFocused ? '> ' : '  '}
                    {isSelected ? '[✓] ' : '[ ] '}
                    {addon.name} - {addon.description || 'No description'}
                  </Text>
                </Box>
              )
            })
          )}
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Press Enter to continue to project name</Text>
        </Box>
      </Box>
    )
  }

  if (step === 'enter-name') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="cyan" bold>
            Project Name
          </Text>
        </Box>
        {renderStepper()}
        <Box marginBottom={1}>
          <Text color="gray">
            Enter project name and press Enter, ESC or 'b' to go back
          </Text>
        </Box>
        <Box>
          <Text>
            <Text color="cyan">Name: </Text>
            <Text>{nameInput}</Text>
            <Text color="gray">_</Text>
          </Text>
        </Box>
        {nameError && (
          <Box marginTop={1}>
            <Text color="red">{nameError}</Text>
          </Box>
        )}
      </Box>
    )
  }

  if (step === 'select-type') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="cyan" bold>
            Project Type
          </Text>
        </Box>
        {renderStepper()}
        <Box marginBottom={1}>
          <Text color="gray">
            Arrow keys to navigate, Enter to select, ← or 'b' to go back
          </Text>
        </Box>
        <Box flexDirection="column">
          {projectTypes.map((type) => {
            const isFocused = type === focusedType
            return (
              <Box key={type}>
                <Text color={isFocused ? 'cyan' : 'white'}>
                  {isFocused ? '> ' : '  '}
                  {type === 'monorepo' ? 'Monorepo (Turbo)' : 'Single Package'}
                </Text>
              </Box>
            )
          })}
        </Box>
      </Box>
    )
  }

  if (step === 'summary') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="cyan" bold>
            Project Summary
          </Text>
        </Box>
        {renderStepper()}
        <Box flexDirection="column" marginBottom={1}>
          <Text>
            <Text color="gray">Base: </Text>
            <Text>{config.base?.name}</Text>
          </Text>
          <Text>
            <Text color="gray">Addons: </Text>
            <Text>
              {config.addons.length > 0
                ? config.addons.map((a) => a.name).join(', ')
                : 'None'}
            </Text>
          </Text>
          <Text>
            <Text color="gray">Name: </Text>
            <Text>{config.name}</Text>
          </Text>
          <Text>
            <Text color="gray">Type: </Text>
            <Text>
              {config.type === 'monorepo' ? 'Monorepo' : 'Single Package'}
            </Text>
          </Text>
          <Text>
            <Text color="gray">Output: </Text>
            <Text>{config.outputDir}</Text>
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color="yellow">
            Press Enter to create project, ← or 'b' to go back, ESC to exit
          </Text>
        </Box>
      </Box>
    )
  }

  return null
}

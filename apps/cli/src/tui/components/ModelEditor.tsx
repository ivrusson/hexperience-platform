import { Box, Text, useInput } from 'ink'
import { useCallback, useEffect, useState } from 'react'
import { generateCode } from '../../utils/schemaGenerator'
import { useFocus } from '../hooks/useFocus'
import { useKeyboard } from '../hooks/useKeyboard'
import { type Model, type ModelField, modelStore } from '../stores/modelStore'

interface ModelEditorProps {
  projectPath?: string
}

const FIELD_TYPES: ModelField['type'][] = [
  'string',
  'number',
  'boolean',
  'date',
  'object',
  'array',
]

type FormStep =
  | 'list'
  | 'enter-model-name'
  | 'add-field-name'
  | 'select-field-type'
  | 'field-options'
  | 'review-model'

export function ModelEditor({ projectPath }: ModelEditorProps = {}) {
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [step, setStep] = useState<FormStep>('list')
  const [saving, setSaving] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [_savingModel, setSavingModel] = useState(false)
  const [_savingField, setSavingField] = useState(false)
  const [_lastSaved, setLastSaved] = useState<string | null>(null)

  // Form state
  const [modelName, setModelName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [fields, setFields] = useState<ModelField[]>([])
  const [currentField, setCurrentField] = useState<Partial<ModelField>>({
    name: '',
    type: 'string',
    required: false,
  })
  const [fieldNameInput, setFieldNameInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    // Load models from file if projectPath is available
    const loadModels = async () => {
      if (projectPath) {
        const { join } = await import('node:path')
        const modelsPath = join(projectPath, '.hexp', 'models.json')
        try {
          await modelStore.loadFromFile(modelsPath)
        } catch (error) {
          // If file doesn't exist, start with empty models (this is OK)
          // Only log actual errors, not missing file
          if (error instanceof Error && !error.message.includes('ENOENT')) {
          }
        }
      } else {
        // Try to auto-detect project if no projectPath provided
        try {
          const { findUserProject } = await import(
            '../../utils/findUserProject'
          )
          const detectedPath = await findUserProject(process.cwd())
          if (detectedPath) {
            const { join } = await import('node:path')
            const modelsPath = join(detectedPath, '.hexp', 'models.json')
            try {
              await modelStore.loadFromFile(modelsPath)
            } catch (_error) {
              // File doesn't exist, start with empty models
            }
          }
        } catch (_error) {
          // Auto-detection failed, continue with empty models
        }
      }
      setModels(modelStore.getModels())
    }

    loadModels()

    const unsubscribe = modelStore.subscribe(() => {
      setModels(modelStore.getModels())
    })
    return unsubscribe
  }, [projectPath])

  // Initialize form when entering add/edit mode
  useEffect(() => {
    if (step === 'enter-model-name') {
      setNameInput(isEditMode && selectedModel ? selectedModel.name : '')
      setFormError(null)
    } else if (step === 'add-field-name') {
      setFieldNameInput('')
      setCurrentField({ name: '', type: 'string', required: false })
      setFormError(null)
    } else if (step === 'select-field-type') {
      setFormError(null)
    } else if (step === 'review-model') {
      setFormError(null)
    }
  }, [step, isEditMode, selectedModel])

  const modelIds = models.map((m) => m.id)
  const { focused, focusNext, focusPrevious } = useFocus({
    items: modelIds,
    onFocusChange: (id) => {
      const model = models.find((m) => m.id === id)
      setSelectedModel(model || null)
    },
  })

  // Field type selection
  const {
    focused: focusedType,
    focusNext: focusNextType,
    focusPrevious: focusPrevType,
  } = useFocus({
    items: FIELD_TYPES,
  })

  // Handle input for model name
  useInput(
    (input, key) => {
      if (step === 'enter-model-name') {
        if (key.escape) {
          goBack()
        } else if (key.return) {
          const trimmed = nameInput.trim()
          if (trimmed) {
            setModelName(trimmed)
            setNameInput('')
            setFormError(null)
            setStep('review-model')
          } else {
            setFormError('Model name cannot be empty')
          }
        } else if (key.backspace || key.delete) {
          setNameInput((prev) => prev.slice(0, -1))
          setFormError(null)
        } else if (input && !key.ctrl && !key.meta) {
          setNameInput((prev) => prev + input)
          setFormError(null)
        }
      }
    },
    { isActive: step === 'enter-model-name' }
  )

  // Handle input for field name
  useInput(
    (input, key) => {
      if (step === 'add-field-name') {
        if (key.escape) {
          goBack()
        } else if (key.return) {
          const trimmed = fieldNameInput.trim()
          if (trimmed) {
            setCurrentField((prev) => ({ ...prev, name: trimmed }))
            setFieldNameInput('')
            setFormError(null)
            setStep('select-field-type')
          } else {
            setFormError('Field name cannot be empty')
          }
        } else if (key.backspace || key.delete) {
          setFieldNameInput((prev) => prev.slice(0, -1))
          setFormError(null)
        } else if (input && !key.ctrl && !key.meta) {
          setFieldNameInput((prev) => prev + input)
          setFormError(null)
        }
      }
    },
    { isActive: step === 'add-field-name' }
  )

  const handleSaveModel = useCallback(async () => {
    if (!modelName.trim()) {
      setFormError('Model name is required')
      return
    }

    try {
      setSavingModel(true)
      setFormError(null)

      const modelData: Omit<Model, 'id'> = {
        name: modelName.trim(),
        fields,
        relations: [],
      }

      if (isEditMode && selectedModel) {
        modelStore.updateModel(selectedModel.id, modelData)
      } else {
        modelStore.addModel(modelData)
      }

      // Save to file if projectPath is available
      if (projectPath) {
        const { join } = await import('node:path')
        const modelsPath = join(projectPath, '.hexp', 'models.json')
        await modelStore.saveToFile(modelsPath)
      }

      setLastSaved(new Date().toLocaleTimeString())
      setTimeout(() => {
        setLastSaved(null)
      }, 2000)

      // Reset and go back to list
      setModelName('')
      setNameInput('')
      setFields([])
      setCurrentField({ name: '', type: 'string', required: false })
      setFieldNameInput('')
      setFormError(null)
      setIsEditMode(false)
      setSelectedModel(null)
      setStep('list')
    } catch (error) {
      setFormError(
        `Failed to save model: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setSavingModel(false)
    }
  }, [modelName, fields, isEditMode, selectedModel, projectPath])

  const handleAddField = useCallback(() => {
    setStep('add-field-name')
  }, [])

  const handleFieldTypeSelected = useCallback(async () => {
    if (currentField.name && focusedType) {
      try {
        setSavingField(true)
        const newField: ModelField = {
          name: currentField.name,
          type: focusedType,
          required: currentField.required ?? false,
          defaultValue: currentField.defaultValue,
        }
        setFields((prev) => [...prev, newField])
        setCurrentField({ name: '', type: 'string', required: false })
        setFieldNameInput('')

        // Save to file if projectPath is available
        if (projectPath) {
          const { join } = await import('node:path')
          const _modelsPath = join(projectPath, '.hexp', 'models.json')
          // Create a temporary model to save
          const _tempModel: Omit<Model, 'id'> = {
            name: modelName || 'temp',
            fields: [...fields, newField],
            relations: [],
          }
          const _tempStore = { ...modelStore }
          // We'll save after the model is complete, so just continue
        }

        setStep('review-model')
      } finally {
        setSavingField(false)
      }
    }
  }, [currentField, focusedType, fields, modelName, projectPath])

  const _handleDeleteField = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const goBack = useCallback(() => {
    if (step === 'review-model') {
      setStep('enter-model-name')
      setNameInput(modelName)
    } else if (step === 'select-field-type') {
      setStep('add-field-name')
      setFieldNameInput(currentField.name || '')
    } else if (step === 'add-field-name') {
      setStep('review-model')
    } else if (step === 'enter-model-name') {
      setStep('list')
      setIsEditMode(false)
      setSelectedModel(null)
      setModelName('')
      setNameInput('')
      setFields([])
      setCurrentField({ name: '', type: 'string', required: false })
      setFieldNameInput('')
    } else if (step === 'list') {
      process.exit(0)
    }
  }, [step, currentField.name, modelName])

  // Keyboard handlers
  useKeyboard({
    enabled: true, // Always enabled, but ESC is handled in useInput for input steps
    onArrowUp: () => {
      if (step === 'list') {
        focusPrevious()
      } else if (step === 'select-field-type') {
        focusPrevType()
      }
    },
    onArrowDown: () => {
      if (step === 'list') {
        focusNext()
      } else if (step === 'select-field-type') {
        focusNextType()
      }
    },
    onEnter: () => {
      if (step === 'list' && focused) {
        const model = models.find((m) => m.id === focused)
        if (model) {
          setSelectedModel(model)
          setIsEditMode(true)
          setModelName(model.name)
          setFields([...model.fields])
          setStep('review-model')
        }
      } else if (step === 'select-field-type' && focusedType) {
        setCurrentField((prev) => ({ ...prev, type: focusedType }))
        handleFieldTypeSelected()
      } else if (step === 'review-model') {
        handleSaveModel()
      }
    },
    onKeyPress: async (key) => {
      if (step === 'list') {
        if (key === 'a' || key === 'n') {
          setIsEditMode(false)
          setModelName('')
          setFields([])
          setStep('enter-model-name')
        } else if (key === 'd' && focused) {
          const model = models.find((m) => m.id === focused)
          if (model) {
            modelStore.deleteModel(model.id)
            // Save to file after deletion
            if (projectPath) {
              import('node:path').then(({ join }) => {
                const modelsPath = join(projectPath, '.hexp', 'models.json')
                modelStore.saveToFile(modelsPath).catch((err) => {
                  setError(
                    `Failed to save: ${err instanceof Error ? err.message : String(err)}`
                  )
                })
              })
            }
          }
        }
      } else if (step === 'review-model') {
        if (key === 'a' || key === '+') {
          handleAddField()
        } else if (key === 's') {
          handleSaveModel()
        }
      } else if (step === 'select-field-type') {
        // Allow number keys 1-6 for quick selection
        const typeIndex = Number.parseInt(key, 10) - 1
        if (typeIndex >= 0 && typeIndex < FIELD_TYPES.length) {
          setCurrentField((prev) => ({ ...prev, type: FIELD_TYPES[typeIndex] }))
          handleFieldTypeSelected()
        }
      }
    },
    onEscape: () => {
      // Only handle ESC if not in input mode (input modes handle ESC in useInput)
      if (step !== 'enter-model-name' && step !== 'add-field-name') {
        goBack()
      }
    },
    onCtrlS: async () => {
      if (!projectPath) {
        return
      }

      try {
        setSaving(true)
        setError(null)

        // Save models to JSON file first
        const { join } = await import('node:path')
        const modelsPath = join(projectPath, '.hexp', 'models.json')
        await modelStore.saveToFile(modelsPath)

        // Generate code if there are models
        if (models.length > 0) {
          await generateCode(projectPath, models)
        }

        setLastGenerated(new Date().toLocaleTimeString())
        setTimeout(() => {
          setSaving(false)
          setLastGenerated(null)
        }, 2000)
      } catch (err) {
        setSaving(false)
        setError(err instanceof Error ? err.message : String(err))
        setTimeout(() => setError(null), 5000)
      }
    },
  })

  // Render different steps
  if (step === 'enter-model-name') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="cyan" bold>
            {isEditMode ? '✏️  Edit Model' : '✨ Create New Model'}
          </Text>
        </Box>
        <Box marginBottom={2} flexDirection="column">
          <Box marginBottom={1}>
            <Text color="yellow" bold>
              📝 Model Name
            </Text>
          </Box>
          <Box>
            <Text color="cyan">{'> '}</Text>
            <Box>
              {nameInput ? (
                <Text color="white" bold>
                  {nameInput}
                </Text>
              ) : (
                <Text color="gray" dimColor>
                  (type model name here)
                </Text>
              )}
              <Text color="cyan">█</Text>
            </Box>
          </Box>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray" dimColor>
              Press{' '}
            </Text>
            <Text color="cyan">Enter</Text>
            <Text color="gray" dimColor>
              {' '}
              to continue,{' '}
            </Text>
            <Text color="cyan">ESC</Text>
            <Text color="gray" dimColor>
              {' '}
              to cancel
            </Text>
          </Box>
          {formError && (
            <Box marginTop={1}>
              <Text color="red" bold>
                ❌ {formError}
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    )
  }

  if (step === 'add-field-name') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="cyan" bold>
            ➕ Add Field
          </Text>
        </Box>
        <Box marginBottom={2} flexDirection="column">
          <Box marginBottom={1}>
            <Text color="yellow" bold>
              📝 Field Name
            </Text>
          </Box>
          <Box>
            <Text color="cyan">{'> '}</Text>
            <Box>
              {fieldNameInput ? (
                <Text color="white" bold>
                  {fieldNameInput}
                </Text>
              ) : (
                <Text color="gray" dimColor>
                  (type field name here)
                </Text>
              )}
              <Text color="cyan">█</Text>
            </Box>
          </Box>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray" dimColor>
              Press{' '}
            </Text>
            <Text color="cyan">Enter</Text>
            <Text color="gray" dimColor>
              {' '}
              to continue,{' '}
            </Text>
            <Text color="cyan">ESC</Text>
            <Text color="gray" dimColor>
              {' '}
              to go back
            </Text>
          </Box>
          {formError && (
            <Box marginTop={1}>
              <Text color="red" bold>
                ❌ {formError}
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    )
  }

  if (step === 'select-field-type') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="cyan" bold>
            🔧 Select Field Type
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text color="gray" dimColor>
            Field:{' '}
          </Text>
          <Text color="white" bold>
            {currentField.name}
          </Text>
        </Box>
        <Box marginBottom={2} flexDirection="column">
          <Box marginBottom={1}>
            <Text color="yellow" bold>
              Available Types:
            </Text>
          </Box>
          {FIELD_TYPES.map((type, index) => {
            const isFocused = focusedType === type
            return (
              <Box key={type} marginBottom={1} marginLeft={2}>
                <Text color={isFocused ? 'cyan' : 'white'}>
                  {isFocused ? '▶ ' : '  '}
                  <Text bold color={isFocused ? 'cyan' : 'white'}>
                    {index + 1}. {type}
                  </Text>
                </Text>
              </Box>
            )
          })}
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray" dimColor>
              Use <Text color="cyan">↑↓</Text> to navigate,{' '}
              <Text color="cyan">Enter</Text> to select,{' '}
              <Text color="cyan">1-6</Text> for quick select
            </Text>
          </Box>
          <Box>
            <Text color="gray" dimColor>
              Press{' '}
            </Text>
            <Text color="cyan">ESC</Text>
            <Text color="gray" dimColor>
              {' '}
              to go back
            </Text>
          </Box>
        </Box>
      </Box>
    )
  }

  if (step === 'review-model') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="cyan" bold>
            {isEditMode
              ? `✏️  Edit Model: ${modelName}`
              : `✨ Create Model: ${modelName}`}
          </Text>
        </Box>

        <Box marginBottom={2} flexDirection="column">
          <Box marginBottom={1}>
            <Text color="yellow" bold>
              🔧 Fields ({fields.length})
            </Text>
          </Box>

          {fields.length === 0 ? (
            <Box marginLeft={2} marginBottom={1}>
              <Text color="gray" dimColor>
                No fields yet. Press <Text color="cyan">'+'</Text> or{' '}
                <Text color="cyan">'a'</Text> to add one.
              </Text>
            </Box>
          ) : (
            fields.map((field) => (
              <Box key={field.name} marginBottom={1} marginLeft={2}>
                <Text color="white">
                  <Text bold>{field.name}</Text>
                  <Text color="gray" dimColor>
                    {' '}
                    ({field.type}
                  </Text>
                  {field.required && (
                    <Text color="red" dimColor>
                      , required
                    </Text>
                  )}
                  <Text color="gray" dimColor>
                    )
                  </Text>
                </Text>
              </Box>
            ))
          )}
        </Box>

        <Box marginTop={2} flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray" dimColor>
              Press <Text color="cyan">'+'</Text> or{' '}
              <Text color="cyan">'a'</Text> to add field,{' '}
              <Text color="cyan">Enter</Text> to save model
            </Text>
          </Box>
          <Box>
            <Text color="gray" dimColor>
              Press{' '}
            </Text>
            <Text color="cyan">ESC</Text>
            <Text color="gray" dimColor>
              {' '}
              to go back
            </Text>
          </Box>
          {formError && (
            <Box marginTop={1}>
              <Text color="red" bold>
                ❌ {formError}
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    )
  }

  // List view
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          Model Editor
        </Text>
      </Box>
      <Box marginBottom={1} flexDirection="column">
        <Box>
          <Text color="gray" dimColor>
            Use{' '}
          </Text>
          <Text color="cyan">↑↓</Text>
          <Text color="gray" dimColor>
            {' '}
            to navigate,{' '}
          </Text>
          <Text color="cyan">Enter</Text>
          <Text color="gray" dimColor>
            {' '}
            to edit,{' '}
          </Text>
          <Text color="cyan">'n'</Text>
          <Text color="gray" dimColor>
            {' '}
            to create new,{' '}
          </Text>
          <Text color="cyan">'d'</Text>
          <Text color="gray" dimColor>
            {' '}
            to delete
          </Text>
        </Box>
        {projectPath && (
          <Box>
            <Text color="gray" dimColor>
              {'  '}Press{' '}
            </Text>
            <Text color="cyan">Ctrl+S</Text>
            <Text color="gray" dimColor>
              {' '}
              to generate schemas and API code
            </Text>
          </Box>
        )}
        <Box>
          <Text color="gray" dimColor>
            {'  '}Press{' '}
          </Text>
          <Text color="cyan">ESC</Text>
          <Text color="gray" dimColor>
            {' '}
            to exit
          </Text>
        </Box>
      </Box>
      {saving && (
        <Box marginBottom={1}>
          <Text color="yellow">Generating schemas and API code...</Text>
        </Box>
      )}
      {lastGenerated && (
        <Box marginBottom={1}>
          <Text color="green">
            Code generated successfully at {lastGenerated}
          </Text>
        </Box>
      )}
      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}
      <Box flexDirection="column">
        {models.length === 0 ? (
          <Text color="yellow">No models yet. Press 'n' to create one.</Text>
        ) : (
          models.map((model) => {
            const isFocused = model.id === focused
            return (
              <Box key={model.id}>
                <Text color={isFocused ? 'cyan' : 'white'}>
                  {isFocused ? '> ' : '  '}
                  {model.name} ({model.fields.length} fields)
                </Text>
              </Box>
            )
          })
        )}
      </Box>
    </Box>
  )
}

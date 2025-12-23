import { Box, Text } from 'ink'
import { useEffect, useState } from 'react'
import { useFocus } from '../hooks/useFocus.js'
import { useKeyboard } from '../hooks/useKeyboard.js'
import { type Model, modelStore } from '../stores/modelStore.js'

export function ModelEditor() {
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [mode, setMode] = useState<'list' | 'edit' | 'add'>('list')

  useEffect(() => {
    setModels(modelStore.getModels())
    const unsubscribe = modelStore.subscribe(() => {
      setModels(modelStore.getModels())
    })
    return unsubscribe
  }, [])

  const modelIds = models.map((m) => m.id)
  const { focused, focusNext, focusPrevious, setFocus } = useFocus({
    items: modelIds,
    onFocusChange: (id) => {
      const model = models.find((m) => m.id === id)
      setSelectedModel(model || null)
    },
  })

  useKeyboard({
    onArrowUp: () => {
      if (mode === 'list') {
        focusPrevious()
      }
    },
    onArrowDown: () => {
      if (mode === 'list') {
        focusNext()
      }
    },
    onEnter: () => {
      if (mode === 'list' && focused) {
        const model = models.find((m) => m.id === focused)
        if (model) {
          setSelectedModel(model)
          setMode('edit')
        }
      }
    },
    onKeyPress: (key) => {
      if (mode === 'list') {
        if (key === 'a') {
          setMode('add')
        } else if (key === 'd' && focused) {
          const model = models.find((m) => m.id === focused)
          if (model) {
            modelStore.deleteModel(model.id)
          }
        }
      }
    },
    onEscape: () => {
      if (mode === 'edit' || mode === 'add') {
        setMode('list')
        setSelectedModel(null)
      } else {
        process.exit(0)
      }
    },
    onCtrlS: () => {},
  })

  if (mode === 'add') {
    return (
      <Box flexDirection="column">
        <Text color="cyan">Add New Model</Text>
        <Text color="gray">Press ESC to cancel</Text>
        <Text color="yellow">
          Model creation form would go here (simplified for now)
        </Text>
      </Box>
    )
  }

  if (mode === 'edit' && selectedModel) {
    return (
      <Box flexDirection="column">
        <Text color="cyan">Editing: {selectedModel.name}</Text>
        <Text color="gray">Press ESC to go back</Text>
        <Text color="yellow">
          Model editor form would go here (simplified for now)
        </Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          Model Editor
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="gray">
          Use arrow keys to navigate, Enter to edit, 'a' to add, 'd' to delete,
          ESC to exit
        </Text>
      </Box>
      <Box flexDirection="column">
        {models.length === 0 ? (
          <Text color="yellow">No models yet. Press 'a' to add one.</Text>
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
      {selectedModel && (
        <Box marginTop={1} flexDirection="column">
          <Text color="gray">Preview:</Text>
          <Text>{JSON.stringify(selectedModel, null, 2)}</Text>
        </Box>
      )}
    </Box>
  )
}

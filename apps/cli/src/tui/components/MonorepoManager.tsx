import { Box, Text } from 'ink'
import { useEffect, useState } from 'react'
import { useFocus } from '../hooks/useFocus.js'
import { useKeyboard } from '../hooks/useKeyboard.js'
import { monorepoStore, type Package } from '../stores/monorepoStore.js'

export function MonorepoManager() {
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [mode, setMode] = useState<'list' | 'edit' | 'add'>('list')
  const [view, setView] = useState<'all' | 'apps' | 'packages'>('all')

  useEffect(() => {
    updatePackages()
    const unsubscribe = monorepoStore.subscribe(() => {
      updatePackages()
    })
    return unsubscribe
  }, [updatePackages])

  const updatePackages = () => {
    if (view === 'apps') {
      setPackages(monorepoStore.getApps())
    } else if (view === 'packages') {
      setPackages(monorepoStore.getPackagesOnly())
    } else {
      setPackages(monorepoStore.getPackages())
    }
  }

  const packageIds = packages.map((p) => p.id)
  const { focused, focusNext, focusPrevious } = useFocus({
    items: packageIds,
    onFocusChange: (id) => {
      const pkg = packages.find((p) => p.id === id)
      setSelectedPackage(pkg || null)
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
        const pkg = packages.find((p) => p.id === focused)
        if (pkg) {
          setSelectedPackage(pkg)
          setMode('edit')
        }
      }
    },
    onKeyPress: (key) => {
      if (mode === 'list') {
        if (key === 'a') {
          setMode('add')
        } else if (key === 'p') {
          setMode('add')
        } else if (key === 'd' && focused) {
          const pkg = packages.find((p) => p.id === focused)
          if (pkg) {
            monorepoStore.deletePackage(pkg.id)
          }
        } else if (key === '1') {
          setView('all')
        } else if (key === '2') {
          setView('apps')
        } else if (key === '3') {
          setView('packages')
        }
      }
    },
    onEscape: () => {
      if (mode === 'edit' || mode === 'add') {
        setMode('list')
        setSelectedPackage(null)
      } else {
        process.exit(0)
      }
    },
  })

  if (mode === 'add') {
    return (
      <Box flexDirection="column">
        <Text color="cyan">Add New Package/App</Text>
        <Text color="gray">Press ESC to cancel</Text>
        <Text color="yellow">
          Package creation form would go here (simplified for now)
        </Text>
      </Box>
    )
  }

  if (mode === 'edit' && selectedPackage) {
    return (
      <Box flexDirection="column">
        <Text color="cyan">Editing: {selectedPackage.name}</Text>
        <Text color="gray">Press ESC to go back</Text>
        <Text color="yellow">
          Package editor form would go here (simplified for now)
        </Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          Monorepo Manager
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="gray">
          View: [1] All [2] Apps [3] Packages | Arrow keys to navigate, Enter to
          edit, 'a'/'p' to add, 'd' to delete, ESC to exit
        </Text>
      </Box>
      <Box flexDirection="column">
        {packages.length === 0 ? (
          <Text color="yellow">
            No packages yet. Press 'a' to add an app or 'p' to add a package.
          </Text>
        ) : (
          packages.map((pkg) => {
            const isFocused = pkg.id === focused
            return (
              <Box key={pkg.id}>
                <Text color={isFocused ? 'cyan' : 'white'}>
                  {isFocused ? '> ' : '  '}[{pkg.type}] {pkg.name} (
                  {pkg.dependencies.length} dependencies)
                </Text>
              </Box>
            )
          })
        )}
      </Box>
      {selectedPackage && (
        <Box marginTop={1} flexDirection="column">
          <Text color="gray">Dependencies:</Text>
          {selectedPackage.dependencies.length === 0 ? (
            <Text color="yellow">No dependencies</Text>
          ) : (
            selectedPackage.dependencies.map((dep) => (
              <Text key={dep}> - {dep}</Text>
            ))
          )}
        </Box>
      )}
    </Box>
  )
}

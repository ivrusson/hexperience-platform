import { Box, Text } from 'ink'
import { useFocus } from '../hooks/useFocus.js'
import { useKeyboard } from '../hooks/useKeyboard.js'

export interface NavigationItem {
  id: string
  label: string
  action?: () => void
}

export interface NavigationProps {
  items: NavigationItem[]
  onSelect?: (item: NavigationItem) => void
  onEscape?: () => void
}

export function Navigation({ items, onSelect, onEscape }: NavigationProps) {
  const { focused, focusNext, focusPrevious } = useFocus({
    items: items.map((item) => item.id),
  })

  useKeyboard({
    onArrowUp: focusPrevious,
    onArrowDown: focusNext,
    onEnter: () => {
      if (focused) {
        const item = items.find((i) => i.id === focused)
        if (item) {
          item.action?.()
          onSelect?.(item)
        }
      }
    },
    onEscape,
  })

  return (
    <Box flexDirection="column">
      {items.map((item) => {
        const isFocused = item.id === focused
        return (
          <Box key={item.id}>
            <Text color={isFocused ? 'cyan' : 'white'}>
              {isFocused ? '> ' : '  '}
              {item.label}
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}

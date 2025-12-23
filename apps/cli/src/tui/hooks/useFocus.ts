import { useCallback, useState } from 'react'

export interface UseFocusOptions<T = string> {
  initialFocus?: T
  items: T[]
  onFocusChange?: (focused: T) => void
}

export function useFocus<T = string>(options: UseFocusOptions<T>) {
  const { initialFocus, items, onFocusChange } = options
  const [focused, setFocused] = useState<T | undefined>(
    initialFocus ?? (items.length > 0 ? items[0] : undefined)
  )

  const setFocus = useCallback(
    (item: T) => {
      setFocused(item)
      onFocusChange?.(item)
    },
    [onFocusChange]
  )

  const focusNext = useCallback(() => {
    if (!focused || items.length === 0) {
      return
    }
    const currentIndex = items.indexOf(focused)
    if (currentIndex >= 0 && currentIndex < items.length - 1) {
      const next = items[currentIndex + 1]
      setFocus(next)
    }
  }, [focused, items, setFocus])

  const focusPrevious = useCallback(() => {
    if (!focused || items.length === 0) {
      return
    }
    const currentIndex = items.indexOf(focused)
    if (currentIndex > 0) {
      const previous = items[currentIndex - 1]
      setFocus(previous)
    }
  }, [focused, items, setFocus])

  return {
    focused,
    setFocus,
    focusNext,
    focusPrevious,
  }
}

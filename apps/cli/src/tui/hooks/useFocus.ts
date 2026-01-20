import { useCallback, useEffect, useState } from 'react'

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

  // Update focus when items change
  useEffect(() => {
    if (items.length > 0) {
      // If current focus is not in items, reset to first item
      if (!focused || !items.includes(focused)) {
        const newFocus =
          initialFocus && items.includes(initialFocus) ? initialFocus : items[0]
        setFocused(newFocus)
        onFocusChange?.(newFocus)
      }
    } else {
      setFocused(undefined)
    }
  }, [items, initialFocus, onFocusChange, focused])

  const setFocus = useCallback(
    (item: T) => {
      if (items.includes(item)) {
        setFocused(item)
        onFocusChange?.(item)
      }
    },
    [onFocusChange, items]
  )

  const focusNext = useCallback(() => {
    if (items.length === 0) {
      return
    }
    if (!focused) {
      // If nothing is focused, focus first item
      const first = items[0]
      setFocus(first)
      return
    }
    const currentIndex = items.indexOf(focused)
    if (currentIndex >= 0 && currentIndex < items.length - 1) {
      const next = items[currentIndex + 1]
      setFocus(next)
    }
  }, [focused, items, setFocus])

  const focusPrevious = useCallback(() => {
    if (items.length === 0) {
      return
    }
    if (!focused) {
      // If nothing is focused, focus last item
      const last = items[items.length - 1]
      setFocus(last)
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

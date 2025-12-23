import { useInput } from 'ink'
import { useCallback, useEffect, useRef } from 'react'

export type KeyboardHandler = (
  key: string,
  input: { ctrl: boolean; shift: boolean; meta: boolean }
) => void

export interface UseKeyboardOptions {
  onKeyPress?: KeyboardHandler
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: () => void
  onCtrlS?: () => void
  enabled?: boolean
}

export function useKeyboard(options: UseKeyboardOptions = {}): void {
  const {
    onKeyPress,
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onCtrlS,
    enabled = true,
  } = options

  const handlersRef = useRef(options)
  useEffect(() => {
    handlersRef.current = options
  })

  useInput(
    useCallback(
      (input, key) => {
        if (!enabled) {
          return
        }

        const handlers = handlersRef.current

        // Handle special keys
        if (key.escape) {
          handlers.onEscape?.()
          return
        }

        if (key.return) {
          handlers.onEnter?.()
          return
        }

        if (key.upArrow) {
          handlers.onArrowUp?.()
          return
        }

        if (key.downArrow) {
          handlers.onArrowDown?.()
          return
        }

        if (key.leftArrow) {
          handlers.onArrowLeft?.()
          return
        }

        if (key.rightArrow) {
          handlers.onArrowRight?.()
          return
        }

        if (key.tab) {
          handlers.onTab?.()
          return
        }

        // Handle Ctrl+S
        if (input === 's' && key.ctrl) {
          handlers.onCtrlS?.()
          return
        }

        // Generic key press handler
        if (input && handlers.onKeyPress) {
          handlers.onKeyPress(input, {
            ctrl: key.ctrl || false,
            shift: key.shift || false,
            meta: key.meta || false,
          })
        }
      },
      [enabled]
    ),
    { isActive: enabled }
  )
}

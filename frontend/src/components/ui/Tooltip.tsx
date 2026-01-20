import { ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  position?: TooltipPosition
  className?: string
}

const ARROW_CLASSES: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent',
}

const TOOLTIP_OFFSET = 8

export function Tooltip({
  children,
  content,
  position = 'top',
  className,
}: TooltipProps): JSX.Element {
  const tooltipId = useId()
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)
  const [coords, setCoords] = useState({ top: -9999, left: -9999 })
  const hoverTimeoutRef = useRef<number | null>(null)

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()

    let top = 0
    let left = 0

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - TOOLTIP_OFFSET
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        break
      case 'bottom':
        top = triggerRect.bottom + TOOLTIP_OFFSET
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        break
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        left = triggerRect.left - tooltipRect.width - TOOLTIP_OFFSET
        break
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        left = triggerRect.right + TOOLTIP_OFFSET
        break
    }

    // Keep tooltip within viewport
    const padding = 8
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))

    setCoords({ top, left })
    setIsPositioned(true)
  }, [position])

  useLayoutEffect(() => {
    if (isVisible) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        calculatePosition()
      })
    } else {
      setIsPositioned(false)
    }
  }, [isVisible, calculatePosition])

  const handleMouseEnter = useCallback(() => {
    // Clear any pending hide timeout
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setIsVisible(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    // Small delay to prevent flickering when moving between trigger and tooltip
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false)
    }, 50)
  }, [])

  const handleFocus = useCallback(() => setIsVisible(true), [])
  const handleBlur = useCallback(() => setIsVisible(false), [])

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Stop event propagation to prevent card hover/click interference
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  return (
    <>
      <span
        ref={triggerRef}
        className={clsx('inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={stopPropagation}
      >
        <span
          aria-describedby={tooltipId}
          className="cursor-help"
          tabIndex={0}
        >
          {children}
        </span>
      </span>
      {createPortal(
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          aria-hidden={!isVisible}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
          }}
          className={clsx(
            'z-[9999] pointer-events-auto',
            'transition-opacity duration-150 ease-out',
            isVisible && isPositioned
              ? 'opacity-100 visible'
              : 'opacity-0 invisible pointer-events-none'
          )}
        >
          <div className="relative bg-gray-900 text-white text-sm rounded-xl px-4 py-3 w-64 shadow-xl">
            {content}
            {/* Arrow */}
            <div
              className={clsx(
                'absolute w-0 h-0 border-[6px]',
                ARROW_CLASSES[position]
              )}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

import { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

import { Tooltip } from './Tooltip'
import { getTermDefinition } from '@/constants/termDefinitions'

interface TermTooltipProps {
  term: string
  children: ReactNode
  showIcon?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function TermTooltip({
  term,
  children,
  showIcon = false,
  position = 'top',
}: TermTooltipProps): JSX.Element {
  const definition = getTermDefinition(term)

  if (!definition) {
    return <>{children}</>
  }

  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-semibold text-white text-base leading-tight">
        {definition.label}
      </div>
      <div className="text-gray-200 leading-relaxed">
        {definition.brief}
      </div>
      {definition.detail && (
        <div className="text-gray-400 text-xs leading-relaxed pt-2 mt-2 border-t border-gray-700">
          {definition.detail}
        </div>
      )}
    </div>
  )

  return (
    <Tooltip content={tooltipContent} position={position}>
      <span className="inline-flex items-center gap-1">
        {children}
        {showIcon && (
          <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
        )}
      </span>
    </Tooltip>
  )
}

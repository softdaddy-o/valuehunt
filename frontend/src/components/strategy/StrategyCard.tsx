/**
 * StrategyCard Component
 * Displays a single strategy option
 */

import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StrategyType } from '@/services/ai/types'
import { LEVEL_COLORS, LevelType } from '@/utils/styles'

interface StrategyCardProps {
  strategyType: StrategyType
  title: string
  description: string
  icon: string
  complexity: LevelType
  enabled: boolean
}

const COMPLEXITY_LABELS: Record<LevelType, string> = {
  low: '초급',
  medium: '중급',
  high: '고급',
}

export function StrategyCard({
  strategyType,
  title,
  description,
  icon,
  complexity,
  enabled,
}: StrategyCardProps): JSX.Element {
  const navigate = useNavigate()

  function handleClick(): void {
    if (enabled) {
      navigate(`/strategies/${strategyType}`)
    }
  }

  const cardClassName = enabled
    ? 'p-6 cursor-pointer hover:shadow-lg transition-shadow'
    : 'p-6 opacity-50 cursor-not-allowed'

  return (
    <Card className={cardClassName}>
      <div className="flex flex-col h-full">
        {/* Icon and Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl">{icon}</div>
          <span className={`px-2 py-1 text-xs font-medium rounded ${LEVEL_COLORS[complexity]}`}>
            {COMPLEXITY_LABELS[complexity]}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
          {description}
        </p>

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={!enabled}
          className="w-full"
        >
          {enabled ? '분석 시작' : '준비 중'}
        </Button>
      </div>
    </Card>
  )
}

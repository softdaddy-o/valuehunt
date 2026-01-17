/**
 * RecommendationCard Component
 * Displays a single stock recommendation from strategy
 */

import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StockRecommendation } from '@/services/ai/types'
import { LEVEL_COLORS, LevelType } from '@/utils/styles'

interface RecommendationCardProps {
  recommendation: StockRecommendation
}

const RISK_LEVEL_LABELS: Record<LevelType, string> = {
  low: '낮음',
  medium: '중간',
  high: '높음',
}

interface MetricItemProps {
  label: string
  value: number | null | undefined
  suffix?: string
  decimals?: number
}

function MetricItem({ label, value, suffix = '', decimals = 1 }: MetricItemProps): JSX.Element | null {
  if (value === null || value === undefined) {
    return null
  }

  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {value.toFixed(decimals)}{suffix}
      </p>
    </div>
  )
}

export function RecommendationCard({ recommendation }: RecommendationCardProps): JSX.Element {
  const navigate = useNavigate()
  const { metrics, riskLevel, stockCode, stockName, market, sector, upsidePotential, rationale, confidenceScore } = recommendation

  function handleViewDetail(): void {
    navigate(`/stock/${stockCode}`)
  }

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {stockName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {stockCode} · {market}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-1 text-xs font-medium rounded ${LEVEL_COLORS[riskLevel]}`}>
            리스크: {RISK_LEVEL_LABELS[riskLevel]}
          </span>
          {confidenceScore && (
            <span className="text-xs text-gray-500">
              신뢰도: {confidenceScore}%
            </span>
          )}
        </div>
      </div>

      {/* Sector and Upside */}
      <div className="mb-3">
        {sector && (
          <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded mr-2">
            {sector}
          </span>
        )}
        {upsidePotential && (
          <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded font-semibold">
            상승여력: {upsidePotential}
          </span>
        )}
      </div>

      {/* Rationale */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
        {rationale}
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <MetricItem label="PER" value={metrics.PER} />
        <MetricItem label="PBR" value={metrics.PBR} />
        <MetricItem label="ROE" value={metrics.ROE} suffix="%" />
        <MetricItem label="부채비율" value={metrics.debtRatio} suffix="%" decimals={0} />
        <MetricItem label="배당수익률" value={metrics.dividendYield} suffix="%" />
        <MetricItem label="이익성장률" value={metrics.profitGrowth} suffix="%" />
      </div>

      {/* Action Button */}
      <Button variant="outline" size="sm" onClick={handleViewDetail} className="w-full">
        자세히 보기
      </Button>
    </Card>
  )
}

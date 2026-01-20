import { TopPickItem } from '@/types/api'
import { Card } from '@/components/ui/Card'
import { useNavigate } from 'react-router-dom'

interface StockCardProps {
  stock: TopPickItem
}

// Helper to safely convert string or number to number with validation
function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function StockCard({ stock }: StockCardProps): JSX.Element {
  const navigate = useNavigate()

  // Pre-compute numeric values to avoid repeated conversions
  const changeRate = toNumber(stock.change_rate)
  const valueScore = toNumber(stock.value_score)

  function handleClick(): void {
    navigate(`/stocks/${stock.stock_code}`)
  }

  function getPriceColor(rate: number | null): string {
    if (rate === null || rate === 0) return 'text-gray-600'
    return rate >= 0 ? 'text-red-500' : 'text-blue-500'
  }

  function getScoreColor(score: number | null): string {
    if (score === null) return 'bg-gray-100 text-gray-800'
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-blue-100 text-blue-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <Card hover padding="md" className="cursor-pointer" onClick={handleClick}>
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-400">
                #{stock.rank}
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {stock.stock_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {stock.stock_code} · {stock.market}
                </p>
              </div>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(valueScore)}`}
          >
            {valueScore !== null ? valueScore.toFixed(1) : 'N/A'}
          </div>
        </div>

        {/* Price Info */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {stock.current_price?.toLocaleString()}
            <span className="text-sm font-normal text-gray-500">원</span>
          </span>
          {changeRate !== null && (
            <span className={`text-sm font-medium ${getPriceColor(changeRate)}`}>
              {changeRate >= 0 ? '+' : ''}
              {changeRate.toFixed(2)}%
            </span>
          )}
          {stock.upside_potential && (
            <span className="text-sm font-medium text-green-600">
              ({stock.upside_potential})
            </span>
          )}
        </div>

        {/* Category Scores */}
        <div className="grid grid-cols-4 gap-2">
          <ScoreBadge
            label="밸류"
            score={stock.category_scores.valuation}
          />
          <ScoreBadge
            label="수익성"
            score={stock.category_scores.profitability}
          />
          <ScoreBadge
            label="안정성"
            score={stock.category_scores.stability}
          />
          <ScoreBadge
            label="배당"
            score={stock.category_scores.dividend}
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <MetricItem label="PER" value={stock.key_metrics.PER} />
          <MetricItem label="PBR" value={stock.key_metrics.PBR} />
          <MetricItem label="ROE" value={stock.key_metrics.ROE} suffix="%" />
        </div>

        {/* AI Summary */}
        {stock.ai_summary && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {stock.ai_summary}
          </p>
        )}
      </div>
    </Card>
  )
}

interface ScoreBadgeProps {
  label: string
  score: number | string
}

function ScoreBadge({ label, score }: ScoreBadgeProps): JSX.Element {
  const numScore = toNumber(score)
  return (
    <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-bold text-gray-900">
        {numScore !== null ? numScore.toFixed(0) : 'N/A'}
      </span>
    </div>
  )
}

interface MetricItemProps {
  label: string
  value: number | string | null
  suffix?: string
}

function MetricItem({ label, value, suffix = '' }: MetricItemProps): JSX.Element {
  const numValue = toNumber(value)
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">
        {numValue !== null ? `${numValue.toFixed(2)}${suffix}` : 'N/A'}
      </span>
    </div>
  )
}

import { TopPickItem } from '@/types/api'
import { Card } from '@/components/ui/Card'
import { useNavigate } from 'react-router-dom'

interface StockCardProps {
  stock: TopPickItem
}

export function StockCard({ stock }: StockCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/stocks/${stock.stock_code}`)
  }

  const getPriceColor = (changeRate: number | null) => {
    if (!changeRate) return 'text-gray-600'
    return changeRate >= 0 ? 'text-red-500' : 'text-blue-500'
  }

  const getScoreColor = (score: number) => {
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
            className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(
              stock.value_score
            )}`}
          >
            {stock.value_score.toFixed(1)}
          </div>
        </div>

        {/* Price Info */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {stock.current_price?.toLocaleString()}
            <span className="text-sm font-normal text-gray-500">원</span>
          </span>
          {stock.change_rate !== null && (
            <span
              className={`text-sm font-medium ${getPriceColor(
                stock.change_rate
              )}`}
            >
              {stock.change_rate >= 0 ? '+' : ''}
              {stock.change_rate.toFixed(2)}%
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

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-bold text-gray-900">{score.toFixed(0)}</span>
    </div>
  )
}

function MetricItem({
  label,
  value,
  suffix = '',
}: {
  label: string
  value: number | null
  suffix?: string
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">
        {value !== null ? `${value.toFixed(2)}${suffix}` : 'N/A'}
      </span>
    </div>
  )
}

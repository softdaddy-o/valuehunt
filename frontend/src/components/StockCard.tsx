import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, Sparkles } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import { TermTooltip } from '@/components/ui/TermTooltip'
import { TopPickItem } from '@/types/api'
import { formatPrice } from '@/utils/styles'

interface StockCardProps {
  stock: TopPickItem
}

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

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer"
    >
      <Card
        hover
        padding="none"
        className="overflow-hidden group transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-primary-500"
      >
      <div className="p-4 flex flex-col gap-3">
        {/* Enhanced Header */}
        <div className="flex items-start justify-between gap-3">
          {/* Rank Badge */}
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold rounded-lg shadow-sm">
            {stock.rank}
          </div>

          {/* Stock Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {stock.stock_name}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{stock.stock_code}</span>
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                {stock.market}
              </span>
            </div>
          </div>

          {/* Value Score Badge */}
          <ValueScoreBadge score={valueScore} className="hidden sm:flex" size="lg" />
          <ValueScoreBadge score={valueScore} className="sm:hidden" size="md" />
        </div>

        {/* Price Section */}
        <div className="flex items-end justify-between py-3 border-b border-gray-100">
          <div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatPrice(stock.current_price)}
            </span>
            <span className="text-sm text-gray-500 ml-1">원</span>
          </div>

          <div className="flex items-center gap-2">
            {changeRate !== null && (
              <ChangeRateBadge changeRate={changeRate} />
            )}

            {/* Upside Potential */}
            {stock.upside_potential && (
              <div className="flex items-center gap-1 text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm font-medium">{stock.upside_potential}</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Scores with Progress Bars */}
        <div className="py-3 space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            카테고리 점수
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CategoryScoreBar label="밸류" term="밸류" score={stock.category_scores.valuation} max={40} />
            <CategoryScoreBar label="수익성" term="수익성" score={stock.category_scores.profitability} max={30} />
            <CategoryScoreBar label="안정성" term="안정성" score={stock.category_scores.stability} max={20} />
            <CategoryScoreBar label="배당" term="배당" score={stock.category_scores.dividend} max={10} />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100">
          <MetricPill label="PER" term="PER" value={stock.key_metrics.PER} />
          <MetricPill label="PBR" term="PBR" value={stock.key_metrics.PBR} />
          <MetricPill label="ROE" term="ROE" value={stock.key_metrics.ROE} suffix="%" />
        </div>

        {/* AI Summary */}
        {stock.ai_summary && (
          <div className="relative pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-medium text-primary-600">AI 분석</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {stock.ai_summary}
            </p>
          </div>
        )}
      </div>
    </Card>
    </div>
  )
}

interface ChangeRateBadgeProps {
  changeRate: number
}

function ChangeRateBadge({ changeRate }: ChangeRateBadgeProps): JSX.Element {
  const isPositive = changeRate >= 0
  const TrendIcon = changeRate > 0 ? TrendingUp : changeRate < 0 ? TrendingDown : Minus

  return (
    <div
      className={clsx(
        'flex items-center gap-1 px-2 py-1 rounded-lg',
        isPositive ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
      )}
    >
      <TrendIcon className="w-4 h-4" />
      <span className="font-semibold text-sm">
        {isPositive && '+'}
        {changeRate.toFixed(2)}%
      </span>
    </div>
  )
}

interface ValueScoreBadgeProps {
  score: number | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'w-12 h-12 text-sm',
  md: 'w-14 h-14 text-base',
  lg: 'w-16 h-16 text-lg',
} as const

function getScoreGradient(score: number | null): string {
  if (score === null) return 'from-gray-100 to-gray-200 text-gray-600'
  if (score >= 80) return 'from-emerald-400 to-green-500 text-white shadow-green-200'
  if (score >= 60) return 'from-sky-400 to-blue-500 text-white shadow-blue-200'
  if (score >= 40) return 'from-amber-400 to-yellow-500 text-gray-800 shadow-yellow-200'
  return 'from-gray-300 to-gray-400 text-gray-700'
}

function ValueScoreBadge({ score, size = 'md', className }: ValueScoreBadgeProps): JSX.Element {
  const isHighScore = score !== null && score >= 80

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
        getScoreGradient(score),
        SIZE_CLASSES[size],
        isHighScore && 'animate-pulse-subtle',
        className
      )}
    >
      <span className="font-bold leading-none">
        {score !== null ? score.toFixed(0) : 'N/A'}
      </span>
      {score !== null && <span className="text-xs opacity-80">점</span>}
    </div>
  )
}

interface CategoryScoreBarProps {
  label: string
  term: string
  score: number | string
  max: number
}

function getProgressBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-emerald-500'
  if (percentage >= 60) return 'bg-sky-500'
  if (percentage >= 40) return 'bg-amber-500'
  return 'bg-gray-400'
}

function CategoryScoreBar({ label, term, score, max }: CategoryScoreBarProps): JSX.Element {
  const numScore = toNumber(score)
  const percentage = numScore !== null ? (numScore / max) * 100 : 0

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <TermTooltip term={term} position="top">
          <span className="text-gray-600 border-b border-dotted border-gray-400">{label}</span>
        </TermTooltip>
        <span className="font-semibold text-gray-900">
          {numScore !== null ? numScore.toFixed(0) : 'N/A'}/{max}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500 ease-out',
            getProgressBarColor(percentage)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface MetricItemProps {
  label: string
  term: string
  value: number | string | null
  suffix?: string
}

function MetricPill({ label, term, value, suffix = '' }: MetricItemProps): JSX.Element {
  const numValue = toNumber(value)
  return (
    <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <TermTooltip term={term} position="top">
        <span className="text-xs text-gray-500 mb-0.5 border-b border-dotted border-gray-400">{label}</span>
      </TermTooltip>
      <span className="font-bold text-gray-900 text-sm">
        {numValue !== null ? `${numValue.toFixed(2)}${suffix}` : 'N/A'}
      </span>
    </div>
  )
}

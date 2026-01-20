import { useState, useEffect } from 'react'
import { TrendingUp, Clock, ListFilter } from 'lucide-react'

import { stocksApi, TopPicksResponse } from '@/api'
import { StockCard } from '@/components/StockCard'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

type MarketFilter = 'ALL' | 'KOSPI' | 'KOSDAQ'

const MARKET_OPTIONS: MarketFilter[] = ['ALL', 'KOSPI', 'KOSDAQ']
const LIMIT_OPTIONS = [10, 20, 30, 50] as const

function getMarketLabel(market: MarketFilter): string {
  return market === 'ALL' ? '전체' : market
}

export function Home(): JSX.Element {
  const [topPicks, setTopPicks] = useState<TopPicksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [market, setMarket] = useState<MarketFilter>('ALL')
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    async function fetchTopPicks(): Promise<void> {
      try {
        setLoading(true)
        setError(null)
        const data = await stocksApi.getTopPicks({ market, limit })
        setTopPicks(data)
      } catch (err) {
        setError('Top Picks를 불러오는데 실패했습니다.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTopPicks()
  }, [market, limit])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8" />
            <h1 className="text-3xl font-bold">AI 저평가 우량주 Top Picks</h1>
          </div>
          <p className="text-primary-100 text-lg">
            AI가 분석한 저평가 우량 종목을 확인하세요
          </p>
        </div>
      </div>

      {/* Enhanced Filters - Sticky */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
            <MarketFilterTabs currentMarket={market} onMarketChange={setMarket} />

            {/* Controls */}
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
              <LimitSelector value={limit} onChange={setLimit} />

              {/* Last Updated */}
              {topPicks && (
                <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(topPicks.updated_at).toLocaleString('ko-KR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Last Updated */}
          {topPicks && (
            <div className="flex sm:hidden items-center justify-center gap-1.5 text-xs text-gray-500 mt-2">
              <Clock className="w-3.5 h-3.5" />
              <span>마지막 업데이트: {new Date(topPicks.updated_at).toLocaleString('ko-KR')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
        {/* Skeleton Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: limit > 12 ? 12 : limit }).map((_, idx) => (
              <StockCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Data Grid */}
        {!loading && !error && topPicks && (
          <>
            {topPicks.data.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                조건에 맞는 종목이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {topPicks.data.map((stock) => (
                  <div key={stock.stock_code} className="card-animate" style={{ opacity: 0 }}>
                    <StockCard stock={stock} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface MarketFilterTabsProps {
  currentMarket: MarketFilter
  onMarketChange: (market: MarketFilter) => void
}

function MarketFilterTabs({ currentMarket, onMarketChange }: MarketFilterTabsProps): JSX.Element {
  return (
    <div className="flex p-1 bg-gray-100 rounded-lg w-full sm:w-auto">
      {MARKET_OPTIONS.map((m) => {
        const isActive = currentMarket === m
        return (
          <button
            key={m}
            onClick={() => onMarketChange(m)}
            className={
              isActive
                ? 'flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all bg-white text-primary-600 shadow-sm'
                : 'flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all text-gray-600 hover:text-gray-900'
            }
          >
            {getMarketLabel(m)}
          </button>
        )
      })}
    </div>
  )
}

interface LimitSelectorProps {
  value: number
  onChange: (value: number) => void
}

function LimitSelector({ value, onChange }: LimitSelectorProps): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <ListFilter className="w-4 h-4 text-gray-500" />
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
      >
        {LIMIT_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}개
          </option>
        ))}
      </select>
    </div>
  )
}

function StockCardSkeleton(): JSX.Element {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="w-16 h-16 rounded-xl" />
        </div>

        <div className="flex justify-between items-end py-3 border-b border-gray-100">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>

        <div className="space-y-2 pt-3 border-t border-gray-100">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </Card>
  )
}

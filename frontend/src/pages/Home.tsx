import { useState, useEffect } from 'react'
import { stocksApi, TopPicksResponse } from '@/api'
import { StockCard } from '@/components/StockCard'
import { Button } from '@/components/ui/Button'

export function Home() {
  const [topPicks, setTopPicks] = useState<TopPicksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [market, setMarket] = useState<'ALL' | 'KOSPI' | 'KOSDAQ'>('ALL')
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    const fetchTopPicks = async () => {
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI 저평가 우량주 Top Picks
          </h1>
          <p className="mt-2 text-gray-600">
            AI가 분석한 저평가 우량 종목을 확인하세요
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <Button
              variant={market === 'ALL' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setMarket('ALL')}
            >
              전체
            </Button>
            <Button
              variant={market === 'KOSPI' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setMarket('KOSPI')}
            >
              KOSPI
            </Button>
            <Button
              variant={market === 'KOSDAQ' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setMarket('KOSDAQ')}
            >
              KOSDAQ
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">표시 개수:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={30}>30개</option>
              <option value={50}>50개</option>
            </select>
          </div>

          {topPicks && (
            <span className="ml-auto text-sm text-gray-500">
              마지막 업데이트: {new Date(topPicks.updated_at).toLocaleString('ko-KR')}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && topPicks && (
          <>
            {topPicks.data.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                조건에 맞는 종목이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topPicks.data.map((stock) => (
                  <StockCard key={stock.stock_code} stock={stock} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

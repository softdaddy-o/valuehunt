import { useState } from 'react'
import { screenerApi, ScreenerResponse, ScreenerFilters } from '@/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useNavigate } from 'react-router-dom'
import { formatPrice } from '@/utils/styles'

export function Screener() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ScreenerFilters>({})
  const [results, setResults] = useState<ScreenerResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScreen = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await screenerApi.screenStocks({
        filters,
        sort_by: 'value_score',
        order: 'desc',
        limit: 50,
      })
      setResults(data)
    } catch (err) {
      setError('스크리닝 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFilters({})
    setResults(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">커스텀 스크리너</h1>
          <p className="mt-2 text-gray-600">
            원하는 조건으로 종목을 검색하세요
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Panel */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4">필터 조건</h2>

              <div className="space-y-4">
                {/* Market */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시장
                  </label>
                  <div className="space-y-2">
                    {['KOSPI', 'KOSDAQ'].map((market) => (
                      <label key={market} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.market?.includes(market) || false}
                          onChange={(e) => {
                            const currentMarkets = filters.market || []
                            if (e.target.checked) {
                              setFilters({
                                ...filters,
                                market: [...currentMarkets, market],
                              })
                            } else {
                              setFilters({
                                ...filters,
                                market: currentMarkets.filter((m) => m !== market),
                              })
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{market}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* PER */}
                <Input
                  label="PER 최대"
                  type="number"
                  placeholder="예: 10"
                  value={filters.PER_max || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      PER_max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  fullWidth
                />

                {/* PBR */}
                <Input
                  label="PBR 최대"
                  type="number"
                  placeholder="예: 1.0"
                  step="0.1"
                  value={filters.PBR_max || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      PBR_max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  fullWidth
                />

                {/* ROE */}
                <Input
                  label="ROE 최소 (%)"
                  type="number"
                  placeholder="예: 12"
                  value={filters.ROE_min || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      ROE_min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  fullWidth
                />

                {/* Debt Ratio */}
                <Input
                  label="부채비율 최대 (%)"
                  type="number"
                  placeholder="예: 50"
                  value={filters.debt_ratio_max || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      debt_ratio_max: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  fullWidth
                />

                {/* Dividend Yield */}
                <Input
                  label="배당수익률 최소 (%)"
                  type="number"
                  placeholder="예: 2"
                  step="0.1"
                  value={filters.dividend_yield_min || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      dividend_yield_min: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  fullWidth
                />

                {/* Market Cap */}
                <Input
                  label="시가총액 최소 (억원)"
                  type="number"
                  placeholder="예: 1000"
                  value={
                    filters.market_cap_min
                      ? filters.market_cap_min / 100000000
                      : ''
                  }
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      market_cap_min: e.target.value
                        ? Number(e.target.value) * 100000000
                        : undefined,
                    })
                  }
                  fullWidth
                />

                <Input
                  label="시가총액 최대 (억원)"
                  type="number"
                  placeholder="예: 50000"
                  value={
                    filters.market_cap_max
                      ? filters.market_cap_max / 100000000
                      : ''
                  }
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      market_cap_max: e.target.value
                        ? Number(e.target.value) * 100000000
                        : undefined,
                    })
                  }
                  fullWidth
                />

                {/* Buttons */}
                <div className="space-y-2 pt-4">
                  <Button
                    fullWidth
                    onClick={handleScreen}
                    disabled={loading}
                  >
                    {loading ? '검색 중...' : '검색'}
                  </Button>
                  <Button
                    fullWidth
                    variant="outline"
                    onClick={handleReset}
                  >
                    초기화
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
                {error}
              </div>
            )}

            {results && (
              <Card>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    검색 결과: {results.total_count}개
                  </h2>
                </div>

                {results.results.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    조건에 맞는 종목이 없습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            종목명
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            현재가
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PER
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PBR
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ROE
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.results.map((stock) => (
                          <tr
                            key={stock.stock_code}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/stocks/${stock.stock_code}`)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {stock.stock_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {stock.stock_code}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatPrice(stock.current_price)}원
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {stock.value_score.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stock.PER?.toFixed(2) || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stock.PBR?.toFixed(2) || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stock.ROE?.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {!results && !error && (
              <Card>
                <div className="text-center py-12 text-gray-500">
                  조건을 설정하고 검색 버튼을 눌러주세요.
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

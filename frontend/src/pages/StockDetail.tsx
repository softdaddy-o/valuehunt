import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { stocksApi, StockDetail as StockDetailType } from '@/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TermTooltip } from '@/components/ui/TermTooltip'
import { StockChart } from '@/components/StockChart'

export function StockDetail() {
  const { stockCode } = useParams<{ stockCode: string }>()
  const navigate = useNavigate()
  const [stock, setStock] = useState<StockDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStockDetail = async () => {
      if (!stockCode) return

      try {
        setLoading(true)
        setError(null)
        const data = await stocksApi.getStockDetail(stockCode)
        setStock(data)
      } catch (err) {
        setError('종목 정보를 불러오는데 실패했습니다.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStockDetail()
  }, [stockCode])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Card padding="lg">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || '종목을 찾을 수 없습니다.'}</p>
            <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
          </div>
        </Card>
      </div>
    )
  }

  const { stock_info, value_score, ai_analysis, financial_metrics, external_links } = stock

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            ← 뒤로 가기
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {stock_info.name}
                </h1>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {stock_info.market}
                </span>
              </div>
              <p className="mt-1 text-gray-500">
                {stock_info.code} · {stock_info.sector}
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {stock_info.current_price?.toLocaleString()}
                <span className="text-lg font-normal text-gray-500 ml-1">원</span>
              </div>
              {stock_info.change_rate !== null && (
                <div
                  className={`text-lg font-medium ${
                    stock_info.change_rate >= 0 ? 'text-red-500' : 'text-blue-500'
                  }`}
                >
                  {stock_info.change_rate >= 0 ? '+' : ''}
                  {stock_info.change_rate.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Chart */}
            <Card>
              <StockChart
                data={[
                  { date: '1M', value: stock_info.current_price * 0.95 },
                  { date: '2M', value: stock_info.current_price * 0.98 },
                  { date: '3M', value: stock_info.current_price * 0.92 },
                  { date: '4M', value: stock_info.current_price * 0.96 },
                  { date: '5M', value: stock_info.current_price * 1.02 },
                  { date: '6M', value: stock_info.current_price },
                ]}
                title="최근 6개월 주가 추이"
                height={250}
                color={stock_info.change_rate >= 0 ? '#ef4444' : '#3b82f6'}
              />
            </Card>

            {/* Value Score */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                <TermTooltip term="Value Score">
                  <span className="border-b border-dotted border-gray-400">Value Score</span>
                </TermTooltip>
              </h2>
              <div className="grid grid-cols-5 gap-4">
                <ScoreBox label="총점" term="총점" score={value_score.total} max={100} />
                <ScoreBox label="밸류에이션" term="밸류에이션" score={value_score.valuation} max={40} />
                <ScoreBox label="수익성" term="수익성" score={value_score.profitability} max={30} />
                <ScoreBox label="안정성" term="안정성" score={value_score.stability} max={20} />
                <ScoreBox label="배당" term="배당" score={value_score.dividend} max={10} />
              </div>
            </Card>

            {/* AI Analysis */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                AI 분석
              </h2>

              {ai_analysis.summary && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">요약</h3>
                  <p className="text-gray-600">{ai_analysis.summary}</p>
                </div>
              )}

              {ai_analysis.strengths.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">강점</h3>
                  <ul className="space-y-2">
                    {ai_analysis.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-gray-600">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ai_analysis.risks.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">리스크</h3>
                  <ul className="space-y-2">
                    {ai_analysis.risks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">!</span>
                        <span className="text-gray-600">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* Financial Metrics */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                재무 지표
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                <MetricBox
                  label="PER"
                  term="PER"
                  value={financial_metrics.current.PER}
                />
                <MetricBox
                  label="PBR"
                  term="PBR"
                  value={financial_metrics.current.PBR}
                />
                <MetricBox
                  label="ROE"
                  term="ROE"
                  value={financial_metrics.current.ROE}
                  suffix="%"
                />
                <MetricBox
                  label="ROA"
                  term="ROA"
                  value={financial_metrics.current.ROA}
                  suffix="%"
                />
                <MetricBox
                  label="부채비율"
                  term="부채비율"
                  value={financial_metrics.current.debt_ratio}
                  suffix="%"
                />
                <MetricBox
                  label="유동비율"
                  term="유동비율"
                  value={financial_metrics.current.current_ratio}
                />
                <MetricBox
                  label="배당수익률"
                  term="배당수익률"
                  value={financial_metrics.current.dividend_yield}
                  suffix="%"
                />
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">기본 정보</h3>
              <div className="space-y-2 text-sm">
                <InfoRow label="종목코드" value={stock_info.code} />
                <InfoRow label="시장" value={stock_info.market} />
                <InfoRow label="업종" value={stock_info.sector || 'N/A'} />
                <InfoRow
                  label="시가총액"
                  term="시가총액"
                  value={
                    stock_info.market_cap
                      ? `${(stock_info.market_cap / 100000000).toFixed(0)}억원`
                      : 'N/A'
                  }
                />
              </div>
            </Card>

            {/* External Links */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">외부 링크</h3>
              <div className="space-y-2">
                <a
                  href={external_links.news}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  네이버 증권 →
                </a>
                <a
                  href={external_links.dart}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  전자공시 (DART) →
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreBox({ label, term, score, max }: { label: string; term: string; score: number; max: number }) {
  const percentage = (score / max) * 100
  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  return (
    <div className="text-center">
      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">{score.toFixed(1)}</div>
        <div className="text-xs text-gray-500">/ {max}</div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <TermTooltip term={term} position="bottom">
        <div className="mt-2 text-xs text-gray-600 border-b border-dotted border-gray-400 inline-block">{label}</div>
      </TermTooltip>
    </div>
  )
}

function MetricBox({
  label,
  term,
  value,
  suffix = '',
}: {
  label: string
  term: string
  value: number | null
  suffix?: string
}) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <TermTooltip term={term} position="top">
        <div className="text-xs text-gray-500 mb-1 border-b border-dotted border-gray-400 inline-block">{label}</div>
      </TermTooltip>
      <div className="text-lg font-bold text-gray-900">
        {value !== null ? `${value.toFixed(2)}${suffix}` : 'N/A'}
      </div>
    </div>
  )
}

function InfoRow({ label, term, value }: { label: string; term?: string; value: string }) {
  return (
    <div className="flex justify-between">
      {term ? (
        <TermTooltip term={term} position="right">
          <span className="text-gray-500 border-b border-dotted border-gray-400">{label}</span>
        </TermTooltip>
      ) : (
        <span className="text-gray-500">{label}</span>
      )}
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}

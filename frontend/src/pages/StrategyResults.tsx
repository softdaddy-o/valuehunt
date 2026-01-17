/**
 * StrategyResults Page
 * Display results from executed strategy
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RecommendationCard } from '@/components/strategy/RecommendationCard'
import { Button } from '@/components/ui/Button'
import { StrategyType, StrategyRequest, StrategyResponse } from '@/services/ai/types'
import { StrategyService } from '@/services/ai/strategy.service'
import { getMockStrategyResponse, shouldUseMockStrategy } from '@/services/mockStrategyService'
import { getAIService } from '@/services/ai'

function getStockCount(type: StrategyType): number {
  if (type === StrategyType.FEAR_DRIVEN_QUALITY) {
    return 5
  }
  return 10
}

export function StrategyResults(): JSX.Element | null {
  const { strategyType } = useParams<{ strategyType: string }>()
  const navigate = useNavigate()
  const [result, setResult] = useState<StrategyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMock, setUsingMock] = useState(false)

  const executeStrategy = useCallback(async (type: StrategyType): Promise<void> => {
    setIsLoading(true)
    setError(null)

    const request: StrategyRequest = {
      strategyType: type,
      market: 'KOSPI',
      stockCount: getStockCount(type),
    }

    try {
      const useMock = shouldUseMockStrategy()
      setUsingMock(useMock)

      const response = useMock
        ? await getMockStrategyResponse(request)
        : await new StrategyService(getAIService()).executeStrategy(request)

      setResult(response)
    } catch (err) {
      console.error('Strategy execution error:', err)
      setError('전략 실행 중 오류가 발생했습니다. 나중에 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!strategyType) {
      navigate('/strategies')
      return
    }

    executeStrategy(strategyType as StrategyType)
  }, [strategyType, navigate, executeStrategy])

  function handleBackToStrategies(): void {
    navigate('/strategies')
  }

  function handleRetry(): void {
    if (strategyType) {
      executeStrategy(strategyType as StrategyType)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            AI가 시장을 분석하고 있습니다...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="flex gap-3">
            <Button onClick={handleRetry}>다시 시도</Button>
            <Button variant="outline" onClick={handleBackToStrategies}>
              전략 목록으로
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={handleBackToStrategies} className="mb-4">
          ← 전략 목록으로
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {result.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{result.summary}</p>
          </div>

          {usingMock && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-amber-600 dark:text-amber-400">데모 모드</span>
            </div>
          )}
        </div>
      </div>

      {/* Market Context */}
      {result.marketContext && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            시장 상황
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">{result.marketContext}</p>
        </div>
      )}

      {/* Recommendations */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          추천 종목 ({result.recommendations.length}개)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {result.recommendations.map((rec) => (
            <RecommendationCard key={rec.stockCode} recommendation={rec} />
          ))}
        </div>
      </div>

      {/* Risks */}
      {result.risks.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
            주요 리스크
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {result.risks.map((risk, index) => (
              <li key={index} className="text-sm text-red-800 dark:text-red-200">
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Methodology */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">
          분석 방법론
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-400">{result.methodology}</p>
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-xs text-yellow-800 dark:text-yellow-300">{result.disclaimer}</p>
      </div>
    </div>
  )
}

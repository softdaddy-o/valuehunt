/**
 * AI Stock Analysis Service
 * Uses backend API for AI-powered stock analysis (Gemini)
 */

import type { AxiosError } from 'axios'

import { aiApi } from '@/api'
import type { StockDetail, AIAnalysis } from '@/types/api'
import type { StockAnalysisRequest } from './ai/types'
import {
  isUserAuthenticated,
  isAIAvailableForUser,
  isAIAvailableForUserSync,
  resetAIAvailabilityCache as resetCache,
} from './aiAvailabilityCache'

/**
 * Generate AI analysis for a stock via backend API
 */
export async function generateStockAnalysis(stockDetail: StockDetail): Promise<AIAnalysis> {
  if (!isUserAuthenticated()) {
    console.warn('User not authenticated, returning placeholder analysis')
    return generatePlaceholderAnalysis(stockDetail)
  }

  try {
    const request: StockAnalysisRequest = {
      stockCode: stockDetail.stock_info.code,
      stockName: stockDetail.stock_info.name,
      marketCap: stockDetail.stock_info.market_cap,
      sector: stockDetail.stock_info.sector,
      currentPrice: stockDetail.stock_info.current_price,
      valueScore: stockDetail.value_score.total,
      metrics: {
        PER: stockDetail.financial_metrics.current.PER,
        PBR: stockDetail.financial_metrics.current.PBR,
        ROE: stockDetail.financial_metrics.current.ROE,
        ROA: stockDetail.financial_metrics.current.ROA,
        debtRatio: stockDetail.financial_metrics.current.debt_ratio,
        dividendYield: stockDetail.financial_metrics.current.dividend_yield,
      },
    }

    const response = await aiApi.analyzeStock(request)

    return {
      summary: response.summary,
      strengths: response.strengths,
      risks: response.risks,
    }
  } catch (error) {
    const axiosError = error as AxiosError
    console.error('Failed to generate AI analysis:', error)

    if (axiosError.response?.status === 401) {
      return {
        summary: '로그인이 필요합니다.',
        strengths: ['로그인 후 AI 분석을 이용해주세요'],
        risks: ['인증 오류'],
      }
    }

    return generatePlaceholderAnalysis(stockDetail)
  }
}

/**
 * Generate a short AI summary for stock cards via backend API
 */
export async function generateStockSummary(
  stockCode: string,
  stockName: string,
  valueScore: number,
  metrics?: {
    PER?: number | null
    PBR?: number | null
    ROE?: number | null
  }
): Promise<string> {
  if (!isUserAuthenticated()) {
    return generatePlaceholderSummary(stockName, valueScore)
  }

  try {
    const request: StockAnalysisRequest = {
      stockCode,
      stockName,
      valueScore,
      metrics: {
        PER: metrics?.PER,
        PBR: metrics?.PBR,
        ROE: metrics?.ROE,
      },
    }

    const response = await aiApi.analyzeStock(request)
    return response.summary
  } catch (error) {
    console.error('Failed to generate stock summary:', error)
    return generatePlaceholderSummary(stockName, valueScore)
  }
}

/**
 * Batch generate summaries for multiple stocks
 * Uses rate limiting to avoid API throttling
 */
export async function batchGenerateStockSummaries(
  stocks: Array<{
    code: string
    name: string
    valueScore: number
    metrics?: {
      PER?: number | null
      PBR?: number | null
      ROE?: number | null
    }
  }>,
  delayMs: number = 1000
): Promise<Map<string, string>> {
  const summaries = new Map<string, string>()

  for (const stock of stocks) {
    try {
      const summary = await generateStockSummary(
        stock.code,
        stock.name,
        stock.valueScore,
        stock.metrics
      )
      summaries.set(stock.code, summary)

      // Add delay between requests to avoid rate limiting
      if (delayMs > 0 && stocks.indexOf(stock) < stocks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      console.error(`Failed to generate summary for ${stock.code}:`, error)
      summaries.set(stock.code, generatePlaceholderSummary(stock.name, stock.valueScore))
    }
  }

  return summaries
}

/**
 * Generate placeholder analysis when AI is not available
 */
function generatePlaceholderAnalysis(stockDetail: StockDetail): AIAnalysis {
  const { stock_info, value_score, financial_metrics } = stockDetail

  const strengths: string[] = []
  const risks: string[] = []

  // Valuation strengths/risks
  if (financial_metrics.current.PER && financial_metrics.current.PER < 10) {
    strengths.push('낮은 PER로 밸류에이션 매력도 높음')
  } else if (financial_metrics.current.PER && financial_metrics.current.PER > 20) {
    risks.push('높은 PER, 밸류에이션 부담')
  }

  // Profitability
  const roe = Number(financial_metrics.current.ROE)
  if (financial_metrics.current.ROE && roe > 15) {
    strengths.push(`우수한 자기자본이익률 (ROE ${roe.toFixed(1)}%)`)
  } else if (financial_metrics.current.ROE && roe < 5) {
    risks.push('낮은 수익성')
  }

  // Stability
  const debtRatio = Number(financial_metrics.current.debt_ratio)
  if (financial_metrics.current.debt_ratio && debtRatio < 100) {
    strengths.push('안정적인 재무구조')
  } else if (financial_metrics.current.debt_ratio && debtRatio > 200) {
    risks.push('높은 부채비율')
  }

  // Dividend
  const dividendYield = Number(financial_metrics.current.dividend_yield)
  if (financial_metrics.current.dividend_yield && dividendYield > 3) {
    strengths.push(
      `매력적인 배당수익률 (${dividendYield.toFixed(1)}%)`
    )
  }

  // Default values if empty
  if (strengths.length === 0) {
    strengths.push('재무 데이터 분석 중')
  }
  if (risks.length === 0) {
    risks.push('리스크 평가 진행 중')
  }

  const totalScore = Number(value_score.total)
  const summary =
    totalScore >= 70
      ? `${stock_info.name}은 Value Score ${totalScore.toFixed(1)}점으로 우량 저평가주로 평가됩니다. ${stock_info.sector || '해당 업종'}에서 안정적인 실적을 보이고 있습니다.`
      : totalScore >= 50
        ? `${stock_info.name}은 Value Score ${totalScore.toFixed(1)}점으로 관심 종목입니다. 재무 지표를 고려한 투자 검토가 필요합니다.`
        : `${stock_info.name}은 Value Score ${totalScore.toFixed(1)}점입니다. 투자 시 신중한 접근이 필요합니다.`

  return {
    summary,
    strengths,
    risks,
  }
}

/**
 * Generate placeholder summary when AI is not available
 */
function generatePlaceholderSummary(stockName: string, valueScore: number | string): string {
  const score = Number(valueScore)
  if (score >= 70) {
    return `${stockName}은 Value Score ${score.toFixed(1)}점으로 우량 저평가주로 평가됩니다.`
  } else if (score >= 50) {
    return `${stockName}은 Value Score ${score.toFixed(1)}점으로 관심 종목입니다.`
  } else {
    return `${stockName}은 Value Score ${score.toFixed(1)}점입니다. 신중한 검토가 필요합니다.`
  }
}

/**
 * Check if AI analysis is available (async)
 */
export async function isAIAnalysisAvailable(): Promise<boolean> {
  return isAIAvailableForUser()
}

/**
 * Synchronous check (uses cached value)
 */
export function isAIAnalysisAvailableSync(): boolean {
  return isAIAvailableForUserSync()
}

/**
 * Reset AI availability cache
 */
export function resetAIAvailabilityCache(): void {
  resetCache()
}

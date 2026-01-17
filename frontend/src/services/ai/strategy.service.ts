/**
 * Strategy Service for GROK-style AI Stock Trading Analysis
 * Implements 3 core strategies using Claude/Gemini AI
 */

import { HybridAIService } from './hybrid.service'
import {
  StrategyType,
  StrategyRequest,
  StrategyResponse,
  StockRecommendation,
} from './types'

interface StrategyConfig {
  buildPrompt: (request: StrategyRequest) => string
  defaultTitle: string
  errorMessage: string
}

export class StrategyService {
  private aiService: HybridAIService
  private strategyConfigs: Map<StrategyType, StrategyConfig>

  constructor(aiService: HybridAIService) {
    this.aiService = aiService
    this.strategyConfigs = new Map([
      [StrategyType.UNDERVALUED_SCREENER, {
        buildPrompt: this.buildUndervaluedPrompt.bind(this),
        defaultTitle: '저평가 우량주 TOP 10',
        errorMessage: 'Failed to execute undervalued screener strategy',
      }],
      [StrategyType.FEAR_DRIVEN_QUALITY, {
        buildPrompt: this.buildFearDrivenPrompt.bind(this),
        defaultTitle: '공포에 팔린 우량주 TOP 5',
        errorMessage: 'Failed to execute fear-driven quality strategy',
      }],
      [StrategyType.DIVIDEND_ANALYZER, {
        buildPrompt: this.buildDividendPrompt.bind(this),
        defaultTitle: '장기 투자용 배당주 TOP 10',
        errorMessage: 'Failed to execute dividend analyzer strategy',
      }],
    ])
  }

  /**
   * Execute a strategy analysis
   */
  async executeStrategy(request: StrategyRequest): Promise<StrategyResponse> {
    console.log(`Executing strategy: ${request.strategyType}`)

    const config = this.strategyConfigs.get(request.strategyType)
    if (!config) {
      throw new Error(`Strategy ${request.strategyType} not implemented`)
    }

    const prompt = config.buildPrompt(request)

    try {
      const response = await this.aiService.chat({ message: prompt }, true)
      return this.parseStrategyResponse(response.reply, request.strategyType, config.defaultTitle)
    } catch (error) {
      console.error(`${request.strategyType} error:`, error)
      throw new Error(config.errorMessage)
    }
  }

  /**
   * Build prompt for Strategy #1: Undervalued Screener
   */
  private buildUndervaluedPrompt(request: StrategyRequest): string {
    const market = request.market || '한국'
    const stockCount = request.stockCount || 10

    return `당신은 한국 주식 시장의 가치투자 전문가입니다.

현재 ${market} 주식 시장에서 재무적으로 건전한 저평가 종목 ${stockCount}개를 찾아주세요.

선정 기준:
- 동종 업계 평균보다 낮은 PER
- 최근 3년간 이익 성장
- 낮은 부채비율 (100% 이하 선호)
- 안정적인 현금흐름
- 증권사 리포트 기준 30% 이상 상승 여력

다음 JSON 형식으로 응답해주세요:
{
  "title": "저평가 우량주 TOP ${stockCount}",
  "summary": "시장 상황 및 종목 선정 개요 (2-3문장)",
  "recommendations": [
    {
      "stockCode": "종목코드 (6자리 숫자)",
      "stockName": "종목명",
      "market": "KOSPI/KOSDAQ",
      "sector": "업종",
      "rationale": "저평가 이유 (2-3문장, 구체적인 재무지표 언급)",
      "metrics": {
        "PER": 8.5,
        "PBR": 0.8,
        "ROE": 15.2,
        "debtRatio": 45.0,
        "profitGrowth": 12.5
      },
      "upsidePotential": "+35%",
      "riskLevel": "low",
      "confidenceScore": 85
    }
  ],
  "marketContext": "현재 시장 상황 분석 (2-3문장)",
  "risks": ["리스크 요인 1", "리스크 요인 2", "리스크 요인 3"],
  "methodology": "분석 방법론 설명 (1-2문장)"
}

JSON만 출력하고 다른 텍스트는 포함하지 마세요.`
  }

  /**
   * Build prompt for Strategy #3: Fear-Driven Quality
   */
  private buildFearDrivenPrompt(request: StrategyRequest): string {
    const market = request.market || '한국'
    const stockCount = request.stockCount || 5

    return `당신은 한국 주식 시장의 역발상 투자 전문가입니다.

현재 ${market} 주식 시장에서 악재나 소문, 단기 이슈로 과도하게 매도된 우량주 ${stockCount}개를 찾아주세요.

비교 분석:
- 최근 주가 하락 원인
- 실제 재무 상태 (매출, 이익, 현금흐름)
- 부채 상황
- 펀더멘털과 주가 괴리도

"시장이 오해하여 팔고 있는" 종목 ${stockCount}개를 선정해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "title": "공포에 팔린 우량주 TOP ${stockCount}",
  "summary": "시장 심리 및 기회 개요 (2-3문장)",
  "recommendations": [
    {
      "stockCode": "종목코드 (6자리 숫자)",
      "stockName": "종목명",
      "market": "KOSPI/KOSDAQ",
      "sector": "업종",
      "rationale": "과매도 이유 및 실제 펀더멘털 분석 (2-3문장)",
      "metrics": {
        "PER": 10.2,
        "PBR": 1.1,
        "ROE": 12.8,
        "debtRatio": 55.0,
        "revenueGrowth": 8.5
      },
      "upsidePotential": "+40%",
      "riskLevel": "medium",
      "confidenceScore": 75
    }
  ],
  "marketContext": "현재 시장 심리 및 공포 요인 분석 (2-3문장)",
  "risks": ["리스크 요인 1", "리스크 요인 2", "리스크 요인 3"],
  "methodology": "분석 방법론 설명 (1-2문장)"
}

JSON만 출력하고 다른 텍스트는 포함하지 마세요.`
  }

  /**
   * Build prompt for Strategy #4: Dividend Analyzer
   */
  private buildDividendPrompt(request: StrategyRequest): string {
    const market = request.market || '한국'
    const stockCount = request.stockCount || 10

    return `당신은 한국 주식 시장의 배당투자 전문가입니다.

현재 ${market} 주식 시장에서 10년 이상 꾸준히 배당을 지급하거나 증액한 안정적인 배당주 ${stockCount}개를 찾아주세요.

분석 항목:
- 배당수익률
- 배당 지속가능성
- 배당성향 대비 이익
- 10년 장기투자 시뮬레이션

은퇴 자금 / 장기 소득투자에 적합한 종목을 선정해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "title": "장기 투자용 배당주 TOP ${stockCount}",
  "summary": "배당주 투자 환경 및 선정 개요 (2-3문장)",
  "recommendations": [
    {
      "stockCode": "종목코드 (6자리 숫자)",
      "stockName": "종목명",
      "market": "KOSPI/KOSDAQ",
      "sector": "업종",
      "rationale": "배당 안정성 및 매력도 분석 (2-3문장)",
      "metrics": {
        "dividendYield": 4.5,
        "PER": 12.0,
        "PBR": 1.2,
        "ROE": 10.5,
        "debtRatio": 35.0
      },
      "upsidePotential": "+15% + 배당",
      "riskLevel": "low",
      "confidenceScore": 90
    }
  ],
  "marketContext": "배당주 투자 환경 분석 (2-3문장)",
  "risks": ["리스크 요인 1", "리스크 요인 2", "리스크 요인 3"],
  "methodology": "분석 방법론 설명 (1-2문장)"
}

JSON만 출력하고 다른 텍스트는 포함하지 마세요.`
  }

  /**
   * Parse strategy response from AI
   */
  private parseStrategyResponse(
    text: string,
    strategyType: StrategyType,
    defaultTitle: string
  ): StrategyResponse {
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanText)

      return {
        strategyType,
        title: parsed.title || defaultTitle,
        summary: parsed.summary || '',
        recommendations: this.validateRecommendations(parsed.recommendations || []),
        marketContext: parsed.marketContext,
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        methodology: parsed.methodology || 'AI 기반 정량적 분석',
        disclaimer:
          '본 분석은 AI 기반 참고 자료이며, 투자 권유가 아닙니다. 투자 판단은 본인 책임입니다.',
        generatedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Failed to parse strategy response:', error)
      console.error('Response text:', text)

      // Return error fallback
      return {
        strategyType,
        title: defaultTitle,
        summary: 'AI 응답 처리 중 오류가 발생했습니다.',
        recommendations: [],
        risks: ['응답 파싱 오류'],
        methodology: 'AI 분석',
        disclaimer:
          '본 분석은 AI 기반 참고 자료이며, 투자 권유가 아닙니다. 투자 판단은 본인 책임입니다.',
        generatedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Validate and sanitize recommendations
   */
  private validateRecommendations(recommendations: any[]): StockRecommendation[] {
    return recommendations
      .filter((rec) => rec.stockCode && rec.stockName)
      .map((rec) => ({
        stockCode: rec.stockCode,
        stockName: rec.stockName,
        market: rec.market || 'KOSPI',
        sector: rec.sector,
        currentPrice: rec.currentPrice,
        targetPrice: rec.targetPrice,
        upsidePotential: rec.upsidePotential || 'N/A',
        rationale: rec.rationale || '',
        metrics: {
          PER: rec.metrics?.PER ?? null,
          PBR: rec.metrics?.PBR ?? null,
          ROE: rec.metrics?.ROE ?? null,
          debtRatio: rec.metrics?.debtRatio ?? null,
          dividendYield: rec.metrics?.dividendYield ?? null,
          revenueGrowth: rec.metrics?.revenueGrowth ?? null,
          profitGrowth: rec.metrics?.profitGrowth ?? null,
        },
        riskLevel: rec.riskLevel || 'medium',
        confidenceScore: rec.confidenceScore || 50,
      }))
  }
}

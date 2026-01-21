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
      [StrategyType.INSIDER_TRADING, {
        buildPrompt: this.buildInsiderTradingPrompt.bind(this),
        defaultTitle: '내부자 매수 신호 TOP 10',
        errorMessage: 'Failed to execute insider trading strategy',
      }],
      [StrategyType.THEME_VS_REAL, {
        buildPrompt: this.buildThemeVsRealPrompt.bind(this),
        defaultTitle: '진짜 실적주 TOP 10',
        errorMessage: 'Failed to execute theme vs real strategy',
      }],
      [StrategyType.SECTOR_ROTATION, {
        buildPrompt: this.buildSectorRotationPrompt.bind(this),
        defaultTitle: '섹터 로테이션 유망주 TOP 10',
        errorMessage: 'Failed to execute sector rotation strategy',
      }],
      [StrategyType.HIDDEN_GROWTH, {
        buildPrompt: this.buildHiddenGrowthPrompt.bind(this),
        defaultTitle: '숨은 성장주 TOP 10',
        errorMessage: 'Failed to execute hidden growth strategy',
      }],
      [StrategyType.PORTFOLIO_DESIGNER, {
        buildPrompt: this.buildPortfolioDesignerPrompt.bind(this),
        defaultTitle: '균형 포트폴리오 TOP 10',
        errorMessage: 'Failed to execute portfolio designer strategy',
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
   * Build prompt for Undervalued Screener strategy
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
   * Build prompt for Fear-Driven Quality strategy
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
   * Build prompt for Dividend Analyzer strategy
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
   * Build prompt for Insider Trading strategy
   */
  private buildInsiderTradingPrompt(request: StrategyRequest): string {
    const market = request.market || '한국'
    const stockCount = request.stockCount || 10

    return `당신은 한국 주식 시장의 내부자 거래 분석 전문가입니다.

현재 ${market} 주식 시장에서 임원 및 대주주가 지속적으로 자사주를 매수하고 있는 종목 ${stockCount}개를 찾아주세요.

분석 기준:
- 최근 6개월간 내부자(임원, 대주주) 순매수 패턴
- 매수 규모 및 빈도
- 매수 후 주가 흐름
- 회사의 재무 건전성
- 내부자 매수의 신호 강도 (확신 vs 의무적 매수)

"경영진이 자기 돈으로 사는" 진정한 매수 신호를 가진 종목을 선정해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "title": "내부자 매수 신호 TOP ${stockCount}",
  "summary": "내부자 매수 동향 개요 (2-3문장)",
  "recommendations": [
    {
      "stockCode": "종목코드 (6자리 숫자)",
      "stockName": "종목명",
      "market": "KOSPI/KOSDAQ",
      "sector": "업종",
      "rationale": "내부자 매수 패턴 및 의미 분석 (2-3문장)",
      "metrics": {
        "PER": 10.5,
        "PBR": 1.2,
        "ROE": 12.0,
        "debtRatio": 40.0,
        "profitGrowth": 15.0
      },
      "upsidePotential": "+30%",
      "riskLevel": "medium",
      "confidenceScore": 80
    }
  ],
  "marketContext": "현재 내부자 거래 동향 분석 (2-3문장)",
  "risks": ["리스크 요인 1", "리스크 요인 2", "리스크 요인 3"],
  "methodology": "분석 방법론 설명 (1-2문장)"
}

JSON만 출력하고 다른 텍스트는 포함하지 마세요.`
  }

  /**
   * Build prompt for Theme vs Real strategy
   */
  private buildThemeVsRealPrompt(request: StrategyRequest): string {
    const market = request.market || '한국'
    const stockCount = request.stockCount || 10

    return `당신은 한국 주식 시장의 테마주 분석 전문가입니다.

현재 ${market} 주식 시장에서 AI, 2차전지, 반도체, 바이오 등 인기 테마 중 실제 실적이 뒷받침되는 진짜 실적주 ${stockCount}개를 찾아주세요.

분석 기준:
- 테마 관련 매출 비중 (최소 30% 이상)
- 실제 영업이익 기여도
- 수주 잔고 및 성장 가시성
- 경쟁사 대비 기술력/시장점유율
- 주가 vs 실적 괴리도

"이름만 테마주"가 아닌 "실적으로 증명된" 종목을 선정해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "title": "진짜 실적주 TOP ${stockCount}",
  "summary": "테마 vs 실적 분석 개요 (2-3문장)",
  "recommendations": [
    {
      "stockCode": "종목코드 (6자리 숫자)",
      "stockName": "종목명",
      "market": "KOSPI/KOSDAQ",
      "sector": "업종",
      "rationale": "테마 관련 실적 증명 (2-3문장, 구체적인 매출/이익 언급)",
      "metrics": {
        "PER": 15.0,
        "PBR": 2.5,
        "ROE": 18.0,
        "debtRatio": 35.0,
        "revenueGrowth": 25.0
      },
      "upsidePotential": "+40%",
      "riskLevel": "medium",
      "confidenceScore": 75
    }
  ],
  "marketContext": "현재 테마주 시장 분석 (2-3문장)",
  "risks": ["리스크 요인 1", "리스크 요인 2", "리스크 요인 3"],
  "methodology": "분석 방법론 설명 (1-2문장)"
}

JSON만 출력하고 다른 텍스트는 포함하지 마세요.`
  }

  /**
   * Build prompt for Sector Rotation strategy
   */
  private buildSectorRotationPrompt(request: StrategyRequest): string {
    const market = request.market || '한국'
    const stockCount = request.stockCount || 10

    return `당신은 한국 주식 시장의 섹터 로테이션 전문가입니다.

현재 경제 사이클과 금리/물가/경기 지표를 분석하여 향후 6-12개월간 유망한 섹터와 대표 종목 ${stockCount}개를 찾아주세요.

분석 기준:
- 현재 경기 사이클 단계 (회복/확장/둔화/침체)
- 금리 방향성 및 영향
- 물가 동향 및 수혜/피해 업종
- 글로벌 공급망 변화
- 정책 수혜 업종

경기 사이클 전환점에서 선제적으로 유망 섹터를 포착하는 전략입니다.

다음 JSON 형식으로 응답해주세요:
{
  "title": "섹터 로테이션 유망주 TOP ${stockCount}",
  "summary": "향후 6-12개월 유망 섹터 전망 (2-3문장)",
  "recommendations": [
    {
      "stockCode": "종목코드 (6자리 숫자)",
      "stockName": "종목명",
      "market": "KOSPI/KOSDAQ",
      "sector": "업종",
      "rationale": "섹터 유망 이유 및 종목 선정 근거 (2-3문장)",
      "metrics": {
        "PER": 12.0,
        "PBR": 1.5,
        "ROE": 14.0,
        "debtRatio": 50.0,
        "profitGrowth": 20.0
      },
      "upsidePotential": "+35%",
      "riskLevel": "medium",
      "confidenceScore": 70
    }
  ],
  "marketContext": "현재 경기 사이클 및 섹터 동향 (2-3문장)",
  "risks": ["리스크 요인 1", "리스크 요인 2", "리스크 요인 3"],
  "methodology": "분석 방법론 설명 (1-2문장)"
}

JSON만 출력하고 다른 텍스트는 포함하지 마세요.`
  }

  /**
   * Build prompt for Hidden Growth strategy
   */
  private buildHiddenGrowthPrompt(request: StrategyRequest): string {
    const market = request.market || '한국'
    const stockCount = request.stockCount || 10

    return `당신은 한국 주식 시장의 중소형 성장주 발굴 전문가입니다.

현재 ${market} 주식 시장에서 시가총액은 작지만(5000억원 이하) 높은 성장성을 가진 숨은 보석 ${stockCount}개를 찾아주세요.

분석 기준:
- 시가총액 5000억원 이하
- 매출 성장률 연 20% 이상
- 영업이익률 개선 추세
- 신사업/신제품 성장 잠재력
- 기관 투자 유입 전 단계

기관이 아직 발견하지 못한 "숨은 성장주"를 선정해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "title": "숨은 성장주 TOP ${stockCount}",
  "summary": "중소형 성장주 발굴 개요 (2-3문장)",
  "recommendations": [
    {
      "stockCode": "종목코드 (6자리 숫자)",
      "stockName": "종목명",
      "market": "KOSPI/KOSDAQ",
      "sector": "업종",
      "rationale": "성장 잠재력 분석 (2-3문장, 구체적인 성장 동력 언급)",
      "metrics": {
        "PER": 20.0,
        "PBR": 3.0,
        "ROE": 15.0,
        "debtRatio": 30.0,
        "revenueGrowth": 35.0
      },
      "upsidePotential": "+60%",
      "riskLevel": "high",
      "confidenceScore": 65
    }
  ],
  "marketContext": "중소형주 시장 동향 (2-3문장)",
  "risks": ["리스크 요인 1", "리스크 요인 2", "리스크 요인 3"],
  "methodology": "분석 방법론 설명 (1-2문장)"
}

JSON만 출력하고 다른 텍스트는 포함하지 마세요.`
  }

  /**
   * Build prompt for Portfolio Designer strategy
   */
  private buildPortfolioDesignerPrompt(request: StrategyRequest): string {
    const market = request.market || '한국'
    const stockCount = request.stockCount || 10

    return `당신은 한국 주식 시장의 포트폴리오 설계 전문가입니다.

${market} 주식 시장에서 균형 잡힌 분산 투자 포트폴리오를 구성할 ${stockCount}개 종목을 추천해주세요.

포트폴리오 구성 원칙:
- 섹터 분산 (최소 5개 이상 업종)
- 시가총액 분산 (대형/중형/소형)
- 스타일 분산 (가치주/성장주/배당주)
- 리스크 분산 (저위험/중위험/고위험)
- 상관관계 고려 (동일 방향 움직임 최소화)

안정적 수익과 성장을 동시에 추구하는 균형 포트폴리오를 설계해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "title": "균형 포트폴리오 TOP ${stockCount}",
  "summary": "포트폴리오 구성 전략 개요 (2-3문장)",
  "recommendations": [
    {
      "stockCode": "종목코드 (6자리 숫자)",
      "stockName": "종목명",
      "market": "KOSPI/KOSDAQ",
      "sector": "업종",
      "rationale": "포트폴리오 내 역할 및 선정 이유 (2-3문장)",
      "metrics": {
        "PER": 12.0,
        "PBR": 1.2,
        "ROE": 12.0,
        "debtRatio": 40.0,
        "dividendYield": 2.5
      },
      "upsidePotential": "+25%",
      "riskLevel": "low",
      "confidenceScore": 80
    }
  ],
  "marketContext": "현재 시장 환경 및 포트폴리오 전략 (2-3문장)",
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

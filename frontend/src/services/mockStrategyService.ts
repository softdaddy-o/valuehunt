/**
 * Mock Strategy Service
 * Provides demo responses when AI is unavailable
 */

import {
  StrategyType,
  StrategyRequest,
  StrategyResponse,
  StockRecommendation,
} from './ai/types'

/**
 * Mock data for Strategy #1: Undervalued Screener
 */
const mockUndervaluedStocks: StockRecommendation[] = [
  {
    stockCode: '005930',
    stockName: '삼성전자',
    market: 'KOSPI',
    sector: '전기전자',
    rationale:
      'PER 15배로 글로벌 반도체 업체 대비 저평가. 메모리 반도체 수요 회복과 파운드리 사업 성장 기대',
    metrics: {
      PER: 15.2,
      PBR: 1.1,
      ROE: 8.5,
      debtRatio: 25.0,
      profitGrowth: 10.5,
      revenueGrowth: null,
      dividendYield: 2.5,
    },
    upsidePotential: '+30%',
    riskLevel: 'low',
    confidenceScore: 85,
  },
  {
    stockCode: '000660',
    stockName: 'SK하이닉스',
    market: 'KOSPI',
    sector: '반도체',
    rationale: 'HBM 메모리 시장 점유율 1위. AI 서버 수요 증가로 고부가가치 제품 매출 확대 전망',
    metrics: {
      PER: 12.8,
      PBR: 1.3,
      ROE: 12.0,
      debtRatio: 30.0,
      profitGrowth: 25.0,
      revenueGrowth: null,
      dividendYield: 1.8,
    },
    upsidePotential: '+40%',
    riskLevel: 'medium',
    confidenceScore: 80,
  },
  {
    stockCode: '207940',
    stockName: '삼성바이오로직스',
    market: 'KOSPI',
    sector: '바이오',
    rationale:
      '글로벌 CMO 시장 성장세 지속. 5공장 증설로 생산능력 확대, 수주 잔고 안정적',
    metrics: {
      PER: 45.0,
      PBR: 3.2,
      ROE: 7.5,
      debtRatio: 15.0,
      profitGrowth: 18.0,
      revenueGrowth: null,
      dividendYield: 0.5,
    },
    upsidePotential: '+25%',
    riskLevel: 'medium',
    confidenceScore: 75,
  },
]

/**
 * Mock data for Strategy #3: Fear-Driven Quality
 */
const mockFearDrivenStocks: StockRecommendation[] = [
  {
    stockCode: '035720',
    stockName: '카카오',
    market: 'KOSPI',
    sector: 'IT서비스',
    rationale:
      '창업자 이슈로 단기 악재 있으나 카카오톡 플랫폼 독점적 지위는 유지. 광고/커머스 사업 회복 기대',
    metrics: {
      PER: 18.5,
      PBR: 1.5,
      ROE: 8.0,
      debtRatio: 45.0,
      profitGrowth: null,
      revenueGrowth: 12.0,
      dividendYield: 0.8,
    },
    upsidePotential: '+50%',
    riskLevel: 'medium',
    confidenceScore: 70,
  },
  {
    stockCode: '035420',
    stockName: 'NAVER',
    market: 'KOSPI',
    sector: 'IT서비스',
    rationale:
      '검색 광고 둔화 우려 있으나 네이버쇼핑, 네이버페이 등 커머스 플랫폼 성장 중. AI 검색 혁신 기대',
    metrics: {
      PER: 22.0,
      PBR: 1.8,
      ROE: 9.5,
      debtRatio: 35.0,
      profitGrowth: null,
      revenueGrowth: 10.5,
      dividendYield: 0.6,
    },
    upsidePotential: '+35%',
    riskLevel: 'medium',
    confidenceScore: 75,
  },
]

/**
 * Mock data for Strategy #4: Dividend Analyzer
 */
const mockDividendStocks: StockRecommendation[] = [
  {
    stockCode: '015760',
    stockName: '한국전력',
    market: 'KOSPI',
    sector: '전기가스업',
    rationale:
      '전력 수요 안정적이며 정부 정책으로 수익성 개선 전망. 배당 재개 및 증액 가능성',
    metrics: {
      PER: 8.5,
      PBR: 0.6,
      ROE: 5.0,
      debtRatio: 120.0,
      profitGrowth: null,
      revenueGrowth: null,
      dividendYield: 3.5,
    },
    upsidePotential: '+20% + 배당',
    riskLevel: 'low',
    confidenceScore: 85,
  },
  {
    stockCode: '055550',
    stockName: '신한지주',
    market: 'KOSPI',
    sector: '은행',
    rationale:
      '은행주 중 배당수익률 최고 수준. 금리 인하기에도 NIM 방어력 우수, 건전성 양호',
    metrics: {
      PER: 5.2,
      PBR: 0.4,
      ROE: 8.5,
      debtRatio: null,
      profitGrowth: null,
      revenueGrowth: null,
      dividendYield: 5.5,
    },
    upsidePotential: '+15% + 배당',
    riskLevel: 'low',
    confidenceScore: 90,
  },
  {
    stockCode: '000270',
    stockName: '기아',
    market: 'KOSPI',
    sector: '자동차',
    rationale:
      '전기차 판매 확대 및 SUV 인기로 수익성 개선. 주주환원 정책 강화로 배당 매력',
    metrics: {
      PER: 4.8,
      PBR: 0.6,
      ROE: 12.0,
      debtRatio: 45.0,
      profitGrowth: 15.0,
      revenueGrowth: null,
      dividendYield: 4.2,
    },
    upsidePotential: '+25% + 배당',
    riskLevel: 'medium',
    confidenceScore: 80,
  },
]

const DISCLAIMER = '본 분석은 AI 기반 참고 자료이며, 투자 권유가 아닙니다. 투자 판단은 본인 책임입니다.'

interface MockStrategyData {
  title: string
  summary: string
  recommendations: StockRecommendation[]
  defaultCount: number
  marketContext: string
  risks: string[]
  methodology: string
}

const MOCK_STRATEGY_DATA: Record<StrategyType, MockStrategyData | undefined> = {
  [StrategyType.UNDERVALUED_SCREENER]: {
    title: '저평가 우량주 TOP 10',
    summary: '현재 시장은 고금리와 경기 둔화 우려로 조정 국면입니다. 하지만 펀더멘털이 견조한 업종 대표주들이 동반 하락하며 매력적인 진입 기회를 제공하고 있습니다. PER 15배 이하이면서 ROE 8% 이상인 종목들을 선별했습니다.',
    recommendations: mockUndervaluedStocks,
    defaultCount: 10,
    marketContext: '코스피 지수가 2,500선에서 등락하며 방향성을 잃은 상황입니다. 반도체와 바이오 업종이 상대적으로 양호한 흐름을 보이고 있으며, 실적 개선 기대주에 대한 선별적 접근이 필요합니다.',
    risks: [
      '글로벌 경기 침체 장기화 리스크',
      '금리 인하 지연 가능성',
      '중국 경제 회복 지연',
    ],
    methodology: 'PER/PBR 업종 평균 비교, 3년 평균 이익 성장률, 부채비율 및 ROE 분석을 통한 정량적 스크리닝',
  },
  [StrategyType.FEAR_DRIVEN_QUALITY]: {
    title: '공포에 팔린 우량주 TOP 5',
    summary: '시장이 단기 악재에 과민 반응하며 우량 IT 플랫폼주들이 급락했습니다. 하지만 사업 본질은 견고하며, 펀더멘털 대비 과도한 주가 조정으로 역발상 매수 기회가 나타났습니다.',
    recommendations: mockFearDrivenStocks,
    defaultCount: 5,
    marketContext: '플랫폼 규제 이슈와 경영진 리스크로 IT주가 전반적으로 약세를 보였습니다. 하지만 국내 플랫폼 독점 지위는 유지되며, 광고/커머스 수익 모델은 여전히 견조합니다.',
    risks: [
      '추가 규제 강화 가능성',
      '경영진 교체에 따른 불확실성',
      '글로벌 빅테크 경쟁 심화',
    ],
    methodology: '최근 3개월 주가 하락률, 악재 분석, 펀더멘털 견조성 검증, 장기 성장성 평가',
  },
  [StrategyType.DIVIDEND_ANALYZER]: {
    title: '장기 투자용 배당주 TOP 10',
    summary: '고금리 환경에서 안정적인 배당 수익이 재조명받고 있습니다. 10년 이상 꾸준한 배당 이력과 3% 이상 배당수익률을 제공하는 종목들을 선별하여 은퇴 자금 및 장기 소득 투자에 적합한 포트폴리오를 구성했습니다.',
    recommendations: mockDividendStocks,
    defaultCount: 10,
    marketContext: '금리 인하 사이클 진입 전 시점으로, 채권 금리가 여전히 높은 수준입니다. 하지만 배당주는 안정적 현금흐름과 주가 상승 기대감으로 총수익률 측면에서 매력적입니다.',
    risks: [
      '금리 상승 시 채권 대비 매력도 감소',
      '기업 실적 악화 시 배당 감소 가능성',
      '주가 변동성에 따른 원금 손실 리스크',
    ],
    methodology: '10년 배당 지급 이력, 배당 성향 및 지속가능성 분석, 배당수익률 3% 이상 필터링',
  },
  // Future strategies - not yet implemented
  [StrategyType.INSIDER_TRADING]: undefined,
  [StrategyType.THEME_VS_REAL]: undefined,
  [StrategyType.SECTOR_ROTATION]: undefined,
  [StrategyType.HIDDEN_GROWTH]: undefined,
  [StrategyType.PORTFOLIO_DESIGNER]: undefined,
}

/**
 * Get mock strategy response
 */
export async function getMockStrategyResponse(request: StrategyRequest): Promise<StrategyResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const data = MOCK_STRATEGY_DATA[request.strategyType]
  if (!data) {
    throw new Error(`Mock data for ${request.strategyType} not available`)
  }

  const stockCount = request.stockCount ?? data.defaultCount

  return {
    strategyType: request.strategyType,
    title: data.title,
    summary: data.summary,
    recommendations: data.recommendations.slice(0, stockCount),
    marketContext: data.marketContext,
    risks: data.risks,
    methodology: data.methodology,
    disclaimer: DISCLAIMER,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Check if mock strategy service should be used
 */
export function shouldUseMockStrategy(): boolean {
  const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY
  return !claudeKey && !geminiKey
}

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

/**
 * Mock data for Strategy #5: Insider Trading
 */
const mockInsiderTradingStocks: StockRecommendation[] = [
  {
    stockCode: '005380',
    stockName: '현대차',
    market: 'KOSPI',
    sector: '자동차',
    rationale:
      '정의선 회장 및 임원진의 지속적 자사주 매수. 전기차 전환 자신감의 표현으로 해석',
    metrics: {
      PER: 5.5,
      PBR: 0.5,
      ROE: 10.5,
      debtRatio: 65.0,
      profitGrowth: 18.0,
      revenueGrowth: null,
      dividendYield: 3.8,
    },
    upsidePotential: '+35%',
    riskLevel: 'low',
    confidenceScore: 85,
  },
  {
    stockCode: '003550',
    stockName: 'LG',
    market: 'KOSPI',
    sector: '지주회사',
    rationale:
      'LG그룹 지주사 임원들의 꾸준한 자사주 매수. 그룹 계열사 실적 개선 기대감 반영',
    metrics: {
      PER: 8.2,
      PBR: 0.7,
      ROE: 8.0,
      debtRatio: 30.0,
      profitGrowth: 12.0,
      revenueGrowth: null,
      dividendYield: 2.5,
    },
    upsidePotential: '+25%',
    riskLevel: 'low',
    confidenceScore: 80,
  },
  {
    stockCode: '051910',
    stockName: 'LG화학',
    market: 'KOSPI',
    sector: '화학',
    rationale:
      '2차전지 사업부 분사 이후에도 경영진 매수 지속. 석유화학 업황 회복 기대',
    metrics: {
      PER: 18.5,
      PBR: 1.2,
      ROE: 6.5,
      debtRatio: 55.0,
      profitGrowth: null,
      revenueGrowth: 8.0,
      dividendYield: 1.5,
    },
    upsidePotential: '+30%',
    riskLevel: 'medium',
    confidenceScore: 75,
  },
]

/**
 * Mock data for Strategy #6: Theme vs Real
 */
const mockThemeVsRealStocks: StockRecommendation[] = [
  {
    stockCode: '373220',
    stockName: 'LG에너지솔루션',
    market: 'KOSPI',
    sector: '2차전지',
    rationale:
      '글로벌 배터리 점유율 2위. 북미 IRA 수혜로 수주 잔고 200조원 돌파. 테마가 아닌 실적주',
    metrics: {
      PER: 45.0,
      PBR: 4.5,
      ROE: 10.0,
      debtRatio: 40.0,
      profitGrowth: null,
      revenueGrowth: 35.0,
      dividendYield: null,
    },
    upsidePotential: '+40%',
    riskLevel: 'medium',
    confidenceScore: 80,
  },
  {
    stockCode: '006400',
    stockName: '삼성SDI',
    market: 'KOSPI',
    sector: '2차전지',
    rationale:
      '전고체 배터리 기술 선도. BMW, 리비안 등 프리미엄 고객사 확보. 매출의 80%가 배터리',
    metrics: {
      PER: 25.0,
      PBR: 2.0,
      ROE: 8.5,
      debtRatio: 35.0,
      profitGrowth: 15.0,
      revenueGrowth: 20.0,
      dividendYield: 0.8,
    },
    upsidePotential: '+35%',
    riskLevel: 'medium',
    confidenceScore: 78,
  },
  {
    stockCode: '042700',
    stockName: '한미반도체',
    market: 'KOSDAQ',
    sector: '반도체장비',
    rationale:
      'HBM 본딩 장비 글로벌 1위. SK하이닉스, 마이크론 공급. AI 반도체 수혜 실적으로 증명',
    metrics: {
      PER: 35.0,
      PBR: 8.0,
      ROE: 25.0,
      debtRatio: 15.0,
      profitGrowth: 50.0,
      revenueGrowth: 45.0,
      dividendYield: 0.5,
    },
    upsidePotential: '+50%',
    riskLevel: 'high',
    confidenceScore: 75,
  },
]

/**
 * Mock data for Strategy #7: Sector Rotation
 */
const mockSectorRotationStocks: StockRecommendation[] = [
  {
    stockCode: '086790',
    stockName: '하나금융지주',
    market: 'KOSPI',
    sector: '은행',
    rationale:
      '금리 인하 사이클 진입 전 마지막 고금리 수혜. NIM 방어력 우수하며 밸류업 수혜 기대',
    metrics: {
      PER: 4.5,
      PBR: 0.4,
      ROE: 9.0,
      debtRatio: null,
      profitGrowth: 8.0,
      revenueGrowth: null,
      dividendYield: 6.0,
    },
    upsidePotential: '+25%',
    riskLevel: 'low',
    confidenceScore: 82,
  },
  {
    stockCode: '035250',
    stockName: '강원랜드',
    market: 'KOSPI',
    sector: '레저',
    rationale:
      '내수 소비 회복 수혜. 카지노 독점권 보유. 경기 회복기 레저 소비 증가 전망',
    metrics: {
      PER: 12.0,
      PBR: 0.9,
      ROE: 7.5,
      debtRatio: 20.0,
      profitGrowth: 15.0,
      revenueGrowth: 12.0,
      dividendYield: 4.0,
    },
    upsidePotential: '+30%',
    riskLevel: 'medium',
    confidenceScore: 70,
  },
  {
    stockCode: '028260',
    stockName: '삼성물산',
    market: 'KOSPI',
    sector: '건설',
    rationale:
      '금리 인하 시 건설/부동산 섹터 수혜. 삼성그룹 지배구조 핵심. 리조트/패션 사업 안정적',
    metrics: {
      PER: 15.0,
      PBR: 0.8,
      ROE: 5.5,
      debtRatio: 45.0,
      profitGrowth: null,
      revenueGrowth: 5.0,
      dividendYield: 1.8,
    },
    upsidePotential: '+20%',
    riskLevel: 'low',
    confidenceScore: 75,
  },
]

/**
 * Mock data for Strategy #8: Hidden Growth
 */
const mockHiddenGrowthStocks: StockRecommendation[] = [
  {
    stockCode: '403870',
    stockName: 'HPSP',
    market: 'KOSDAQ',
    sector: '반도체장비',
    rationale:
      '고압 수소 어닐링 장비 세계 1위. 삼성전자, TSMC 공급. 시총 4000억대지만 매출 50% 성장',
    metrics: {
      PER: 25.0,
      PBR: 5.0,
      ROE: 22.0,
      debtRatio: 10.0,
      profitGrowth: 60.0,
      revenueGrowth: 50.0,
      dividendYield: null,
    },
    upsidePotential: '+70%',
    riskLevel: 'high',
    confidenceScore: 65,
  },
  {
    stockCode: '950140',
    stockName: '잉글우드랩',
    market: 'KOSDAQ',
    sector: '화장품ODM',
    rationale:
      '글로벌 인디 브랜드향 ODM 전문. 북미/유럽 수출 급증. 시총 3000억대 성장주',
    metrics: {
      PER: 18.0,
      PBR: 3.5,
      ROE: 20.0,
      debtRatio: 25.0,
      profitGrowth: 40.0,
      revenueGrowth: 35.0,
      dividendYield: 1.0,
    },
    upsidePotential: '+55%',
    riskLevel: 'high',
    confidenceScore: 68,
  },
  {
    stockCode: '263750',
    stockName: '펄어비스',
    market: 'KOSDAQ',
    sector: '게임',
    rationale:
      '검은사막 글로벌 성공. 신작 붉은사막 기대감. 시총 2조원대지만 신작 모멘텀 보유',
    metrics: {
      PER: 22.0,
      PBR: 2.8,
      ROE: 12.0,
      debtRatio: 5.0,
      profitGrowth: null,
      revenueGrowth: 15.0,
      dividendYield: null,
    },
    upsidePotential: '+45%',
    riskLevel: 'high',
    confidenceScore: 60,
  },
]

/**
 * Mock data for Strategy #9: Portfolio Designer
 */
const mockPortfolioDesignerStocks: StockRecommendation[] = [
  {
    stockCode: '005930',
    stockName: '삼성전자',
    market: 'KOSPI',
    sector: '전기전자',
    rationale:
      '포트폴리오 핵심 대형주. 반도체 업황 회복 수혜. 안정성과 성장성 겸비한 균형 종목',
    metrics: {
      PER: 15.2,
      PBR: 1.1,
      ROE: 8.5,
      debtRatio: 25.0,
      profitGrowth: 10.5,
      revenueGrowth: null,
      dividendYield: 2.5,
    },
    upsidePotential: '+25%',
    riskLevel: 'low',
    confidenceScore: 90,
  },
  {
    stockCode: '055550',
    stockName: '신한지주',
    market: 'KOSPI',
    sector: '은행',
    rationale:
      '배당 수익 담당. 고배당 은행주로 포트폴리오 현금흐름 안정화. 저PBR 밸류업 수혜',
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
    confidenceScore: 88,
  },
  {
    stockCode: '042700',
    stockName: '한미반도체',
    market: 'KOSDAQ',
    sector: '반도체장비',
    rationale:
      '성장 담당. AI/HBM 수혜 고성장주. 포트폴리오 수익률 견인 역할. 비중 10% 권장',
    metrics: {
      PER: 35.0,
      PBR: 8.0,
      ROE: 25.0,
      debtRatio: 15.0,
      profitGrowth: 50.0,
      revenueGrowth: 45.0,
      dividendYield: 0.5,
    },
    upsidePotential: '+50%',
    riskLevel: 'high',
    confidenceScore: 75,
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
  [StrategyType.INSIDER_TRADING]: {
    title: '내부자 매수 신호 TOP 10',
    summary: '임원 및 대주주의 자사주 매수는 강력한 투자 신호입니다. 경영진이 자기 돈으로 자사주를 사는 것은 회사의 미래에 대한 확신을 나타냅니다. 최근 6개월간 지속적인 내부자 매수가 있는 종목들을 선별했습니다.',
    recommendations: mockInsiderTradingStocks,
    defaultCount: 10,
    marketContext: '금리 인상기 불확실성 속에서 내부자들의 매수 행위가 증가하고 있습니다. 특히 대형주보다 중소형주에서 의미 있는 신호가 포착되고 있습니다.',
    risks: [
      '내부자 매수가 항상 주가 상승으로 이어지지 않음',
      '의무 보유 물량 매수 등 신호가 아닌 매수 가능성',
      '정보 비대칭으로 인한 리스크',
    ],
    methodology: '최근 6개월 내부자 순매수 금액, 매수 빈도, 매수 후 주가 흐름, 재무 건전성 분석',
  },
  [StrategyType.THEME_VS_REAL]: {
    title: '진짜 실적주 TOP 10',
    summary: 'AI, 2차전지, 반도체 등 인기 테마주 중 실제 실적이 뒷받침되는 종목을 구분했습니다. 테마 관련 매출이 30% 이상이며 영업이익에 실질적으로 기여하는 진짜 실적주만 선별했습니다.',
    recommendations: mockThemeVsRealStocks,
    defaultCount: 10,
    marketContext: '테마주 열풍 속에서 실적 없이 주가만 오른 종목과 실제 수혜주의 격차가 벌어지고 있습니다. 옥석 가리기가 필요한 시점입니다.',
    risks: [
      '테마 관련 수요 감소 시 실적 둔화 가능성',
      '경쟁 심화로 인한 마진 하락',
      '기술 변화에 따른 사업 모델 리스크',
    ],
    methodology: '테마 관련 매출 비중, 영업이익 기여도, 수주 잔고, 기술 경쟁력 분석',
  },
  [StrategyType.SECTOR_ROTATION]: {
    title: '섹터 로테이션 유망주 TOP 10',
    summary: '현재 경기 사이클과 금리/물가 동향을 분석하여 향후 6-12개월 유망 섹터를 전망했습니다. 금리 인하 수혜 섹터와 경기 회복 수혜주를 중심으로 선별했습니다.',
    recommendations: mockSectorRotationStocks,
    defaultCount: 10,
    marketContext: '금리 인하 사이클 진입을 앞두고 있으며, 그동안 소외되었던 금융, 건설, 소비재 섹터의 반등이 예상됩니다. 반도체는 여전히 강세를 유지할 전망입니다.',
    risks: [
      '금리 인하 지연 시 섹터 로테이션 지연',
      '글로벌 경기 침체 시 전 섹터 동반 하락',
      '예상치 못한 정책 변화 리스크',
    ],
    methodology: '경기 사이클 분석, 금리/물가 전망, 섹터별 실적 추이, 밸류에이션 비교',
  },
  [StrategyType.HIDDEN_GROWTH]: {
    title: '숨은 성장주 TOP 10',
    summary: '시가총액 5000억원 이하의 중소형주 중 매출 성장률 20% 이상의 고성장 기업을 발굴했습니다. 기관 투자자들이 아직 주목하지 않은 숨은 보석들입니다.',
    recommendations: mockHiddenGrowthStocks,
    defaultCount: 10,
    marketContext: '대형주 중심의 장세에서 중소형주는 상대적으로 소외되어 있습니다. 하지만 실적 성장이 뒷받침되는 종목들은 주가 재평가 가능성이 높습니다.',
    risks: [
      '유동성 부족으로 인한 변동성 리스크',
      '대형주 대비 정보 비대칭',
      '성장 지속성에 대한 불확실성',
    ],
    methodology: '시가총액 5000억 이하 필터링, 매출 성장률 20% 이상, 영업이익률 개선 추세 확인',
  },
  [StrategyType.PORTFOLIO_DESIGNER]: {
    title: '균형 포트폴리오 TOP 10',
    summary: '섹터, 시가총액, 투자 스타일을 분산한 균형 잡힌 포트폴리오를 설계했습니다. 안정적 수익과 성장을 동시에 추구하며, 시장 변동성에 대응할 수 있는 구성입니다.',
    recommendations: mockPortfolioDesignerStocks,
    defaultCount: 10,
    marketContext: '불확실한 시장 환경에서 분산 투자의 중요성이 더욱 커지고 있습니다. 단일 섹터나 종목에 집중하기보다 균형 잡힌 포트폴리오 구성이 필요합니다.',
    risks: [
      '시장 전체 하락 시 분산 효과 제한적',
      '개별 종목 리스크는 여전히 존재',
      '리밸런싱 비용 발생',
    ],
    methodology: '섹터 분산(5개 이상), 시가총액 분산, 스타일 분산(가치/성장/배당), 상관관계 분석',
  },
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

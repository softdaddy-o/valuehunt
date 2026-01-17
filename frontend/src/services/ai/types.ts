/**
 * AI Service Types and Interfaces
 */

export interface StockAnalysisRequest {
  stockCode: string
  stockName: string
  marketCap?: number | null
  sector?: string | null
  currentPrice?: number | null
  metrics?: {
    PER?: number | null
    PBR?: number | null
    ROE?: number | null
    ROA?: number | null
    debtRatio?: number | null
    dividendYield?: number | null
  }
  valueScore?: number
}

export interface StockAnalysisResponse {
  summary: string
  strengths: string[]
  risks: string[]
  investmentThesis?: string
  targetPriceRange?: string
}

export interface ChatRequest {
  message: string
  context?: {
    stockCode?: string
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  }
}

export interface ChatResponse {
  reply: string
  relatedStocks?: string[]
}

export enum AnalysisType {
  QUICK = 'quick', // Use Gemini for fast, basic analysis
  DEEP = 'deep', // Use Claude for comprehensive analysis
}

export enum AIProvider {
  GEMINI = 'gemini',
  CLAUDE = 'claude',
}

/**
 * Base AI Service Interface
 */
export interface IAIService {
  /**
   * Generate stock analysis
   */
  analyzeStock(request: StockAnalysisRequest): Promise<StockAnalysisResponse>

  /**
   * Generate chat response
   */
  chat(request: ChatRequest): Promise<ChatResponse>

  /**
   * Check if service is available
   */
  isAvailable(): boolean

  /**
   * Get provider name
   */
  getProvider(): AIProvider
}

/**
 * Configuration for AI services
 */
export interface AIServiceConfig {
  gemini?: {
    apiKey: string
    model?: string
  }
  claude?: {
    apiKey: string
    model?: string
  }
  defaultProvider?: AIProvider
  fallbackEnabled?: boolean
}

/**
 * Strategy Types for GROK-style AI Stock Analysis
 */
export enum StrategyType {
  UNDERVALUED_SCREENER = 'undervalued_screener',
  FEAR_DRIVEN_QUALITY = 'fear_driven_quality',
  DIVIDEND_ANALYZER = 'dividend_analyzer',
  // Future strategies (deferred)
  INSIDER_TRADING = 'insider_trading',
  THEME_VS_REAL = 'theme_vs_real',
  SECTOR_ROTATION = 'sector_rotation',
  HIDDEN_GROWTH = 'hidden_growth',
  PORTFOLIO_DESIGNER = 'portfolio_designer',
}

/**
 * Strategy Request
 */
export interface StrategyRequest {
  strategyType: StrategyType
  market?: 'KOSPI' | 'KOSDAQ' | 'US' | 'ALL'
  sector?: string
  stockCount?: number // Number of stocks to return (default: 10)
}

/**
 * Stock Recommendation
 */
export interface StockRecommendation {
  stockCode: string
  stockName: string
  market: string
  sector?: string
  currentPrice?: number
  targetPrice?: number
  upsidePotential?: string
  rationale: string
  metrics: {
    PER?: number | null
    PBR?: number | null
    ROE?: number | null
    debtRatio?: number | null
    dividendYield?: number | null
    revenueGrowth?: number | null // 3-year average
    profitGrowth?: number | null // 3-year average
  }
  riskLevel: 'low' | 'medium' | 'high'
  confidenceScore: number // 0-100
}

/**
 * Strategy Response
 */
export interface StrategyResponse {
  strategyType: StrategyType
  title: string
  summary: string
  recommendations: StockRecommendation[]
  marketContext?: string
  risks: string[]
  methodology: string
  disclaimer: string
  generatedAt: string
}

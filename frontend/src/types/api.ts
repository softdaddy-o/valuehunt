/**
 * API Response Types
 */

// User Types
export interface User {
  id: string
  email: string
  name: string | null
  is_premium: boolean
  premium_expires_at: string | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

// Stock Types
export interface Stock {
  code: string
  name: string
  market: string
  sector: string | null
  market_cap: number | null
  current_price: number | null
  change_rate: number | null
  updated_at: string
}

export interface KeyMetrics {
  PER: number | null
  PBR: number | null
  ROE: number | null
  debt_ratio: number | null
  dividend_yield: number | null
}

export interface CategoryScores {
  valuation: number
  profitability: number
  stability: number
  dividend: number
}

export interface TopPickItem {
  rank: number
  stock_code: string
  stock_name: string
  market: string
  current_price: number | null
  change_rate: number | null
  value_score: number
  category_scores: CategoryScores
  key_metrics: KeyMetrics
  ai_summary: string | null
  upside_potential: string | null
}

export interface TopPicksResponse {
  data: TopPickItem[]
  total_count: number
  updated_at: string
}

export interface ValueScore {
  total: number
  valuation: number
  profitability: number
  stability: number
  dividend: number
}

export interface AIAnalysis {
  summary: string | null
  strengths: string[]
  risks: string[]
}

export interface FinancialMetrics {
  current: {
    PER: number | null
    PBR: number | null
    ROE: number | null
    ROA: number | null
    debt_ratio: number | null
    current_ratio: number | null
    dividend_yield: number | null
  }
  historical: Array<{
    date: string
    PER: number | null
    PBR: number | null
    ROE: number | null
  }>
  sector_comparison: {
    sector: string | null
    avg_PER: number | null
    avg_ROE: number | null
    avg_debt_ratio: number | null
  }
}

export interface StockDetail {
  stock_info: Stock
  value_score: ValueScore
  ai_analysis: AIAnalysis
  financial_metrics: FinancialMetrics
  peer_comparison: any | null
  external_links: {
    dart: string
    news: string
  }
}

// Screener Types
export interface ScreenerFilters {
  market?: string[]
  market_cap_min?: number
  market_cap_max?: number
  sector?: string[]
  PER_max?: number
  PBR_max?: number
  ROE_min?: number
  debt_ratio_max?: number
  dividend_yield_min?: number
  value_score_min?: number
}

export interface ScreenerRequest {
  filters: ScreenerFilters
  sort_by?: string
  order?: 'asc' | 'desc'
  limit?: number
}

export interface ScreenerResult {
  stock_code: string
  stock_name: string
  value_score: number
  current_price: number | null
  PER: number | null
  PBR: number | null
  ROE: number | null
}

export interface ScreenerResponse {
  results: ScreenerResult[]
  total_count: number
  filters_applied: ScreenerFilters
}

// Watchlist Types
export interface WatchlistItem {
  id: number
  stock_code: string
  stock_name: string
  current_price: number | null
  target_price: number | null
  value_score: number | null
  value_score_change: string | null
  alert_enabled: boolean
  added_at: string
}

export interface WatchlistResponse {
  watchlist: WatchlistItem[]
}

export interface WatchlistCreate {
  stock_code: string
  target_price?: number | null
  alert_enabled?: boolean
}

export interface WatchlistUpdate {
  target_price?: number | null
  alert_enabled?: boolean
}

// Chat Types
export interface RelatedLink {
  title: string
  url: string
}

export interface ChatRequest {
  message: string
  conversation_id?: string
}

export interface ChatResponse {
  reply: string
  conversation_id: string
  related_links: RelatedLink[] | null
}

// Error Types
export interface APIError {
  error: {
    code: string
    message: string
    details: any | null
  }
}

/**
 * Stocks API Client
 */

import apiClient from './client'
import type { TopPicksResponse, StockDetail } from '@/types/api'

export interface TopPicksParams {
  market?: 'KOSPI' | 'KOSDAQ' | 'ALL'
  limit?: number
  category?: 'valuation' | 'profitability' | 'stability' | 'dividend'
}

export const stocksApi = {
  /**
   * Get top value picks
   */
  getTopPicks: async (params?: TopPicksParams): Promise<TopPicksResponse> => {
    const response = await apiClient.get<TopPicksResponse>('/stocks/top-picks', {
      params,
    })
    return response.data
  },

  /**
   * Get stock detail by code
   */
  getStockDetail: async (stockCode: string): Promise<StockDetail> => {
    const response = await apiClient.get<StockDetail>(`/stocks/${stockCode}`)
    return response.data
  },

  /**
   * List all stocks with filtering
   */
  listStocks: async (params?: {
    market?: string
    sector?: string
    skip?: number
    limit?: number
  }): Promise<any> => {
    const response = await apiClient.get('/stocks', { params })
    return response.data
  },
}

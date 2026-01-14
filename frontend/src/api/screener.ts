/**
 * Screener API Client
 */

import apiClient from './client'
import type { ScreenerRequest, ScreenerResponse } from '@/types/api'

export const screenerApi = {
  /**
   * Screen stocks with custom filters
   */
  screenStocks: async (request: ScreenerRequest): Promise<ScreenerResponse> => {
    const response = await apiClient.post<ScreenerResponse>('/screener', request)
    return response.data
  },
}

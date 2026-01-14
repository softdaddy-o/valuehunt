/**
 * Watchlist API Client
 */

import apiClient from './client'
import type {
  WatchlistResponse,
  WatchlistCreate,
  WatchlistUpdate,
} from '@/types/api'

export const watchlistApi = {
  /**
   * Get user's watchlist
   */
  getWatchlist: async (): Promise<WatchlistResponse> => {
    const response = await apiClient.get<WatchlistResponse>('/watchlist')
    return response.data
  },

  /**
   * Add stock to watchlist
   */
  addToWatchlist: async (data: WatchlistCreate): Promise<any> => {
    const response = await apiClient.post('/watchlist', data)
    return response.data
  },

  /**
   * Update watchlist item
   */
  updateWatchlistItem: async (
    id: number,
    data: WatchlistUpdate
  ): Promise<any> => {
    const response = await apiClient.put(`/watchlist/${id}`, data)
    return response.data
  },

  /**
   * Remove stock from watchlist
   */
  removeFromWatchlist: async (id: number): Promise<void> => {
    await apiClient.delete(`/watchlist/${id}`)
  },
}

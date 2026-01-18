/**
 * AI API Client
 * Handles all AI-related API calls to the backend
 */

import apiClient from './client'
import type {
  StockAnalysisRequest,
  StockAnalysisResponse,
  ChatRequest,
  ChatResponse,
  StrategyRequest,
  StrategyResponse,
} from '@/services/ai/types'

interface AIStatusResponse {
  available: boolean
  message: string
}

// Map frontend types to backend types
interface BackendChatRequest {
  message: string
  context?: {
    stockCode?: string
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  }
}

interface BackendChatResponse {
  reply: string
  relatedStocks?: string[]
}

export const aiApi = {
  /**
   * Check if AI service is available
   */
  getStatus: async (): Promise<AIStatusResponse> => {
    const response = await apiClient.get<AIStatusResponse>('/ai/status')
    return response.data
  },

  /**
   * Generate AI-powered stock analysis
   */
  analyzeStock: async (request: StockAnalysisRequest): Promise<StockAnalysisResponse> => {
    const response = await apiClient.post<StockAnalysisResponse>('/ai/analyze-stock', request)
    return response.data
  },

  /**
   * Send chat message to AI
   */
  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    const backendRequest: BackendChatRequest = {
      message: request.message,
      context: request.context,
    }
    const response = await apiClient.post<BackendChatResponse>('/ai/chat', backendRequest)
    return {
      reply: response.data.reply,
      relatedStocks: response.data.relatedStocks,
    }
  },

  /**
   * Execute trading strategy analysis
   */
  executeStrategy: async (request: StrategyRequest): Promise<StrategyResponse> => {
    const response = await apiClient.post<StrategyResponse>('/ai/strategy', request)
    return response.data
  },
}

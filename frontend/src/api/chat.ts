/**
 * Chat API Client
 */

import apiClient from './client'
import type { ChatRequest, ChatResponse } from '@/types/api'

export const chatApi = {
  /**
   * Send a message to AI chatbot
   */
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chat', data)
    return response.data
  },
}

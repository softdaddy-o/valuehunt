/**
 * AI-Powered Chat Service
 * Uses backend API for AI chat (Gemini)
 */

import type { AxiosError } from 'axios'

import { aiApi } from '@/api'
import { getMockChatResponse, getGreetingMessage } from './mockChatService'
import {
  isUserAuthenticated,
  isAIAvailableForUser,
  isAIAvailableForUserSync,
  resetAIAvailabilityCache as resetCache,
} from './aiAvailabilityCache'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/**
 * Get AI chat response via backend API
 * Falls back to mock service if AI is not available
 */
export async function getAIChatResponse(
  userMessage: string,
  conversationHistory?: ChatMessage[]
): Promise<string> {
  if (!isUserAuthenticated()) {
    console.warn('User not authenticated, using mock responses')
    return getMockChatResponse(userMessage)
  }

  try {
    const history =
      conversationHistory
        ?.slice(-6)
        .map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })) || []

    const response = await aiApi.chat({
      message: userMessage,
      context: {
        conversationHistory: history,
      },
    })

    return response.reply
  } catch (error) {
    const axiosError = error as AxiosError
    console.error('AI chat error, falling back to mock:', error)

    if (axiosError.response?.status === 401) {
      return '로그인이 필요합니다. 로그인 후 다시 시도해주세요.'
    }
    if (axiosError.response?.status === 503) {
      return 'AI 서비스가 현재 사용 불가능합니다. 잠시 후 다시 시도해주세요.'
    }

    return getMockChatResponse(userMessage)
  }
}

/**
 * Generate unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get greeting message based on time of day
 */
export { getGreetingMessage }

/**
 * Check if AI is available for chat
 */
export async function isChatAIAvailable(): Promise<boolean> {
  return isAIAvailableForUser()
}

/**
 * Synchronous check (uses cached value)
 */
export function isChatAIAvailableSync(): boolean {
  return isAIAvailableForUserSync()
}

/**
 * Reset AI availability cache (useful after login/logout)
 */
export function resetAIAvailabilityCache(): void {
  resetCache()
}

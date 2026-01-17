/**
 * AI-Powered Chat Service
 * Replaces mock chat service with real AI (Gemini + Claude hybrid)
 */

import { getAIService, isAIServiceAvailable } from './ai'
import { getMockChatResponse, getGreetingMessage } from './mockChatService'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/**
 * Get AI chat response
 * Falls back to mock service if AI is not available
 */
export async function getAIChatResponse(
  userMessage: string,
  conversationHistory?: ChatMessage[]
): Promise<string> {
  // Check if AI service is available
  if (!isAIServiceAvailable()) {
    console.warn('AI service not available, using mock responses')
    return getMockChatResponse(userMessage)
  }

  try {
    const aiService = getAIService()

    // Convert conversation history to expected format
    const history =
      conversationHistory
        ?.slice(-6) // Keep last 6 messages for context (3 exchanges)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        })) || []

    const response = await aiService.chat({
      message: userMessage,
      context: {
        conversationHistory: history,
      },
    })

    return response.reply
  } catch (error) {
    console.error('AI chat error, falling back to mock:', error)
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
export function isChatAIAvailable(): boolean {
  return isAIServiceAvailable()
}

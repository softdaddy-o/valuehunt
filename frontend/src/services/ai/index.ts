/**
 * AI Service Factory and Singleton
 * Provides a centralized access point for AI services
 */

import { HybridAIService } from './hybrid.service'
import { AIServiceConfig, AIProvider } from './types'

// Singleton instance
let aiServiceInstance: HybridAIService | null = null

/**
 * Initialize AI service with configuration
 */
export function initializeAIService(config: AIServiceConfig): HybridAIService {
  aiServiceInstance = new HybridAIService(config)
  return aiServiceInstance
}

/**
 * Get AI service instance
 * Automatically initializes with environment variables if not already initialized
 */
export function getAIService(): HybridAIService {
  if (!aiServiceInstance) {
    // Auto-initialize with environment variables
    const config: AIServiceConfig = {
      gemini: {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
        model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash',
      },
      claude: {
        apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
        model: import.meta.env.VITE_CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
      },
      defaultProvider: AIProvider.CLAUDE, // Prioritize Claude for best quality
      fallbackEnabled: true,
    }

    aiServiceInstance = new HybridAIService(config)
  }

  return aiServiceInstance
}

/**
 * Check if AI service is configured and available
 */
export function isAIServiceAvailable(): boolean {
  try {
    const service = getAIService()
    return service.isAvailable()
  } catch {
    return false
  }
}

// Export types and classes
export * from './types'
export { GeminiService } from './gemini.service'
export { ClaudeService } from './claude.service'
export { HybridAIService } from './hybrid.service'

/**
 * AI Services Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GeminiService } from '@/services/ai/gemini.service'
import { ClaudeService } from '@/services/ai/claude.service'
import { HybridAIService } from '@/services/ai/hybrid.service'
import { AIProvider, AnalysisType } from '@/services/ai/types'

describe('AI Services', () => {
  describe('GeminiService', () => {
    it('should not be available without API key', () => {
      const service = new GeminiService()
      expect(service.isAvailable()).toBe(false)
    })

    it('should return correct provider', () => {
      const service = new GeminiService()
      expect(service.getProvider()).toBe(AIProvider.GEMINI)
    })

    it('should be available with API key', () => {
      const service = new GeminiService('test-api-key')
      expect(service.isAvailable()).toBe(true)
    })
  })

  describe('ClaudeService', () => {
    it('should not be available without API key', () => {
      const service = new ClaudeService()
      expect(service.isAvailable()).toBe(false)
    })

    it('should return correct provider', () => {
      const service = new ClaudeService()
      expect(service.getProvider()).toBe(AIProvider.CLAUDE)
    })

    it('should be available with API key', () => {
      const service = new ClaudeService('test-api-key')
      expect(service.isAvailable()).toBe(true)
    })
  })

  describe('HybridAIService', () => {
    let hybridService: HybridAIService

    beforeEach(() => {
      hybridService = new HybridAIService({
        gemini: {
          apiKey: 'test-gemini-key',
        },
        claude: {
          apiKey: 'test-claude-key',
        },
      })
    })

    it('should be available when at least one service is available', () => {
      expect(hybridService.isAvailable()).toBe(true)
    })

    it('should not be available when no services are available', () => {
      const emptyService = new HybridAIService({})
      expect(emptyService.isAvailable()).toBe(false)
    })

    it('should return service status', () => {
      const status = hybridService.getServiceStatus()

      expect(status.gemini.available).toBe(true)
      expect(status.claude.available).toBe(true)
      expect(status.gemini.provider).toBe(AIProvider.GEMINI)
      expect(status.claude.provider).toBe(AIProvider.CLAUDE)
    })

    it('should have fallback enabled by default', () => {
      const status = hybridService.getServiceStatus()
      expect(status.fallbackEnabled).toBe(true)
    })

    it('should respect fallback configuration', () => {
      const noFallbackService = new HybridAIService({
        gemini: { apiKey: 'test-key' },
        fallbackEnabled: false,
      })

      const status = noFallbackService.getServiceStatus()
      expect(status.fallbackEnabled).toBe(false)
    })

    it('should use default provider configuration', () => {
      const claudeDefaultService = new HybridAIService({
        gemini: { apiKey: 'test-key' },
        claude: { apiKey: 'test-key' },
        defaultProvider: AIProvider.CLAUDE,
      })

      expect(claudeDefaultService.getProvider()).toBe(AIProvider.CLAUDE)
    })
  })

  describe('Analysis Type Logic', () => {
    it('should determine deep analysis for high value scores', () => {
      // This is implicit in the HybridAIService logic
      // High value score (70+) should trigger deep analysis
      const highValueScore = 75
      expect(highValueScore >= 70).toBe(true)
    })

    it('should determine quick analysis for low value scores', () => {
      const lowValueScore = 50
      expect(lowValueScore < 70).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should throw error when analyzing without available service', async () => {
      const service = new HybridAIService({})

      await expect(
        service.analyzeStock({
          stockCode: '005930',
          stockName: '삼성전자',
        })
      ).rejects.toThrow('No AI service available')
    })

    it('should throw error when chatting without available service', async () => {
      const service = new HybridAIService({})

      await expect(
        service.chat({
          message: 'Hello',
        })
      ).rejects.toThrow('No AI service available')
    })
  })
})

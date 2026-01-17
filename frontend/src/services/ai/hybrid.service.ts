/**
 * Hybrid AI Service
 * Intelligently routes requests between Gemini (quick/cheap) and Claude (deep/quality)
 */

import { GeminiService } from './gemini.service'
import { ClaudeService } from './claude.service'
import {
  IAIService,
  StockAnalysisRequest,
  StockAnalysisResponse,
  ChatRequest,
  ChatResponse,
  AnalysisType,
  AIProvider,
  AIServiceConfig,
} from './types'

export class HybridAIService implements IAIService {
  private geminiService: GeminiService
  private claudeService: ClaudeService
  private defaultProvider: AIProvider
  private fallbackEnabled: boolean

  constructor(config: AIServiceConfig) {
    // Initialize services
    this.geminiService = new GeminiService(config.gemini?.apiKey, config.gemini?.model)
    this.claudeService = new ClaudeService(config.claude?.apiKey, config.claude?.model)

    // Set defaults
    this.defaultProvider = config.defaultProvider || AIProvider.GEMINI
    this.fallbackEnabled = config.fallbackEnabled ?? true

    console.log('HybridAIService initialized:', {
      geminiAvailable: this.geminiService.isAvailable(),
      claudeAvailable: this.claudeService.isAvailable(),
      defaultProvider: this.defaultProvider,
    })
  }

  isAvailable(): boolean {
    return this.geminiService.isAvailable() || this.claudeService.isAvailable()
  }

  getProvider(): AIProvider {
    return this.defaultProvider
  }

  /**
   * Analyze stock with smart routing:
   * - Use Claude by default for best quality analysis
   * - Use Gemini as fallback if Claude unavailable
   */
  async analyzeStock(
    request: StockAnalysisRequest,
    analysisType?: AnalysisType
  ): Promise<StockAnalysisResponse> {
    const type = analysisType || this.determineAnalysisType(request)

    let service: IAIService
    let fallbackService: IAIService | null = null

    // Prioritize Claude for all analysis by default
    if (this.defaultProvider === AIProvider.CLAUDE || type === AnalysisType.DEEP) {
      service = this.claudeService
      fallbackService = this.fallbackEnabled ? this.geminiService : null
    } else {
      service = this.geminiService
      fallbackService = this.fallbackEnabled ? this.claudeService : null
    }

    // Ensure service is available
    if (!service.isAvailable()) {
      if (fallbackService && fallbackService.isAvailable()) {
        console.warn(
          `Primary service ${service.getProvider()} not available, using fallback ${fallbackService.getProvider()}`
        )
        service = fallbackService
        fallbackService = null
      } else {
        throw new Error('No AI service available')
      }
    }

    try {
      console.log(`Analyzing stock ${request.stockCode} with ${service.getProvider()}`)
      return await service.analyzeStock(request)
    } catch (error) {
      console.error(`Error with ${service.getProvider()}:`, error)

      // Try fallback if enabled
      if (fallbackService && fallbackService.isAvailable()) {
        console.warn(`Retrying with fallback service ${fallbackService.getProvider()}`)
        try {
          return await fallbackService.analyzeStock(request)
        } catch (fallbackError) {
          console.error(`Fallback service also failed:`, fallbackError)
          throw new Error('All AI services failed')
        }
      }

      throw error
    }
  }

  /**
   * Chat with smart routing:
   * - Use Claude by default for best quality responses
   * - Use Gemini as fallback if Claude unavailable
   */
  async chat(request: ChatRequest, useDeepAnalysis: boolean = false): Promise<ChatResponse> {
    let service: IAIService
    let fallbackService: IAIService | null = null

    // Determine which service to use
    const needsDeep = useDeepAnalysis || this.isComplexChatQuery(request.message)

    // Prioritize Claude for all chat by default
    if (this.defaultProvider === AIProvider.CLAUDE || needsDeep) {
      service = this.claudeService
      fallbackService = this.fallbackEnabled ? this.geminiService : null
    } else {
      service = this.geminiService
      fallbackService = this.fallbackEnabled ? this.claudeService : null
    }

    // Ensure service is available
    if (!service.isAvailable()) {
      if (fallbackService && fallbackService.isAvailable()) {
        console.warn(
          `Primary service ${service.getProvider()} not available, using fallback ${fallbackService.getProvider()}`
        )
        service = fallbackService
        fallbackService = null
      } else {
        throw new Error('No AI service available')
      }
    }

    try {
      console.log(`Chat query with ${service.getProvider()}`)
      return await service.chat(request)
    } catch (error) {
      console.error(`Error with ${service.getProvider()}:`, error)

      // Try fallback if enabled
      if (fallbackService && fallbackService.isAvailable()) {
        console.warn(`Retrying with fallback service ${fallbackService.getProvider()}`)
        try {
          return await fallbackService.chat(request)
        } catch (fallbackError) {
          console.error(`Fallback service also failed:`, fallbackError)
          throw new Error('All AI services failed')
        }
      }

      throw error
    }
  }

  /**
   * Determine analysis type based on request characteristics
   */
  private determineAnalysisType(request: StockAnalysisRequest): AnalysisType {
    // Use deep analysis if:
    // 1. Stock has high value score (70+) - likely a watchlist candidate
    // 2. Request explicitly asks for detailed analysis
    // 3. Stock has complete financial data

    if (request.valueScore && request.valueScore >= 70) {
      return AnalysisType.DEEP
    }

    const hasCompleteData =
      request.metrics?.PER !== null &&
      request.metrics?.PBR !== null &&
      request.metrics?.ROE !== null &&
      request.metrics?.debtRatio !== null

    if (hasCompleteData) {
      return AnalysisType.DEEP
    }

    // Default to quick analysis
    return AnalysisType.QUICK
  }

  /**
   * Determine if chat query needs deep analysis
   */
  private isComplexChatQuery(message: string): boolean {
    const complexKeywords = [
      '분석',
      '비교',
      '추천',
      '전략',
      '포트폴리오',
      '리스크',
      '투자',
      '재무',
      '밸류에이션',
      '펀더멘털',
      '상세',
      '자세히',
    ]

    const lowerMessage = message.toLowerCase()
    return complexKeywords.some((keyword) => lowerMessage.includes(keyword))
  }

  /**
   * Get service statistics
   */
  getServiceStatus() {
    return {
      gemini: {
        available: this.geminiService.isAvailable(),
        provider: this.geminiService.getProvider(),
      },
      claude: {
        available: this.claudeService.isAvailable(),
        provider: this.claudeService.getProvider(),
      },
      defaultProvider: this.defaultProvider,
      fallbackEnabled: this.fallbackEnabled,
    }
  }
}

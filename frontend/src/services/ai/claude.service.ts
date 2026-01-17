/**
 * Anthropic Claude AI Service
 * Uses Claude Sonnet 4.5 for deep, high-quality analysis
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  IAIService,
  StockAnalysisRequest,
  StockAnalysisResponse,
  ChatRequest,
  ChatResponse,
  AIProvider,
} from './types'

export class ClaudeService implements IAIService {
  private client: Anthropic | null = null
  private model: string

  constructor(apiKey?: string, model: string = 'claude-sonnet-4-5-20250929') {
    this.model = model
    if (apiKey) {
      this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
    }
  }

  isAvailable(): boolean {
    return this.client !== null
  }

  getProvider(): AIProvider {
    return AIProvider.CLAUDE
  }

  async analyzeStock(request: StockAnalysisRequest): Promise<StockAnalysisResponse> {
    if (!this.client) {
      throw new Error('Claude API key not configured')
    }

    const prompt = this.buildStockAnalysisPrompt(request)

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const textContent = message.content.find((block) => block.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude')
      }

      return this.parseStockAnalysis(textContent.text)
    } catch (error) {
      console.error('Claude stock analysis error:', error)
      throw new Error('Failed to generate stock analysis')
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('Claude API key not configured')
    }

    const messages = this.buildChatMessages(request)

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        messages,
      })

      const textContent = message.content.find((block) => block.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude')
      }

      return {
        reply: textContent.text,
        relatedStocks: this.extractStockMentions(textContent.text),
      }
    } catch (error) {
      console.error('Claude chat error:', error)
      throw new Error('Failed to generate chat response')
    }
  }

  private buildStockAnalysisPrompt(request: StockAnalysisRequest): string {
    const { stockCode, stockName, sector, currentPrice, metrics, valueScore, marketCap } =
      request

    return `당신은 한국 주식 시장의 전문 애널리스트입니다. 깊이 있고 통찰력 있는 투자 분석을 제공해주세요.

종목 정보:
- 종목명: ${stockName} (${stockCode})
- 섹터: ${sector || 'N/A'}
- 시가총액: ${marketCap ? `${(marketCap / 100000000).toFixed(0)}억원` : 'N/A'}
- 현재가: ${currentPrice?.toLocaleString() || 'N/A'}원
- Value Score: ${valueScore || 'N/A'}

재무 지표:
- PER (주가수익비율): ${metrics?.PER || 'N/A'}
- PBR (주가순자산비율): ${metrics?.PBR || 'N/A'}
- ROE (자기자본이익률): ${metrics?.ROE || 'N/A'}%
- ROA (총자산이익률): ${metrics?.ROA || 'N/A'}%
- 부채비율: ${metrics?.debtRatio || 'N/A'}%
- 배당수익률: ${metrics?.dividendYield || 'N/A'}%

다음 형식으로 상세한 JSON 분석을 제공해주세요:
{
  "summary": "종목에 대한 종합적인 요약 (3-4문장, 업종 특성과 재무 상태를 포함)",
  "strengths": [
    "구체적인 강점 1 (재무 지표 기반)",
    "구체적인 강점 2 (사업 경쟁력)",
    "구체적인 강점 3 (성장 가능성)",
    "구체적인 강점 4 (배당 또는 밸류에이션)"
  ],
  "risks": [
    "구체적인 리스크 1 (재무적 위험)",
    "구체적인 리스크 2 (사업 리스크)",
    "구체적인 리스크 3 (시장 환경)",
    "구체적인 리스크 4 (밸류에이션 또는 유동성)"
  ],
  "investmentThesis": "투자 의견 및 전략 (3-4문장, Value Score를 고려한 종합 의견)",
  "targetPriceRange": "적정 주가 밴드 (예: '현재가 대비 10-15% 상승 여력' 또는 '현재 밸류에이션 적정')"
}

분석 시 고려사항:
1. Value Score는 70점 이상이면 우량 저평가주, 50-70점은 관심 종목입니다
2. PER/PBR이 낮을수록 저평가, ROE가 높을수록 수익성이 우수합니다
3. 부채비율이 100% 이하면 안정적이며, 배당수익률 3% 이상이면 매력적입니다
4. 업종별 특성을 고려하여 분석해주세요

JSON만 출력하고 다른 텍스트는 포함하지 마세요.`
  }

  private buildChatMessages(
    request: ChatRequest
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []

    // Add conversation history if available
    if (request.context?.conversationHistory && request.context.conversationHistory.length > 0) {
      messages.push(...request.context.conversationHistory)
    }

    // Build system context
    let userMessage = `당신은 ValueHunt의 AI 투자 어시스턴트입니다. 한국 주식 시장의 저평가 우량주를 찾고 투자 전략을 세우는 데 도움을 드립니다.

특징:
- Value Score 기반 종목 추천 시스템 활용
- 재무 지표(PER, PBR, ROE 등)를 통한 정량적 분석
- 업종별 특성을 고려한 정성적 분석
- 리스크 관리 및 포트폴리오 다각화 중시

사용자 질문: ${request.message}`

    if (request.context?.stockCode) {
      userMessage += `\n\n관련 종목: ${request.context.stockCode}`
    }

    messages.push({
      role: 'user',
      content: userMessage,
    })

    return messages
  }

  private parseStockAnalysis(text: string): StockAnalysisResponse {
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanText)

      return {
        summary: parsed.summary || '',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        investmentThesis: parsed.investmentThesis,
        targetPriceRange: parsed.targetPriceRange,
      }
    } catch (error) {
      console.error('Failed to parse Claude response:', error)

      // Fallback: try to extract information manually
      return {
        summary: text.substring(0, 300) + '...',
        strengths: ['상세 분석 처리 중'],
        risks: ['상세 분석 처리 중'],
        investmentThesis: '종합적인 분석이 필요합니다.',
      }
    }
  }

  private extractStockMentions(text: string): string[] {
    // Pattern matching for Korean stock codes (e.g., 005930)
    const codePattern = /\b\d{6}\b/g
    const matches = text.match(codePattern)
    return matches ? [...new Set(matches)] : []
  }
}

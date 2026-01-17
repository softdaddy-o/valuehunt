/**
 * Google Gemini AI Service
 * Uses Gemini 2.5 Flash for quick, cost-effective analysis
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  IAIService,
  StockAnalysisRequest,
  StockAnalysisResponse,
  ChatRequest,
  ChatResponse,
  AIProvider,
} from './types'

export class GeminiService implements IAIService {
  private client: GoogleGenerativeAI | null = null
  private model: string

  constructor(apiKey?: string, model: string = 'gemini-2.5-flash') {
    this.model = model
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey)
    }
  }

  isAvailable(): boolean {
    return this.client !== null
  }

  getProvider(): AIProvider {
    return AIProvider.GEMINI
  }

  async analyzeStock(request: StockAnalysisRequest): Promise<StockAnalysisResponse> {
    if (!this.client) {
      throw new Error('Gemini API key not configured')
    }

    const model = this.client.getGenerativeModel({ model: this.model })

    const prompt = this.buildStockAnalysisPrompt(request)

    try {
      const result = await model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      return this.parseStockAnalysis(text)
    } catch (error) {
      console.error('Gemini stock analysis error:', error)
      throw new Error('Failed to generate stock analysis')
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('Gemini API key not configured')
    }

    const model = this.client.getGenerativeModel({ model: this.model })

    const prompt = this.buildChatPrompt(request)

    try {
      const result = await model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      return {
        reply: text,
        relatedStocks: this.extractStockMentions(text),
      }
    } catch (error) {
      console.error('Gemini chat error:', error)
      throw new Error('Failed to generate chat response')
    }
  }

  private buildStockAnalysisPrompt(request: StockAnalysisRequest): string {
    const { stockCode, stockName, sector, currentPrice, metrics, valueScore } = request

    return `당신은 한국 주식 시장 전문 애널리스트입니다. 다음 종목에 대한 간결하고 명확한 투자 분석을 제공해주세요.

종목 정보:
- 종목명: ${stockName} (${stockCode})
- 섹터: ${sector || 'N/A'}
- 현재가: ${currentPrice?.toLocaleString() || 'N/A'}원
- Value Score: ${valueScore || 'N/A'}

재무 지표:
- PER: ${metrics?.PER || 'N/A'}
- PBR: ${metrics?.PBR || 'N/A'}
- ROE: ${metrics?.ROE || 'N/A'}%
- 부채비율: ${metrics?.debtRatio || 'N/A'}%
- 배당수익률: ${metrics?.dividendYield || 'N/A'}%

다음 형식으로 JSON 응답을 제공해주세요:
{
  "summary": "2-3문장으로 된 종목 요약",
  "strengths": ["강점1", "강점2", "강점3"],
  "risks": ["리스크1", "리스크2", "리스크3"],
  "investmentThesis": "투자 의견 (1-2문장)"
}

JSON만 출력하고 다른 텍스트는 포함하지 마세요.`
  }

  private buildChatPrompt(request: ChatRequest): string {
    const { message, context } = request

    let prompt = `당신은 ValueHunt의 AI 투자 어시스턴트입니다. 한국 주식 시장의 저평가 우량주를 찾고 투자 전략을 세우는 데 도움을 드립니다.

사용자 질문: ${message}`

    if (context?.stockCode) {
      prompt += `\n\n관련 종목: ${context.stockCode}`
    }

    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      prompt += '\n\n이전 대화 내용:\n'
      context.conversationHistory.forEach((msg) => {
        prompt += `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}\n`
      })
    }

    prompt += `\n\n친절하고 전문적인 어조로 답변해주세요. 구체적인 투자 조언보다는 정보 제공과 교육에 초점을 맞춰주세요.`

    return prompt
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
      }
    } catch (error) {
      console.error('Failed to parse Gemini response:', error)

      // Fallback: try to extract information manually
      return {
        summary: text.substring(0, 200) + '...',
        strengths: ['분석 데이터 처리 중'],
        risks: ['분석 데이터 처리 중'],
        investmentThesis: '상세 분석이 필요합니다.',
      }
    }
  }

  private extractStockMentions(text: string): string[] {
    // Simple pattern matching for Korean stock codes (e.g., 005930)
    const codePattern = /\b\d{6}\b/g
    const matches = text.match(codePattern)
    return matches ? [...new Set(matches)] : []
  }
}

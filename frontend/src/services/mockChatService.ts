/**
 * Mock Chat Service
 * Simulates AI chat responses without requiring actual API keys
 * This provides a working demo of the chat functionality
 */

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Mock responses based on keywords
const mockResponses: Record<string, string> = {
  '삼성전자': `삼성전자는 한국을 대표하는 글로벌 전자 기업입니다.

주요 특징:
- 반도체, 디스플레이, 스마트폰 등 다양한 사업 포트폴리오
- 메모리 반도체 세계 1위 기업
- 안정적인 배당 정책

투자 포인트:
✓ 강력한 시장 지배력
✓ 우수한 기술력과 브랜드 가치
✓ 안정적인 현금흐름

리스크:
⚠️ 반도체 업황 사이클
⚠️ 중국 경쟁사 부상
⚠️ 환율 변동성

현재 Value Score를 확인하시면 더 자세한 분석을 보실 수 있습니다.`,

  'sk하이닉스': `SK하이닉스는 메모리 반도체 전문 기업으로 세계 2위 규모입니다.

강점:
- DRAM과 NAND Flash 양방향 포트폴리오
- 높은 수익성과 기술력
- AI/서버 시장 성장 수혜

투자 관점:
✓ 메모리 반도체 업황 회복 기대감
✓ DDR5, HBM 등 신제품 수요 증가
✓ 우수한 재무구조

주의사항:
⚠️ 업황 사이클에 민감
⚠️ 설비투자 부담`,

  'portfolio': `포트폴리오 분석을 도와드리겠습니다.

효과적인 포트폴리오 구성 원칙:
1. 분산 투자 - 최소 5-10개 종목
2. 섹터 다각화 - 특정 업종 집중 피하기
3. Value Score 활용 - 70점 이상 종목 중심
4. 리밸런싱 - 분기별 1회 권장

추천 포트폴리오 구성:
- IT/반도체: 30-40%
- 금융: 20-30%
- 소비재: 15-20%
- 기타: 10-15%

관심종목 페이지에서 종목을 추가하고 모니터링해보세요!`,

  'value score': `Value Score는 종목의 투자 가치를 0-100점으로 평가한 지표입니다.

구성 (총 100점):
• 밸류에이션 (40점): PER, PBR 평가
• 수익성 (30점): ROE, 영업이익률
• 안정성 (20점): 부채비율, 유동비율
• 배당 (10점): 배당수익률, 연속배당

해석:
🟢 70점 이상: 우량 저평가주
🟡 50-70점: 관심 종목
🔴 50점 미만: 주의 필요

Top Picks에서 Value Score 상위 종목을 확인해보세요!`,

  '배당': `배당 투자 전략에 대해 설명드리겠습니다.

배당주 선택 기준:
1. 배당수익률 3% 이상
2. 연속 배당 5년 이상
3. 배당성향 30-50% (지속가능성)
4. 안정적인 이익 창출 능력

배당 투자의 장점:
✓ 안정적인 현금 수익
✓ 장기 투자에 유리
✓ 하락장 방어력

주의사항:
⚠️ 배당락 시점 확인
⚠️ 배당 정책 변경 가능성
⚠️ 배당수익률만 보지 말고 기업 펀더멘털도 확인

스크리너에서 배당수익률 필터를 활용해보세요!`,

  '위험': `투자 리스크 관리는 매우 중요합니다.

주요 리스크 요소:
1. 시장 리스크 - 전반적인 시장 하락
2. 종목 리스크 - 개별 기업의 실적 악화
3. 섹터 리스크 - 업종 전체 부진
4. 유동성 리스크 - 거래량 부족

리스크 관리 방법:
🛡️ 분산 투자
🛡️ 손절매 기준 설정 (예: -10%)
🛡️ 포지션 사이즈 관리
🛡️ 정기적인 포트폴리오 리뷰

Value Score의 안정성 점수를 참고하여 안전한 종목을 선택하세요.`,

  default: `안녕하세요! ValueHunt AI 어시스턴트입니다.

다음과 같은 질문을 도와드릴 수 있습니다:

📊 종목 분석
- "삼성전자 분석해줘"
- "SK하이닉스 투자 의견은?"

💼 포트폴리오 전략
- "포트폴리오 구성 방법 알려줘"
- "분산 투자 방법은?"

📈 투자 지표
- "Value Score란 무엇인가요?"
- "PER과 PBR 차이는?"

💰 배당 투자
- "배당주 추천해줘"
- "배당 투자 전략은?"

❓ 리스크 관리
- "투자 위험 관리 방법은?"

구체적인 질문을 해주시면 더 자세히 답변드리겠습니다!`,
}

/**
 * Get mock chat response based on user message
 */
export async function getMockChatResponse(userMessage: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

  const lowerMessage = userMessage.toLowerCase()

  // Check for keywords and return appropriate response
  for (const [keyword, response] of Object.entries(mockResponses)) {
    if (lowerMessage.includes(keyword)) {
      return response
    }
  }

  // Default response
  return mockResponses.default
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
export function getGreetingMessage(): string {
  const hour = new Date().getHours()

  let greeting = '안녕하세요'
  if (hour < 12) {
    greeting = '좋은 아침입니다'
  } else if (hour < 18) {
    greeting = '좋은 오후입니다'
  } else {
    greeting = '좋은 저녁입니다'
  }

  return `${greeting}! ValueHunt AI 어시스턴트입니다. 🤖

저는 한국 주식 시장의 저평가 우량주를 찾고 투자 전략을 세우는 데 도움을 드립니다.

무엇을 도와드릴까요?`
}

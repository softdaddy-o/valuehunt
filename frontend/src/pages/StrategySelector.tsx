/**
 * StrategySelector Page
 * Display available AI stock trading strategies
 */

import { StrategyCard } from '@/components/strategy/StrategyCard'
import { StrategyType } from '@/services/ai/types'
import { LevelType } from '@/utils/styles'

interface StrategyConfig {
  strategyType: StrategyType
  title: string
  description: string
  icon: string
  complexity: LevelType
  enabled: boolean
}

const STRATEGIES: StrategyConfig[] = [
  {
    strategyType: StrategyType.UNDERVALUED_SCREENER,
    title: '저평가 우량주 발굴',
    description:
      'PER/PBR이 낮고 재무가 건전한 저평가 종목 10개를 자동으로 발굴합니다. 가치투자 전략에 적합합니다.',
    icon: '💎',
    complexity: 'low',
    enabled: true,
  },
  {
    strategyType: StrategyType.FEAR_DRIVEN_QUALITY,
    title: '공포에 팔린 우량주',
    description:
      '단기 악재로 과매도된 우량주를 발굴합니다. 역발상 투자 기회를 포착하는 전략입니다.',
    icon: '😱',
    complexity: 'medium',
    enabled: true,
  },
  {
    strategyType: StrategyType.DIVIDEND_ANALYZER,
    title: '장기 배당주 분석',
    description:
      '10년 이상 꾸준한 배당 이력이 있는 종목을 찾습니다. 은퇴 자금 및 안정적 소득 투자에 적합합니다.',
    icon: '💰',
    complexity: 'low',
    enabled: true,
  },
  {
    strategyType: StrategyType.INSIDER_TRADING,
    title: '내부자 매수 패턴',
    description:
      '임원 및 대주주의 지속적인 자사주 매수 패턴을 분석합니다. 강한 매수 신호를 포착합니다.',
    icon: '👔',
    complexity: 'medium',
    enabled: true,
  },
  {
    strategyType: StrategyType.THEME_VS_REAL,
    title: '테마주 vs 실적주',
    description:
      'AI, 배터리, 반도체 등 인기 테마에서 실제 실적이 뒷받침되는 종목을 구분합니다.',
    icon: '🎯',
    complexity: 'medium',
    enabled: true,
  },
  {
    strategyType: StrategyType.SECTOR_ROTATION,
    title: '섹터 로테이션',
    description:
      '금리, 물가, 경기 지표를 바탕으로 향후 6-12개월 유망 섹터를 예측합니다.',
    icon: '🔄',
    complexity: 'high',
    enabled: true,
  },
  {
    strategyType: StrategyType.HIDDEN_GROWTH,
    title: '숨은 성장주 발굴',
    description:
      '시가총액이 작지만 높은 성장성을 가진 기업을 발굴합니다. 기관 유입 전 선점 기회를 제공합니다.',
    icon: '🚀',
    complexity: 'high',
    enabled: true,
  },
  {
    strategyType: StrategyType.PORTFOLIO_DESIGNER,
    title: '맞춤형 포트폴리오',
    description:
      '투자 성향과 목표에 맞는 개인화된 포트폴리오를 설계합니다. 리밸런싱 전략도 함께 제공합니다.',
    icon: '📊',
    complexity: 'medium',
    enabled: true,
  },
]

export function StrategySelector(): JSX.Element {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          AI 투자 전략
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          GROK 스타일 AI 분석 전략으로 투자 기회를 발굴하세요
        </p>
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {STRATEGIES.map((strategy) => (
          <StrategyCard key={strategy.strategyType} {...strategy} />
        ))}
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>안내:</strong> AI 기반 분석 결과는 참고 자료이며, 투자 권유가 아닙니다.
          모든 투자 판단과 책임은 투자자 본인에게 있습니다.
        </p>
      </div>
    </div>
  )
}

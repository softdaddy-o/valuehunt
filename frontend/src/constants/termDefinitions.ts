export interface TermDefinition {
  label: string
  brief: string
  detail?: string
}

export const TERM_DEFINITIONS: Record<string, TermDefinition> = {
  // Valuation Metrics
  PER: {
    label: 'PER (주가수익비율)',
    brief: '주가를 주당순이익(EPS)으로 나눈 값입니다.',
    detail: '낮을수록 이익 대비 주가가 저평가되어 있다고 볼 수 있습니다. 업종 평균과 비교하여 판단하는 것이 좋습니다.',
  },
  PBR: {
    label: 'PBR (주가순자산비율)',
    brief: '주가를 주당순자산으로 나눈 값입니다.',
    detail: '1 미만이면 주가가 순자산보다 낮게 평가되어 있음을 의미합니다. 자산가치 대비 저평가 여부를 판단하는 지표입니다.',
  },

  // Profitability Metrics
  ROE: {
    label: 'ROE (자기자본이익률)',
    brief: '순이익을 자기자본으로 나눈 값입니다.',
    detail: '투자한 자본 대비 얼마나 효율적으로 이익을 창출하는지 보여줍니다. 일반적으로 10% 이상이면 우수한 수준입니다.',
  },
  ROA: {
    label: 'ROA (총자산이익률)',
    brief: '순이익을 총자산으로 나눈 값입니다.',
    detail: '기업이 보유한 전체 자산을 얼마나 효율적으로 활용하는지 보여줍니다. 높을수록 자산 활용 효율이 좋습니다.',
  },

  // Stability Metrics
  부채비율: {
    label: '부채비율',
    brief: '부채를 자기자본으로 나눈 값입니다.',
    detail: '낮을수록 재무구조가 안정적입니다. 일반적으로 100% 이하면 안정적, 200% 이상이면 주의가 필요합니다.',
  },
  유동비율: {
    label: '유동비율',
    brief: '유동자산을 유동부채로 나눈 값입니다.',
    detail: '단기 채무 상환 능력을 나타냅니다. 100% 이상이면 단기적으로 안정적인 재무상태를 의미합니다.',
  },

  // Dividend Metrics
  배당수익률: {
    label: '배당수익률',
    brief: '주당배당금을 주가로 나눈 값입니다.',
    detail: '투자금액 대비 받을 수 있는 배당금의 비율입니다. 높을수록 배당 매력이 높지만, 지속가능성도 함께 고려해야 합니다.',
  },

  // Other Metrics
  시가총액: {
    label: '시가총액',
    brief: '발행주식수에 현재 주가를 곱한 값입니다.',
    detail: '기업의 시장가치를 나타내며, 대형주/중형주/소형주 분류의 기준이 됩니다.',
  },

  // Category Scores
  밸류: {
    label: '밸류 (가치평가)',
    brief: 'PER, PBR 등 가치평가 지표 기반 점수입니다.',
    detail: '주가가 기업의 실질 가치 대비 저평가되어 있는지 평가합니다. 최대 40점입니다.',
  },
  수익성: {
    label: '수익성',
    brief: 'ROE, ROA 등 수익성 지표 기반 점수입니다.',
    detail: '기업이 얼마나 효율적으로 이익을 창출하는지 평가합니다. 최대 30점입니다.',
  },
  안정성: {
    label: '안정성',
    brief: '부채비율, 유동비율 등 재무안정성 지표 기반 점수입니다.',
    detail: '기업의 재무구조가 얼마나 건전한지 평가합니다. 최대 20점입니다.',
  },
  배당: {
    label: '배당',
    brief: '배당수익률, 배당성향 등 배당 지표 기반 점수입니다.',
    detail: '주주에게 얼마나 많은 이익을 환원하는지 평가합니다. 최대 10점입니다.',
  },

  // Value Score
  'Value Score': {
    label: 'Value Score (밸류 스코어)',
    brief: 'ValueHunt의 종합 투자 매력도 점수입니다.',
    detail: '밸류(40점), 수익성(30점), 안정성(20점), 배당(10점)을 합산한 100점 만점의 점수입니다. 높을수록 투자 매력이 높습니다.',
  },
  총점: {
    label: 'Value Score (총점)',
    brief: 'ValueHunt의 종합 투자 매력도 점수입니다.',
    detail: '밸류(40점), 수익성(30점), 안정성(20점), 배당(10점)을 합산한 100점 만점의 점수입니다.',
  },
  밸류에이션: {
    label: '밸류에이션 (가치평가)',
    brief: 'PER, PBR 등 가치평가 지표 기반 점수입니다.',
    detail: '주가가 기업의 실질 가치 대비 저평가되어 있는지 평가합니다. 최대 40점입니다.',
  },

  // Insider Trading
  내부자거래: {
    label: '내부자 거래',
    brief: '회사의 임원, 주요주주 등 내부 정보에 접근할 수 있는 자들의 주식 매매 활동입니다.',
    detail: '내부자의 매수가 많으면 회사 전망에 대한 긍정적 신호로, 매도가 많으면 부정적 신호로 해석될 수 있습니다. 단, 스톡옵션 행사나 세금 납부 등의 이유로 매도하는 경우도 있으므로 맥락을 함께 고려해야 합니다.',
  },
}

export function getTermDefinition(term: string): TermDefinition | undefined {
  return TERM_DEFINITIONS[term]
}

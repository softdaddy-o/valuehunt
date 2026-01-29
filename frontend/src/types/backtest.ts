/**
 * TypeScript types for backtesting functionality
 */

export enum BacktestStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface BacktestRecommendation {
  id: number;
  backtest_run_id: number;
  stock_code: string;
  stock_name: string;
  recommendation_rank: number;
  value_score?: number;
  ai_upside_potential_pct?: number;
  ai_confidence?: number;
  ai_rationale?: string;
  price_at_recommendation: number;
  per_at_recommendation?: number;
  pbr_at_recommendation?: number;
  roe_at_recommendation?: number;
  debt_ratio_at_recommendation?: number;
  market_cap_at_recommendation?: number;
  price_after_holding?: number;
  actual_return_pct?: number;
  exceeded_prediction?: number;
  max_price_during_holding?: number;
  min_price_during_holding?: number;
  max_return_pct?: number;
  max_drawdown_pct?: number;
  sector?: string;
  notes?: string;
}

export interface BacktestRun {
  id: number;
  name: string;
  strategy_type?: string;
  market: string;
  simulation_date: string;
  lookback_years: number;
  holding_period_months: number;
  status: BacktestStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  total_recommendations?: number;
  avg_return_pct?: number;
  median_return_pct?: number;
  win_rate_pct?: number;
  best_return_pct?: number;
  worst_return_pct?: number;
  market_index_return_pct?: number;
  alpha_pct?: number;
  volatility_pct?: number;
  sharpe_ratio?: number;
  max_drawdown_pct?: number;
  recommendations?: BacktestRecommendation[];
}

export interface BacktestRunSummary {
  id: number;
  name: string;
  strategy_type?: string;
  market: string;
  simulation_date: string;
  lookback_years: number;
  holding_period_months: number;
  status: BacktestStatus;
  created_at: string;
  completed_at?: string;
  total_recommendations?: number;
  avg_return_pct?: number;
  win_rate_pct?: number;
  market_index_return_pct?: number;
  alpha_pct?: number;
  sharpe_ratio?: number;
}

export interface BacktestCreateRequest {
  name: string;
  strategy_type?: string;
  market: string;
  start_date: string;
  end_date: string;
  lookback_years: number;
  holding_period_months: number;
  frequency: string;
}

export interface StrategyComparison {
  strategies: {
    [key: string]: {
      total_runs: number;
      avg_return: number | null;
      avg_win_rate: number | null;
      avg_sharpe_ratio: number | null;
      avg_alpha: number | null;
    };
  };
  best_by_return: {
    strategy: string;
    avg_return_pct: number;
  };
  best_by_sharpe: {
    strategy: string;
    sharpe_ratio: number;
  };
  best_by_winrate: {
    strategy: string;
    win_rate_pct: number;
  };
  total_backtests: number;
}

export interface BacktestPatterns {
  sector_performance: {
    [sector: string]: {
      avg_return_pct: number;
      total_stocks: number;
      win_rate_pct: number;
      best_return_pct: number;
      worst_return_pct: number;
    };
  };
  value_score_performance: {
    [range: string]: {
      avg_return_pct: number;
      count: number;
      win_rate_pct: number;
    };
  };
  top_performers: Array<{
    stock_code: string;
    stock_name: string;
    return_pct: number;
    value_score?: number;
    sector?: string;
  }>;
  bottom_performers: Array<{
    stock_code: string;
    stock_name: string;
    return_pct: number;
    value_score?: number;
    sector?: string;
  }>;
  prediction_accuracy: {
    total_with_predictions: number;
    exceeded_count: number;
    missed_count: number;
    exceeded_rate_pct?: number;
  };
}

export interface TimeSeriesData {
  time_series: Array<{
    date: string;
    name: string;
    avg_return_pct?: number;
    win_rate_pct?: number;
    sharpe_ratio?: number;
    market_return_pct?: number;
    alpha_pct?: number;
    total_recommendations?: number;
  }>;
  total_backtests: number;
}

export interface BacktestSummaryStats {
  total_backtests: number;
  overall_avg_return_pct?: number;
  overall_avg_win_rate_pct?: number;
  overall_avg_sharpe_ratio?: number;
  overall_avg_alpha_pct?: number;
  best_backtest: {
    name: string;
    return_pct?: number;
  };
  status_distribution: {
    [status: string]: number;
  };
  strategy_distribution: {
    [strategy: string]: number;
  };
}

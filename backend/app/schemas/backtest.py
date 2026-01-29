"""
Pydantic schemas for backtesting endpoints.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.backtest import BacktestStatus


class BacktestRecommendationBase(BaseModel):
    """Base schema for backtest recommendation."""

    stock_code: str
    stock_name: str
    recommendation_rank: int
    value_score: Optional[float] = None
    ai_upside_potential_pct: Optional[float] = None
    ai_confidence: Optional[float] = None
    ai_rationale: Optional[str] = None
    price_at_recommendation: float
    per_at_recommendation: Optional[float] = None
    pbr_at_recommendation: Optional[float] = None
    roe_at_recommendation: Optional[float] = None
    debt_ratio_at_recommendation: Optional[float] = None
    market_cap_at_recommendation: Optional[float] = None
    sector: Optional[str] = None


class BacktestRecommendationCreate(BacktestRecommendationBase):
    """Schema for creating a backtest recommendation."""

    backtest_run_id: int


class BacktestRecommendationUpdate(BaseModel):
    """Schema for updating backtest recommendation with actual performance."""

    price_after_holding: Optional[float] = None
    actual_return_pct: Optional[float] = None
    exceeded_prediction: Optional[float] = None
    max_price_during_holding: Optional[float] = None
    min_price_during_holding: Optional[float] = None
    max_return_pct: Optional[float] = None
    max_drawdown_pct: Optional[float] = None
    notes: Optional[str] = None


class BacktestRecommendation(BacktestRecommendationBase):
    """Schema for backtest recommendation response."""

    id: int
    backtest_run_id: int
    price_after_holding: Optional[float] = None
    actual_return_pct: Optional[float] = None
    exceeded_prediction: Optional[float] = None
    max_price_during_holding: Optional[float] = None
    min_price_during_holding: Optional[float] = None
    max_return_pct: Optional[float] = None
    max_drawdown_pct: Optional[float] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class BacktestRunBase(BaseModel):
    """Base schema for backtest run."""

    name: str
    strategy_type: Optional[str] = None
    market: str = Field(default="ALL", description="KOSPI, KOSDAQ, or ALL")
    simulation_date: datetime
    lookback_years: int = Field(default=5, description="5 or 10 years")
    holding_period_months: int = Field(default=12, description="How long to hold stocks")


class BacktestRunCreate(BacktestRunBase):
    """Schema for creating a backtest run."""

    pass


class BacktestRunUpdate(BaseModel):
    """Schema for updating backtest run with results."""

    status: Optional[BacktestStatus] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    total_recommendations: Optional[int] = None
    avg_return_pct: Optional[float] = None
    median_return_pct: Optional[float] = None
    win_rate_pct: Optional[float] = None
    best_return_pct: Optional[float] = None
    worst_return_pct: Optional[float] = None
    market_index_return_pct: Optional[float] = None
    alpha_pct: Optional[float] = None
    volatility_pct: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    max_drawdown_pct: Optional[float] = None


class BacktestRun(BacktestRunBase):
    """Schema for backtest run response."""

    id: int
    status: BacktestStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    total_recommendations: Optional[int] = None
    avg_return_pct: Optional[float] = None
    median_return_pct: Optional[float] = None
    win_rate_pct: Optional[float] = None
    best_return_pct: Optional[float] = None
    worst_return_pct: Optional[float] = None
    market_index_return_pct: Optional[float] = None
    alpha_pct: Optional[float] = None
    volatility_pct: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    max_drawdown_pct: Optional[float] = None
    recommendations: List[BacktestRecommendation] = []

    class Config:
        from_attributes = True


class BacktestRunSummary(BaseModel):
    """Summary schema for backtest run (without full recommendations list)."""

    id: int
    name: str
    strategy_type: Optional[str] = None
    market: str
    simulation_date: datetime
    lookback_years: int
    holding_period_months: int
    status: BacktestStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    total_recommendations: Optional[int] = None
    avg_return_pct: Optional[float] = None
    win_rate_pct: Optional[float] = None
    market_index_return_pct: Optional[float] = None
    alpha_pct: Optional[float] = None
    sharpe_ratio: Optional[float] = None

    class Config:
        from_attributes = True


class BacktestScheduleBase(BaseModel):
    """Base schema for backtest schedule."""

    name: str
    strategy_type: Optional[str] = None
    market: str = Field(default="ALL")
    lookback_years: int = Field(default=5)
    frequency: str = Field(default="monthly", description="monthly, quarterly, or yearly")


class BacktestScheduleCreate(BacktestScheduleBase):
    """Schema for creating a backtest schedule."""

    is_active: bool = True


class BacktestScheduleUpdate(BaseModel):
    """Schema for updating a backtest schedule."""

    is_active: Optional[bool] = None
    last_run_date: Optional[datetime] = None
    next_run_date: Optional[datetime] = None


class BacktestSchedule(BacktestScheduleBase):
    """Schema for backtest schedule response."""

    id: int
    is_active: bool
    last_run_date: Optional[datetime] = None
    next_run_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HistoricalStockPriceBase(BaseModel):
    """Base schema for historical stock price."""

    stock_code: str
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int


class HistoricalStockPriceCreate(HistoricalStockPriceBase):
    """Schema for creating historical stock price."""

    pass


class HistoricalStockPrice(HistoricalStockPriceBase):
    """Schema for historical stock price response."""

    id: int

    class Config:
        from_attributes = True


class HistoricalFinancialMetricsBase(BaseModel):
    """Base schema for historical financial metrics."""

    stock_code: str
    snapshot_date: datetime
    report_date: datetime
    per: Optional[float] = None
    pbr: Optional[float] = None
    psr: Optional[float] = None
    ev_ebitda: Optional[float] = None
    roe: Optional[float] = None
    roa: Optional[float] = None
    operating_margin: Optional[float] = None
    net_profit_growth: Optional[float] = None
    debt_ratio: Optional[float] = None
    current_ratio: Optional[float] = None
    interest_coverage: Optional[float] = None
    operating_cash_flow: Optional[float] = None
    dividend_yield: Optional[float] = None
    dividend_payout_ratio: Optional[float] = None
    consecutive_dividend_years: Optional[int] = None
    market_cap: Optional[float] = None


class HistoricalFinancialMetricsCreate(HistoricalFinancialMetricsBase):
    """Schema for creating historical financial metrics."""

    pass


class HistoricalFinancialMetrics(HistoricalFinancialMetricsBase):
    """Schema for historical financial metrics response."""

    id: int

    class Config:
        from_attributes = True


class BacktestPerformanceComparison(BaseModel):
    """Comparison of multiple backtest runs."""

    runs: List[BacktestRunSummary]
    best_strategy: Optional[str] = None
    best_avg_return: Optional[float] = None
    best_sharpe_ratio: Optional[float] = None
    best_win_rate: Optional[float] = None


class BacktestCreateRequest(BaseModel):
    """Request to create and execute a new backtest."""

    name: str
    strategy_type: Optional[str] = None
    market: str = "ALL"
    start_date: datetime = Field(description="Start date for backtesting period")
    end_date: datetime = Field(description="End date for backtesting period")
    lookback_years: int = Field(default=5, ge=1, le=10)
    holding_period_months: int = Field(default=12, ge=1, le=60)
    frequency: str = Field(default="monthly", description="monthly, quarterly, or yearly")

"""
Backtesting models for AI stock recommendation algorithm validation.
"""
import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum as SQLEnum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class BacktestStatus(str, enum.Enum):
    """Status of a backtest run."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class BacktestRun(Base):
    """
    Represents a backtesting simulation run.
    Each run simulates running the AI algorithm at a specific point in the past.
    """
    __tablename__ = "backtest_runs"

    id = Column(Integer, primary_key=True, index=True)

    # Backtest configuration
    name = Column(String, nullable=False)  # User-friendly name for the backtest
    strategy_type = Column(String, nullable=True)  # AI strategy type (null for Value Score only)
    market = Column(String, nullable=False)  # KOSPI/KOSDAQ/ALL

    # Time period configuration
    simulation_date = Column(DateTime, nullable=False)  # The historical date when we "ran" the algorithm
    lookback_years = Column(Integer, nullable=False)  # How many years of data to use (5 or 10)
    holding_period_months = Column(Integer, nullable=False, default=12)  # How long to "hold" before measuring performance

    # Execution metadata
    status = Column(SQLEnum(BacktestStatus), nullable=False, default=BacktestStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(String, nullable=True)

    # Performance summary (calculated after holding period)
    total_recommendations = Column(Integer, nullable=True)
    avg_return_pct = Column(Float, nullable=True)  # Average return across all recommendations
    median_return_pct = Column(Float, nullable=True)
    win_rate_pct = Column(Float, nullable=True)  # % of stocks with positive returns
    best_return_pct = Column(Float, nullable=True)
    worst_return_pct = Column(Float, nullable=True)

    # Market comparison
    market_index_return_pct = Column(Float, nullable=True)  # KOSPI or KOSDAQ return during same period
    alpha_pct = Column(Float, nullable=True)  # Excess return vs market (avg_return - market_return)

    # Risk metrics
    volatility_pct = Column(Float, nullable=True)  # Standard deviation of returns
    sharpe_ratio = Column(Float, nullable=True)  # (avg_return - risk_free_rate) / volatility
    max_drawdown_pct = Column(Float, nullable=True)  # Maximum peak-to-trough decline

    # Relationships
    recommendations = relationship("BacktestRecommendation", back_populates="backtest_run", cascade="all, delete-orphan")


class BacktestRecommendation(Base):
    """
    Individual stock recommendation from a backtest run.
    Tracks the AI's recommendation at simulation_date and the actual performance.
    """
    __tablename__ = "backtest_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    backtest_run_id = Column(Integer, ForeignKey("backtest_runs.id"), nullable=False)

    # Stock identification
    stock_code = Column(String, ForeignKey("stocks.code"), nullable=False)
    stock_name = Column(String, nullable=False)

    # AI recommendation data (at simulation_date)
    recommendation_rank = Column(Integer, nullable=False)  # 1 = top pick
    value_score = Column(Float, nullable=True)  # 0-100 score at recommendation time
    ai_upside_potential_pct = Column(Float, nullable=True)  # AI's predicted upside
    ai_confidence = Column(Float, nullable=True)  # AI confidence score (0-1)
    ai_rationale = Column(String, nullable=True)  # Why AI recommended this stock

    # Historical metrics (at simulation_date)
    price_at_recommendation = Column(Float, nullable=False)
    per_at_recommendation = Column(Float, nullable=True)
    pbr_at_recommendation = Column(Float, nullable=True)
    roe_at_recommendation = Column(Float, nullable=True)
    debt_ratio_at_recommendation = Column(Float, nullable=True)
    market_cap_at_recommendation = Column(Float, nullable=True)

    # Actual performance
    price_after_holding = Column(Float, nullable=True)  # Price after holding_period_months
    actual_return_pct = Column(Float, nullable=True)  # Actual return achieved
    exceeded_prediction = Column(Float, nullable=True)  # Did it beat AI's upside prediction?

    # Performance metadata
    max_price_during_holding = Column(Float, nullable=True)  # Peak price during holding period
    min_price_during_holding = Column(Float, nullable=True)  # Lowest price during holding period
    max_return_pct = Column(Float, nullable=True)  # Best possible return if sold at peak
    max_drawdown_pct = Column(Float, nullable=True)  # Worst drawdown during holding

    # Additional context
    sector = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    # Relationships
    backtest_run = relationship("BacktestRun", back_populates="recommendations")
    stock = relationship("Stock")


class BacktestSchedule(Base):
    """
    Scheduled backtesting configuration for automated periodic testing.
    """
    __tablename__ = "backtest_schedules"

    id = Column(Integer, primary_key=True, index=True)

    # Schedule configuration
    name = Column(String, nullable=False)
    strategy_type = Column(String, nullable=True)
    market = Column(String, nullable=False)
    lookback_years = Column(Integer, nullable=False)
    frequency = Column(String, nullable=False)  # monthly/quarterly/yearly

    # Active status
    is_active = Column(Integer, nullable=False, default=1)  # SQLite uses 1/0 for boolean

    # Last run tracking
    last_run_date = Column(DateTime, nullable=True)
    next_run_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class HistoricalStockPrice(Base):
    """
    Historical daily stock prices for backtesting.
    Stores OHLC data needed to calculate past value scores and performance.
    """
    __tablename__ = "historical_stock_prices"

    id = Column(Integer, primary_key=True, index=True)
    stock_code = Column(String, ForeignKey("stocks.code"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)

    # OHLC data
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)

    # Relationships
    stock = relationship("Stock")

    # Unique constraint: one price record per stock per date
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )


class HistoricalFinancialMetrics(Base):
    """
    Historical financial metrics snapshots for backtesting.
    Stores quarterly/annual financial data to recalculate value scores at any point in time.
    """
    __tablename__ = "historical_financial_metrics"

    id = Column(Integer, primary_key=True, index=True)
    stock_code = Column(String, ForeignKey("stocks.code"), nullable=False, index=True)
    snapshot_date = Column(DateTime, nullable=False, index=True)  # Date when this data was available
    report_date = Column(DateTime, nullable=False)  # Actual financial report period end

    # Valuation metrics
    per = Column(Float, nullable=True)
    pbr = Column(Float, nullable=True)
    psr = Column(Float, nullable=True)
    ev_ebitda = Column(Float, nullable=True)

    # Profitability metrics
    roe = Column(Float, nullable=True)
    roa = Column(Float, nullable=True)
    operating_margin = Column(Float, nullable=True)
    net_profit_growth = Column(Float, nullable=True)

    # Stability metrics
    debt_ratio = Column(Float, nullable=True)
    current_ratio = Column(Float, nullable=True)
    interest_coverage = Column(Float, nullable=True)
    operating_cash_flow = Column(Float, nullable=True)

    # Dividend metrics
    dividend_yield = Column(Float, nullable=True)
    dividend_payout_ratio = Column(Float, nullable=True)
    consecutive_dividend_years = Column(Integer, nullable=True)

    # Market data
    market_cap = Column(Float, nullable=True)

    # Relationships
    stock = relationship("Stock")

    __table_args__ = (
        {'sqlite_autoincrement': True},
    )

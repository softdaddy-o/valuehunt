"""
Unit tests for backtest engine.
"""
from datetime import datetime
from unittest.mock import Mock, patch

import pytest
from sqlalchemy.orm import Session

from app.models.backtest import (
    BacktestRecommendation,
    BacktestRun,
    BacktestStatus,
    HistoricalFinancialMetrics,
    HistoricalStockPrice,
)
from app.models.stock import Stock
from app.services.backtest_engine import BacktestEngine


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return Mock(spec=Session)


@pytest.fixture
def backtest_engine(mock_db):
    """Create a BacktestEngine instance with mocked dependencies."""
    return BacktestEngine(mock_db)


@pytest.fixture
def sample_backtest_run():
    """Create a sample backtest run."""
    return BacktestRun(
        id=1,
        name="Test Backtest",
        strategy_type=None,
        market="KOSPI",
        simulation_date=datetime(2020, 1, 1),
        lookback_years=5,
        holding_period_months=12,
        status=BacktestStatus.PENDING,
    )


@pytest.fixture
def sample_stock():
    """Create a sample stock."""
    return Stock(
        code="005930",
        name="Samsung Electronics",
        market="KOSPI",
        sector="Technology",
    )


@pytest.fixture
def sample_historical_price():
    """Create a sample historical price."""
    return HistoricalStockPrice(
        stock_code="005930",
        date=datetime(2020, 1, 1),
        open=50000,
        high=51000,
        low=49000,
        close=50500,
        volume=1000000,
    )


@pytest.fixture
def sample_historical_metrics():
    """Create sample historical financial metrics."""
    return HistoricalFinancialMetrics(
        stock_code="005930",
        snapshot_date=datetime(2020, 1, 1),
        report_date=datetime(2019, 12, 31),
        per=12.5,
        pbr=1.2,
        psr=0.8,
        roe=15.0,
        roa=8.0,
        operating_margin=12.0,
        debt_ratio=45.0,
        current_ratio=150.0,
        dividend_yield=2.5,
        market_cap=300000000000,
    )


class TestBacktestEngine:
    """Test suite for BacktestEngine."""

    @pytest.mark.asyncio
    async def test_generate_simulation_dates_monthly(self, backtest_engine):
        """Test generating simulation dates with monthly frequency."""
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 3, 1)
        frequency = "monthly"

        dates = backtest_engine._generate_simulation_dates(start_date, end_date, frequency)

        assert len(dates) == 3
        assert dates[0] == start_date
        assert dates[-1] <= end_date

    @pytest.mark.asyncio
    async def test_generate_simulation_dates_quarterly(self, backtest_engine):
        """Test generating simulation dates with quarterly frequency."""
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 12, 31)
        frequency = "quarterly"

        dates = backtest_engine._generate_simulation_dates(start_date, end_date, frequency)

        assert len(dates) == 5  # Q1, Q2, Q3, Q4, + initial
        assert dates[0] == start_date

    @pytest.mark.asyncio
    async def test_generate_simulation_dates_yearly(self, backtest_engine):
        """Test generating simulation dates with yearly frequency."""
        start_date = datetime(2018, 1, 1)
        end_date = datetime(2020, 12, 31)
        frequency = "yearly"

        dates = backtest_engine._generate_simulation_dates(start_date, end_date, frequency)

        assert len(dates) == 3
        assert dates[0] == start_date

    def test_calculate_upside_potential_positive(self, backtest_engine):
        """Test upside potential calculation with undervalued stock."""
        mock_metrics = Mock()
        mock_metrics.per = 5.0  # Low PER = undervalued

        upside = backtest_engine._calculate_upside_potential(mock_metrics)

        assert upside == 100.0  # (10 - 5) / 5 * 100 = 100%

    def test_calculate_upside_potential_overvalued(self, backtest_engine):
        """Test upside potential calculation with overvalued stock."""
        mock_metrics = Mock()
        mock_metrics.per = 15.0  # High PER = overvalued

        upside = backtest_engine._calculate_upside_potential(mock_metrics)

        assert upside == 0.0  # Already above target

    def test_calculate_upside_potential_none_per(self, backtest_engine):
        """Test upside potential calculation with None PER."""
        mock_metrics = Mock()
        mock_metrics.per = None

        upside = backtest_engine._calculate_upside_potential(mock_metrics)

        assert upside is None

    def test_calculate_upside_potential_negative_per(self, backtest_engine):
        """Test upside potential calculation with negative PER."""
        mock_metrics = Mock()
        mock_metrics.per = -5.0  # Loss-making company

        upside = backtest_engine._calculate_upside_potential(mock_metrics)

        assert upside is None

    @pytest.mark.asyncio
    async def test_create_backtest_series(self, backtest_engine, mock_db):
        """Test creating a series of backtests."""
        mock_db.add = Mock()
        mock_db.commit = Mock()

        runs = await backtest_engine.create_backtest_series(
            name="Test Series",
            strategy_type=None,
            market="KOSPI",
            start_date=datetime(2020, 1, 1),
            end_date=datetime(2020, 3, 1),
            lookback_years=5,
            holding_period_months=12,
            frequency="monthly",
        )

        assert len(runs) == 3
        assert all(run.name.startswith("Test Series") for run in runs)
        assert all(run.status == BacktestStatus.PENDING for run in runs)
        assert mock_db.commit.called

    @pytest.mark.asyncio
    async def test_calculate_market_return_kospi(self, backtest_engine):
        """Test market return calculation for KOSPI."""
        backtest = BacktestRun(
            id=1,
            name="Test",
            market="KOSPI",
            simulation_date=datetime(2020, 1, 1),
            holding_period_months=12,
            lookback_years=5,
            strategy_type=None,
        )

        with patch.object(
            backtest_engine.historical_service,
            "get_price_return",
            return_value={"return_pct": 15.5},
        ):
            market_return = await backtest_engine._calculate_market_return(backtest)

        assert market_return == 15.5

    @pytest.mark.asyncio
    async def test_calculate_market_return_kosdaq(self, backtest_engine):
        """Test market return calculation for KOSDAQ."""
        backtest = BacktestRun(
            id=1,
            name="Test",
            market="KOSDAQ",
            simulation_date=datetime(2020, 1, 1),
            holding_period_months=12,
            lookback_years=5,
            strategy_type=None,
        )

        with patch.object(
            backtest_engine.historical_service,
            "get_price_return",
            return_value={"return_pct": 20.0},
        ):
            market_return = await backtest_engine._calculate_market_return(backtest)

        assert market_return == 20.0

    @pytest.mark.asyncio
    async def test_calculate_market_return_no_data(self, backtest_engine):
        """Test market return calculation with no data."""
        backtest = BacktestRun(
            id=1,
            name="Test",
            market="KOSPI",
            simulation_date=datetime(2020, 1, 1),
            holding_period_months=12,
            lookback_years=5,
            strategy_type=None,
        )

        with patch.object(
            backtest_engine.historical_service, "get_price_return", return_value=None
        ):
            market_return = await backtest_engine._calculate_market_return(backtest)

        assert market_return is None


class TestBacktestStatistics:
    """Test suite for backtest statistics calculation."""

    @pytest.mark.asyncio
    async def test_calculate_statistics_with_data(self, backtest_engine, mock_db):
        """Test statistics calculation with valid data."""
        # Create mock recommendations
        recommendations = [
            Mock(actual_return_pct=10.0, max_drawdown_pct=-5.0),
            Mock(actual_return_pct=15.0, max_drawdown_pct=-8.0),
            Mock(actual_return_pct=-5.0, max_drawdown_pct=-15.0),
            Mock(actual_return_pct=20.0, max_drawdown_pct=-3.0),
        ]

        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = recommendations
        mock_db.query.return_value = mock_query

        backtest = BacktestRun(id=1, name="Test", market="KOSPI")

        with patch.object(
            backtest_engine, "_calculate_market_return", return_value=5.0
        ):
            await backtest_engine._calculate_statistics(backtest)

        # Check calculations
        assert backtest.total_recommendations == 4
        assert backtest.avg_return_pct == 10.0  # (10 + 15 - 5 + 20) / 4
        assert backtest.best_return_pct == 20.0
        assert backtest.worst_return_pct == -5.0
        assert backtest.win_rate_pct == 75.0  # 3 out of 4 positive
        assert backtest.alpha_pct == 5.0  # 10.0 - 5.0
        assert backtest.max_drawdown_pct == -15.0

    @pytest.mark.asyncio
    async def test_calculate_statistics_no_data(self, backtest_engine, mock_db):
        """Test statistics calculation with no recommendations."""
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = []
        mock_db.query.return_value = mock_query

        backtest = BacktestRun(id=1, name="Test", market="KOSPI")

        await backtest_engine._calculate_statistics(backtest)

        # Should not set any statistics
        assert backtest.total_recommendations is None


class TestBacktestValidation:
    """Test suite for backtest validation and error handling."""

    @pytest.mark.asyncio
    async def test_run_backtest_not_found(self, backtest_engine, mock_db):
        """Test running a non-existent backtest."""
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None
        mock_db.query.return_value = mock_query

        with pytest.raises(ValueError, match="not found"):
            await backtest_engine.run_backtest(999)

    @pytest.mark.asyncio
    async def test_run_backtest_updates_status(self, backtest_engine, mock_db, sample_backtest_run):
        """Test that backtest status is updated during execution."""
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = sample_backtest_run
        mock_db.query.return_value = mock_query
        mock_db.commit = Mock()

        # Mock the methods to avoid actual execution
        with patch.object(
            backtest_engine, "_generate_historical_recommendations", return_value=[]
        ):
            with patch.object(backtest_engine, "_calculate_performance"):
                with patch.object(backtest_engine, "_calculate_statistics"):
                    try:
                        await backtest_engine.run_backtest(1)
                    except ValueError:
                        pass  # Expected due to no recommendations

        # Status should be updated (either to RUNNING or FAILED)
        assert sample_backtest_run.status in [
            BacktestStatus.RUNNING,
            BacktestStatus.FAILED,
            BacktestStatus.COMPLETED,
        ]

    def test_invalid_frequency_raises_error(self, backtest_engine):
        """Test that invalid frequency raises ValueError."""
        with pytest.raises(ValueError, match="Invalid frequency"):
            backtest_engine._generate_simulation_dates(
                datetime(2020, 1, 1), datetime(2020, 12, 31), "invalid"
            )

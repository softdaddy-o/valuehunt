"""
Unit tests for historical data service.
"""
import pytest
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
import pandas as pd
from sqlalchemy.orm import Session

from app.models.backtest import HistoricalStockPrice, HistoricalFinancialMetrics
from app.models.stock import Stock
from app.services.historical_data_service import HistoricalDataService


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = Mock(spec=Session)
    db.query = Mock(return_value=Mock())
    db.add = Mock()
    db.commit = Mock()
    db.rollback = Mock()
    return db


@pytest.fixture
def historical_service(mock_db):
    """Create a HistoricalDataService instance."""
    return HistoricalDataService(mock_db)


@pytest.fixture
def sample_price_data():
    """Create sample price data as a pandas DataFrame."""
    return pd.DataFrame(
        {
            "Date": [datetime(2020, 1, 1), datetime(2020, 1, 2), datetime(2020, 1, 3)],
            "Open": [50000, 50500, 51000],
            "High": [51000, 51500, 52000],
            "Low": [49000, 49500, 50000],
            "Close": [50500, 51000, 51500],
            "Volume": [1000000, 1100000, 1200000],
        }
    )


class TestHistoricalPriceCollection:
    """Test suite for historical price collection."""

    @pytest.mark.asyncio
    async def test_collect_historical_prices_success(
        self, historical_service, mock_db, sample_price_data
    ):
        """Test successful historical price collection."""
        stock_code = "005930"
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 1, 3)

        # Mock FinanceDataReader
        with patch("app.services.historical_data_service.fdr.DataReader") as mock_fdr:
            mock_fdr.return_value = sample_price_data

            # Mock database query to return no existing records
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.first.return_value = None
            mock_db.query.return_value = mock_query

            count = await historical_service.collect_historical_prices(
                stock_code, start_date, end_date
            )

        assert count == 3
        assert mock_db.add.call_count == 3
        assert mock_db.commit.called

    @pytest.mark.asyncio
    async def test_collect_historical_prices_empty_data(self, historical_service, mock_db):
        """Test collecting historical prices with no data available."""
        stock_code = "005930"
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 1, 3)

        # Mock FinanceDataReader to return empty DataFrame
        with patch("app.services.historical_data_service.fdr.DataReader") as mock_fdr:
            mock_fdr.return_value = pd.DataFrame()

            count = await historical_service.collect_historical_prices(
                stock_code, start_date, end_date
            )

        assert count == 0
        assert not mock_db.add.called

    @pytest.mark.asyncio
    async def test_collect_historical_prices_skip_existing(
        self, historical_service, mock_db, sample_price_data
    ):
        """Test that existing price records are skipped."""
        stock_code = "005930"
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 1, 3)

        # Mock existing record
        existing_record = HistoricalStockPrice(
            stock_code=stock_code, date=datetime(2020, 1, 1), close=50000
        )

        with patch("app.services.historical_data_service.fdr.DataReader") as mock_fdr:
            mock_fdr.return_value = sample_price_data

            # Mock database to return existing record for first date only
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.first.side_effect = [existing_record, None, None]
            mock_db.query.return_value = mock_query

            count = await historical_service.collect_historical_prices(
                stock_code, start_date, end_date
            )

        # Should insert 2 new records (skip the existing one)
        assert count == 2
        assert mock_db.add.call_count == 2

    @pytest.mark.asyncio
    async def test_collect_historical_prices_exception(self, historical_service, mock_db):
        """Test error handling during price collection."""
        stock_code = "005930"
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 1, 3)

        # Mock FinanceDataReader to raise exception
        with patch(
            "app.services.historical_data_service.fdr.DataReader",
            side_effect=Exception("API Error"),
        ):
            count = await historical_service.collect_historical_prices(
                stock_code, start_date, end_date
            )

        assert count == 0
        assert mock_db.rollback.called


class TestHistoricalMetricsCollection:
    """Test suite for historical financial metrics collection."""

    @pytest.mark.asyncio
    async def test_collect_historical_financial_metrics_with_dart(
        self, historical_service, mock_db
    ):
        """Test collecting historical metrics with DART data."""
        stock_code = "005930"
        snapshot_date = datetime(2020, 1, 1)

        # Mock DART service
        mock_dart_data = {
            "report_date": datetime(2019, 12, 31),
            "per": 12.5,
            "pbr": 1.2,
            "roe": 15.0,
            "market_cap": 300000000000,
        }

        with patch.object(
            historical_service.dart_service,
            "get_financial_metrics",
            return_value=mock_dart_data,
        ):
            # Mock historical price query
            mock_price = HistoricalStockPrice(
                stock_code=stock_code, date=snapshot_date, close=50000
            )
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.first.side_effect = [None, mock_price]  # No existing metrics, has price
            mock_db.query.return_value = mock_query

            result = await historical_service.collect_historical_financial_metrics(
                stock_code, snapshot_date
            )

        assert result is not None
        assert mock_db.add.called
        assert mock_db.commit.called

    @pytest.mark.asyncio
    async def test_collect_historical_financial_metrics_skip_existing(
        self, historical_service, mock_db
    ):
        """Test that existing metrics are not re-collected."""
        stock_code = "005930"
        snapshot_date = datetime(2020, 1, 1)

        # Mock existing metrics
        existing_metrics = HistoricalFinancialMetrics(
            stock_code=stock_code, snapshot_date=snapshot_date, per=12.5
        )

        mock_dart_data = {"per": 12.5, "pbr": 1.2}

        with patch.object(
            historical_service.dart_service,
            "get_financial_metrics",
            return_value=mock_dart_data,
        ):
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.first.return_value = existing_metrics
            mock_db.query.return_value = mock_query

            result = await historical_service.collect_historical_financial_metrics(
                stock_code, snapshot_date
            )

        assert result == existing_metrics
        assert not mock_db.add.called  # Should not add duplicate


class TestHistoricalDataRetrieval:
    """Test suite for historical data retrieval methods."""

    def test_get_historical_price_found(self, historical_service, mock_db):
        """Test retrieving an existing historical price."""
        stock_code = "005930"
        target_date = datetime(2020, 1, 1)

        mock_price = HistoricalStockPrice(
            stock_code=stock_code, date=target_date, close=50000
        )

        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.first.return_value = mock_price
        mock_db.query.return_value = mock_query

        result = historical_service.get_historical_price(stock_code, target_date)

        assert result == mock_price

    def test_get_historical_price_not_found(self, historical_service, mock_db):
        """Test retrieving a non-existent historical price."""
        stock_code = "005930"
        target_date = datetime(2020, 1, 1)

        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.first.return_value = None
        mock_db.query.return_value = mock_query

        result = historical_service.get_historical_price(stock_code, target_date)

        assert result is None

    def test_get_historical_metrics_found(self, historical_service, mock_db):
        """Test retrieving existing historical metrics."""
        stock_code = "005930"
        target_date = datetime(2020, 1, 1)

        mock_metrics = HistoricalFinancialMetrics(
            stock_code=stock_code, snapshot_date=target_date, per=12.5
        )

        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.first.return_value = mock_metrics
        mock_db.query.return_value = mock_query

        result = historical_service.get_historical_metrics(stock_code, target_date)

        assert result == mock_metrics


class TestPriceReturnCalculation:
    """Test suite for price return calculations."""

    def test_get_price_return_success(self, historical_service, mock_db):
        """Test successful price return calculation."""
        stock_code = "005930"
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 12, 31)

        start_price = HistoricalStockPrice(
            stock_code=stock_code, date=start_date, close=50000
        )
        end_price = HistoricalStockPrice(stock_code=stock_code, date=end_date, close=60000)

        # Create price records for the period
        price_records = [
            Mock(high=51000, low=49000),
            Mock(high=62000, low=48000),
            Mock(high=60000, low=58000),
        ]

        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query

        # First two calls for start/end prices, third for all prices in period
        mock_query.first.side_effect = [start_price, end_price]
        mock_query.all.return_value = price_records

        mock_db.query.return_value = mock_query

        result = historical_service.get_price_return(stock_code, start_date, end_date)

        assert result is not None
        assert result["start_price"] == 50000
        assert result["end_price"] == 60000
        assert result["return_pct"] == 20.0  # (60000 - 50000) / 50000 * 100
        assert result["max_price"] == 62000
        assert result["min_price"] == 48000

    def test_get_price_return_no_start_price(self, historical_service, mock_db):
        """Test price return calculation with missing start price."""
        stock_code = "005930"
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 12, 31)

        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.first.return_value = None
        mock_db.query.return_value = mock_query

        result = historical_service.get_price_return(stock_code, start_date, end_date)

        assert result is None

    def test_get_price_return_no_prices_in_period(self, historical_service, mock_db):
        """Test price return calculation with no prices in period."""
        stock_code = "005930"
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 12, 31)

        start_price = HistoricalStockPrice(
            stock_code=stock_code, date=start_date, close=50000
        )
        end_price = HistoricalStockPrice(stock_code=stock_code, date=end_date, close=60000)

        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.first.side_effect = [start_price, end_price]
        mock_query.all.return_value = []  # No prices in period

        mock_db.query.return_value = mock_query

        result = historical_service.get_price_return(stock_code, start_date, end_date)

        assert result is None


class TestMetricsEstimation:
    """Test suite for metrics estimation fallback."""

    def test_estimate_historical_metrics_with_price(self, historical_service, mock_db):
        """Test estimating metrics when historical price exists."""
        stock_code = "005930"
        snapshot_date = datetime(2020, 1, 1)

        # Mock stock query
        mock_stock = Stock(code=stock_code, name="Samsung")

        # Mock historical price
        mock_price = HistoricalStockPrice(
            stock_code=stock_code, date=snapshot_date, close=50000
        )

        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.first.side_effect = [mock_stock, mock_price]
        mock_db.query.return_value = mock_query

        result = historical_service._estimate_historical_metrics(stock_code, snapshot_date)

        assert result is not None
        assert "per" in result
        assert "pbr" in result
        assert "market_cap" in result

    def test_estimate_historical_metrics_no_stock(self, historical_service, mock_db):
        """Test estimating metrics when stock doesn't exist."""
        stock_code = "999999"
        snapshot_date = datetime(2020, 1, 1)

        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None
        mock_db.query.return_value = mock_query

        result = historical_service._estimate_historical_metrics(stock_code, snapshot_date)

        assert result is None

    def test_estimate_historical_metrics_no_price(self, historical_service, mock_db):
        """Test estimating metrics when no historical price exists."""
        stock_code = "005930"
        snapshot_date = datetime(2020, 1, 1)

        mock_stock = Stock(code=stock_code, name="Samsung")

        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.first.side_effect = [mock_stock, None]  # Stock exists, no price
        mock_db.query.return_value = mock_query

        result = historical_service._estimate_historical_metrics(stock_code, snapshot_date)

        assert result is None

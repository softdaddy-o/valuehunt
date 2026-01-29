"""
API endpoint tests for backtest routes.
"""
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock

from app.main import app
from app.models.backtest import BacktestRun, BacktestRecommendation, BacktestStatus
from app.db.database import get_db


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def mock_db_session():
    """Create a mock database session."""
    return Mock()


@pytest.fixture
def sample_backtest_runs():
    """Create sample backtest runs."""
    return [
        BacktestRun(
            id=1,
            name="Test Backtest 1",
            strategy_type="UNDERVALUED_SCREENER",
            market="KOSPI",
            simulation_date=datetime(2020, 1, 1),
            lookback_years=5,
            holding_period_months=12,
            status=BacktestStatus.COMPLETED,
            total_recommendations=20,
            avg_return_pct=15.5,
            win_rate_pct=70.0,
            sharpe_ratio=1.5,
        ),
        BacktestRun(
            id=2,
            name="Test Backtest 2",
            strategy_type=None,
            market="KOSDAQ",
            simulation_date=datetime(2020, 6, 1),
            lookback_years=5,
            holding_period_months=12,
            status=BacktestStatus.RUNNING,
            total_recommendations=None,
        ),
    ]


@pytest.fixture
def sample_recommendations():
    """Create sample backtest recommendations."""
    return [
        BacktestRecommendation(
            id=1,
            backtest_run_id=1,
            stock_code="005930",
            stock_name="Samsung Electronics",
            recommendation_rank=1,
            value_score=85.5,
            price_at_recommendation=50000,
            actual_return_pct=25.0,
        ),
        BacktestRecommendation(
            id=2,
            backtest_run_id=1,
            stock_code="000660",
            stock_name="SK Hynix",
            recommendation_rank=2,
            value_score=82.0,
            price_at_recommendation=80000,
            actual_return_pct=18.0,
        ),
    ]


class TestBacktestListEndpoint:
    """Test suite for GET /api/v1/backtest/runs endpoint."""

    def test_list_backtests_success(self, client, sample_backtest_runs, mock_db_session):
        """Test successful listing of backtests."""

        def mock_get_db():
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.offset.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.all.return_value = sample_backtest_runs

            mock_db_session.query.return_value = mock_query
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        response = client.get("/api/v1/backtest/runs")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "Test Backtest 1"
        assert data[0]["status"] == "completed"

        app.dependency_overrides.clear()

    def test_list_backtests_with_filters(self, client, sample_backtest_runs, mock_db_session):
        """Test listing backtests with query filters."""

        def mock_get_db():
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.offset.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.all.return_value = [sample_backtest_runs[0]]

            mock_db_session.query.return_value = mock_query
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        response = client.get(
            "/api/v1/backtest/runs?market=KOSPI&status=completed&limit=10"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["market"] == "KOSPI"

        app.dependency_overrides.clear()

    def test_list_backtests_empty(self, client, mock_db_session):
        """Test listing backtests when none exist."""

        def mock_get_db():
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.offset.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.all.return_value = []

            mock_db_session.query.return_value = mock_query
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        response = client.get("/api/v1/backtest/runs")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

        app.dependency_overrides.clear()


class TestBacktestDetailEndpoint:
    """Test suite for GET /api/v1/backtest/runs/{id} endpoint."""

    def test_get_backtest_detail_success(self, client, sample_backtest_runs, mock_db_session):
        """Test successful retrieval of backtest details."""

        def mock_get_db():
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.first.return_value = sample_backtest_runs[0]

            mock_db_session.query.return_value = mock_query
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        response = client.get("/api/v1/backtest/runs/1")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["name"] == "Test Backtest 1"
        assert data["avg_return_pct"] == 15.5

        app.dependency_overrides.clear()

    def test_get_backtest_detail_not_found(self, client, mock_db_session):
        """Test getting details of non-existent backtest."""

        def mock_get_db():
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.first.return_value = None

            mock_db_session.query.return_value = mock_query
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        response = client.get("/api/v1/backtest/runs/999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

        app.dependency_overrides.clear()


class TestBacktestRecommendationsEndpoint:
    """Test suite for GET /api/v1/backtest/runs/{id}/recommendations endpoint."""

    def test_get_recommendations_success(
        self, client, sample_recommendations, mock_db_session
    ):
        """Test successful retrieval of recommendations."""

        def mock_get_db():
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.offset.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.all.return_value = sample_recommendations

            mock_db_session.query.return_value = mock_query
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        response = client.get("/api/v1/backtest/runs/1/recommendations")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["stock_code"] == "005930"
        assert data[0]["actual_return_pct"] == 25.0

        app.dependency_overrides.clear()


class TestBacktestDeleteEndpoint:
    """Test suite for DELETE /api/v1/backtest/runs/{id} endpoint."""

    def test_delete_backtest_success(self, client, sample_backtest_runs, mock_db_session):
        """Test successful deletion of a backtest."""

        def mock_get_db():
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.first.return_value = sample_backtest_runs[0]

            mock_db_session.query.return_value = mock_query
            mock_db_session.delete = Mock()
            mock_db_session.commit = Mock()
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        response = client.delete("/api/v1/backtest/runs/1")

        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]

        app.dependency_overrides.clear()

    def test_delete_backtest_not_found(self, client, mock_db_session):
        """Test deleting a non-existent backtest."""

        def mock_get_db():
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.first.return_value = None

            mock_db_session.query.return_value = mock_query
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        response = client.delete("/api/v1/backtest/runs/999")

        assert response.status_code == 404

        app.dependency_overrides.clear()


class TestBacktestCreateEndpoint:
    """Test suite for POST /api/v1/backtest/create endpoint."""

    @patch("app.api.backtest.BacktestEngine")
    def test_create_backtest_series_success(self, mock_engine_class, client, mock_db_session):
        """Test successful creation of backtest series."""
        # Mock BacktestEngine
        mock_engine = Mock()
        mock_engine.create_backtest_series = AsyncMock(
            return_value=[
                BacktestRun(
                    id=1,
                    name="Test - 2020-01",
                    strategy_type=None,
                    market="ALL",
                    simulation_date=datetime(2020, 1, 1),
                    lookback_years=5,
                    holding_period_months=12,
                    status=BacktestStatus.PENDING,
                    created_at=datetime.now(),
                )
            ]
        )
        mock_engine_class.return_value = mock_engine

        def mock_get_db():
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        request_data = {
            "name": "Test Series",
            "strategy_type": None,
            "market": "ALL",
            "start_date": "2020-01-01",
            "end_date": "2020-12-31",
            "lookback_years": 5,
            "holding_period_months": 12,
            "frequency": "monthly",
        }

        response = client.post("/api/v1/backtest/create", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert data[0]["status"] == "pending"

        app.dependency_overrides.clear()


class TestAnalyticsEndpoints:
    """Test suite for analytics endpoints."""

    def test_compare_strategies_success(self, client, mock_db_session):
        """Test successful strategy comparison."""

        def mock_get_db():
            # Mock completed backtests
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.all.return_value = [
                BacktestRun(
                    id=1,
                    strategy_type="UNDERVALUED_SCREENER",
                    avg_return_pct=15.0,
                    win_rate_pct=70.0,
                    sharpe_ratio=1.5,
                    alpha_pct=5.0,
                    status=BacktestStatus.COMPLETED,
                ),
                BacktestRun(
                    id=2,
                    strategy_type="DIVIDEND_ANALYZER",
                    avg_return_pct=12.0,
                    win_rate_pct=65.0,
                    sharpe_ratio=1.3,
                    alpha_pct=3.0,
                    status=BacktestStatus.COMPLETED,
                ),
            ]

            mock_db_session.query.return_value = mock_query
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        response = client.get("/api/v1/backtest/analytics/compare")

        assert response.status_code == 200
        data = response.json()
        assert "strategies" in data
        assert "best_by_return" in data

        app.dependency_overrides.clear()

    def test_get_summary_statistics(self, client, mock_db_session):
        """Test getting summary statistics."""

        def mock_get_db():
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.group_by.return_value = mock_query
            mock_query.all.return_value = [
                (BacktestStatus.COMPLETED, 10),
                (BacktestStatus.RUNNING, 2),
            ]

            # Mock completed backtests for statistics
            completed_backtests = [
                BacktestRun(
                    avg_return_pct=15.0, win_rate_pct=70.0, sharpe_ratio=1.5, alpha_pct=5.0
                ),
                BacktestRun(
                    avg_return_pct=12.0, win_rate_pct=65.0, sharpe_ratio=1.3, alpha_pct=3.0
                ),
            ]

            mock_query2 = Mock()
            mock_query2.filter.return_value = mock_query2
            mock_query2.all.return_value = completed_backtests

            def query_side_effect(model):
                if hasattr(model, "status"):
                    return mock_query
                return mock_query2

            mock_db_session.query.side_effect = query_side_effect
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        response = client.get("/api/v1/backtest/analytics/summary")

        assert response.status_code == 200
        data = response.json()
        assert "total_backtests" in data

        app.dependency_overrides.clear()


class TestBacktestExecutionEndpoint:
    """Test suite for POST /api/v1/backtest/runs/{id}/execute endpoint."""

    def test_execute_pending_backtest(self, client, mock_db_session):
        """Test executing a pending backtest."""
        pending_backtest = BacktestRun(
            id=1,
            name="Test",
            status=BacktestStatus.PENDING,
            market="KOSPI",
            simulation_date=datetime(2020, 1, 1),
            lookback_years=5,
            holding_period_months=12,
        )

        def mock_get_db():
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.first.return_value = pending_backtest

            mock_db_session.query.return_value = mock_query
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        response = client.post("/api/v1/backtest/runs/1/execute")

        assert response.status_code == 200
        assert "queued" in response.json()["message"].lower()

        app.dependency_overrides.clear()

    def test_execute_non_pending_backtest(self, client, mock_db_session):
        """Test executing a non-pending backtest (should fail)."""
        completed_backtest = BacktestRun(
            id=1,
            name="Test",
            status=BacktestStatus.COMPLETED,
            market="KOSPI",
            simulation_date=datetime(2020, 1, 1),
            lookback_years=5,
            holding_period_months=12,
        )

        def mock_get_db():
            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.first.return_value = completed_backtest

            mock_db_session.query.return_value = mock_query
            return mock_db_session

        app.dependency_overrides[get_db] = mock_get_db

        response = client.post("/api/v1/backtest/runs/1/execute")

        assert response.status_code == 400
        assert "cannot execute" in response.json()["detail"].lower()

        app.dependency_overrides.clear()

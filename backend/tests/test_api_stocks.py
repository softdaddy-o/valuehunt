"""Tests for Stocks API endpoints"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from app.main import app
from app.db.database import Base, get_db
from app.models.stock import Stock
from app.models.financial_metrics import FinancialMetrics
from app.models.value_score import ValueScore


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_stocks.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test, drop after"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_stocks(setup_database):
    """Create sample stock data for testing"""
    db = TestingSessionLocal()
    try:
        # Create stocks
        stock1 = Stock(
            stock_code="005930",
            stock_name="삼성전자",
            market="KOSPI",
            sector="전기전자",
            current_price=75000,
            change_rate=2.5,
            market_cap=4500000000000,
        )
        stock2 = Stock(
            stock_code="000660",
            stock_name="SK하이닉스",
            market="KOSPI",
            sector="전기전자",
            current_price=120000,
            change_rate=-1.2,
            market_cap=8700000000000,
        )

        db.add_all([stock1, stock2])
        db.commit()

        # Add financial metrics
        metrics1 = FinancialMetrics(
            stock_code="005930",
            date=datetime.now(),
            PER=8.5,
            PBR=0.9,
            ROE=18.5,
            ROA=12.3,
            operating_margin=20.5,
            net_margin=15.2,
            debt_ratio=35.0,
            current_ratio=180.0,
            dividend_yield=4.2,
        )
        metrics2 = FinancialMetrics(
            stock_code="000660",
            date=datetime.now(),
            PER=12.0,
            PBR=1.2,
            ROE=22.0,
            ROA=15.5,
            operating_margin=25.0,
            net_margin=18.0,
            debt_ratio=28.0,
            current_ratio=220.0,
            dividend_yield=3.5,
        )

        db.add_all([metrics1, metrics2])
        db.commit()

        # Add value scores
        score1 = ValueScore(
            stock_code="005930",
            total_score=85.5,
            valuation_score=35.0,
            profitability_score=28.0,
            stability_score=18.0,
            dividend_score=4.5,
            strengths=["Strong fundamentals", "Excellent profitability", "Low debt"],
            risks=["Market volatility"],
            ai_summary="Excellent value stock with strong fundamentals",
        )
        score2 = ValueScore(
            stock_code="000660",
            total_score=88.0,
            valuation_score=32.0,
            profitability_score=29.5,
            stability_score=19.5,
            dividend_score=7.0,
            strengths=["Very high ROE", "Strong stability", "Good dividend"],
            risks=["Higher valuation"],
            ai_summary="Premium stock with outstanding metrics",
        )

        db.add_all([score1, score2])
        db.commit()

        return [stock1, stock2]
    finally:
        db.close()


class TestStocksAPI:
    """Test stocks endpoints"""

    def test_get_top_picks_default(self, sample_stocks):
        """Test getting top picks with default parameters"""
        response = client.get("/api/v1/stocks/top-picks")

        assert response.status_code == 200
        data = response.json()

        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data

        assert len(data["items"]) == 2
        assert data["total"] == 2

    def test_get_top_picks_sorted_by_score(self, sample_stocks):
        """Test that top picks are sorted by value score descending"""
        response = client.get("/api/v1/stocks/top-picks")

        assert response.status_code == 200
        data = response.json()

        # First item should have higher score (SK하이닉스: 88.0)
        assert data["items"][0]["value_score"] >= data["items"][1]["value_score"]
        assert data["items"][0]["stock_code"] == "000660"

    def test_get_top_picks_with_limit(self, sample_stocks):
        """Test limiting number of results"""
        response = client.get("/api/v1/stocks/top-picks?limit=1")

        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 1
        assert data["limit"] == 1

    def test_get_top_picks_with_market_filter(self, sample_stocks):
        """Test filtering by market"""
        response = client.get("/api/v1/stocks/top-picks?market=KOSPI")

        assert response.status_code == 200
        data = response.json()

        # Both stocks are KOSPI
        assert len(data["items"]) == 2

        for item in data["items"]:
            assert item["market"] == "KOSPI"

    def test_get_top_picks_includes_all_fields(self, sample_stocks):
        """Test that response includes all required fields"""
        response = client.get("/api/v1/stocks/top-picks")

        assert response.status_code == 200
        data = response.json()

        item = data["items"][0]

        # Check all required fields
        assert "rank" in item
        assert "stock_code" in item
        assert "stock_name" in item
        assert "market" in item
        assert "current_price" in item
        assert "change_rate" in item
        assert "value_score" in item
        assert "category_scores" in item
        assert "key_metrics" in item
        assert "ai_summary" in item

    def test_get_stock_detail_success(self, sample_stocks):
        """Test getting stock detail"""
        response = client.get("/api/v1/stocks/005930")

        assert response.status_code == 200
        data = response.json()

        assert data["stock_info"]["code"] == "005930"
        assert data["stock_info"]["name"] == "삼성전자"
        assert "value_score" in data
        assert "ai_analysis" in data
        assert "financial_metrics" in data
        assert "external_links" in data

    def test_get_stock_detail_not_found(self, sample_stocks):
        """Test getting non-existent stock"""
        response = client.get("/api/v1/stocks/999999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_stock_detail_includes_financial_metrics(self, sample_stocks):
        """Test that stock detail includes financial metrics"""
        response = client.get("/api/v1/stocks/005930")

        assert response.status_code == 200
        data = response.json()

        metrics = data["financial_metrics"]["current"]

        assert metrics["PER"] == 8.5
        assert metrics["PBR"] == 0.9
        assert metrics["ROE"] == 18.5

    def test_get_stock_detail_includes_value_scores(self, sample_stocks):
        """Test that stock detail includes value scores"""
        response = client.get("/api/v1/stocks/005930")

        assert response.status_code == 200
        data = response.json()

        scores = data["value_score"]

        assert scores["total"] == 85.5
        assert scores["valuation"] == 35.0
        assert scores["profitability"] == 28.0
        assert scores["stability"] == 18.0
        assert scores["dividend"] == 4.5

    def test_get_stock_detail_includes_ai_analysis(self, sample_stocks):
        """Test that stock detail includes AI analysis"""
        response = client.get("/api/v1/stocks/005930")

        assert response.status_code == 200
        data = response.json()

        ai = data["ai_analysis"]

        assert "summary" in ai
        assert "strengths" in ai
        assert "risks" in ai
        assert len(ai["strengths"]) > 0
        assert len(ai["risks"]) > 0

    def test_get_stock_detail_includes_external_links(self, sample_stocks):
        """Test that stock detail includes external links"""
        response = client.get("/api/v1/stocks/005930")

        assert response.status_code == 200
        data = response.json()

        links = data["external_links"]

        assert "news" in links
        assert "dart" in links
        assert "005930" in links["news"]
        assert "005930" in links["dart"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

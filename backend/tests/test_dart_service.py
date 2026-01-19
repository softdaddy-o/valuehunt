"""Unit tests for DART API service integration"""

import pandas as pd
import pytest
from unittest.mock import Mock, patch

from app.services.dart_service import DartService
from app.utils.dart_mappings import (
    calculate_current_ratio,
    calculate_debt_ratio,
    calculate_operating_margin,
    calculate_roa,
    calculate_roe,
    extract_account,
)


@pytest.fixture
def mock_dart_data():
    """Create mock DART financial statement data"""
    bs_data = pd.DataFrame(
        {
            "sj_div": ["BS", "BS", "BS", "BS", "BS"],
            "account_nm": [
                "자산총계",
                "부채총계",
                "자본총계",
                "유동자산",
                "유동부채",
            ],
            "thstrm_amount": [1000000000, 400000000, 600000000, 400000000, 200000000],
        }
    )

    is_data = pd.DataFrame(
        {
            "sj_div": ["IS", "IS", "IS"],
            "account_nm": ["매출액", "영업이익", "당기순이익"],
            "thstrm_amount": [800000000, 120000000, 80000000],
        }
    )

    cf_data = pd.DataFrame(
        {
            "sj_div": ["CF"],
            "account_nm": ["영업활동현금흐름"],
            "thstrm_amount": [100000000],
        }
    )

    full_data = pd.concat([bs_data, is_data, cf_data], ignore_index=True)
    return full_data


class TestDartServiceInitialization:
    """Test DART service initialization"""

    def test_dart_service_initialization(self):
        """Test DartService initializes correctly"""
        service = DartService()
        assert service is not None
        assert isinstance(service._corp_code_cache, dict)
        assert len(service._corp_code_cache) == 0

    def test_dart_service_api_key_missing(self):
        """Test DartService handles missing API key gracefully"""
        with patch("app.services.dart_service.settings") as mock_settings:
            mock_settings.DART_API_KEY = ""
            service = DartService()
            assert not service.is_available()

    def test_is_available_returns_boolean(self):
        """Test is_available() returns boolean"""
        service = DartService()
        result = service.is_available()
        assert isinstance(result, bool)


class TestDataExtraction:
    """Test extracting data from DART DataFrames"""

    def test_extract_account_success(self, mock_dart_data):
        """Test extracting an account that exists"""
        bs = mock_dart_data[mock_dart_data["sj_div"] == "BS"]
        value = extract_account(bs, "자산총계")
        assert value == 1000000000

    def test_extract_account_missing(self, mock_dart_data):
        """Test extracting an account that doesn't exist"""
        bs = mock_dart_data[mock_dart_data["sj_div"] == "BS"]
        value = extract_account(bs, "비존재항목")
        assert value is None

    def test_extract_account_from_none(self):
        """Test extracting from None DataFrame"""
        value = extract_account(None, "자산총계")
        assert value is None

    def test_extract_account_from_empty(self):
        """Test extracting from empty DataFrame"""
        empty_df = pd.DataFrame()
        value = extract_account(empty_df, "자산총계")
        assert value is None


class TestMetricCalculations:
    """Test financial metric calculations"""

    def test_calculate_roe_success(self):
        """Test ROE calculation with valid inputs"""
        roe = calculate_roe(net_income=80000000, total_equity=600000000)
        assert roe is not None
        assert roe == round((80000000 / 600000000) * 100, 2)
        assert abs(roe - 13.33) < 0.01

    def test_calculate_roe_invalid_inputs(self):
        """Test ROE calculation with invalid inputs"""
        assert calculate_roe(None, 600000000) is None
        assert calculate_roe(80000000, None) is None
        assert calculate_roe(80000000, 0) is None
        assert calculate_roe(80000000, -100) is None

    def test_calculate_roa_success(self):
        """Test ROA calculation with valid inputs"""
        roa = calculate_roa(net_income=80000000, total_assets=1000000000)
        assert roa is not None
        assert roa == 8.0

    def test_calculate_roa_invalid_inputs(self):
        """Test ROA calculation with invalid inputs"""
        assert calculate_roa(None, 1000000000) is None
        assert calculate_roa(80000000, None) is None
        assert calculate_roa(80000000, 0) is None

    def test_calculate_operating_margin_success(self):
        """Test operating margin calculation with valid inputs"""
        margin = calculate_operating_margin(
            operating_income=120000000, revenue=800000000
        )
        assert margin is not None
        assert margin == 15.0

    def test_calculate_operating_margin_invalid_inputs(self):
        """Test operating margin calculation with invalid inputs"""
        assert calculate_operating_margin(None, 800000000) is None
        assert calculate_operating_margin(120000000, None) is None
        assert calculate_operating_margin(120000000, 0) is None

    def test_calculate_debt_ratio_success(self):
        """Test debt ratio calculation with valid inputs"""
        debt_ratio = calculate_debt_ratio(
            total_liabilities=400000000, total_equity=600000000
        )
        assert debt_ratio is not None
        assert debt_ratio == round((400000000 / 600000000) * 100, 2)
        assert abs(debt_ratio - 66.67) < 0.01

    def test_calculate_debt_ratio_invalid_inputs(self):
        """Test debt ratio calculation with invalid inputs"""
        assert calculate_debt_ratio(None, 600000000) is None
        assert calculate_debt_ratio(400000000, None) is None
        assert calculate_debt_ratio(400000000, 0) is None

    def test_calculate_current_ratio_success(self):
        """Test current ratio calculation with valid inputs"""
        current_ratio = calculate_current_ratio(
            current_assets=400000000, current_liabilities=200000000
        )
        assert current_ratio is not None
        assert current_ratio == 200.0

    def test_calculate_current_ratio_invalid_inputs(self):
        """Test current ratio calculation with invalid inputs"""
        assert calculate_current_ratio(None, 200000000) is None
        assert calculate_current_ratio(400000000, None) is None
        assert calculate_current_ratio(400000000, 0) is None


class TestParsingFinancialStatements:
    """Test parsing DART financial statements"""

    @patch("app.services.dart_service.OpenDartReader")
    def test_parse_financial_metrics_success(
        self, mock_reader, mock_dart_data
    ):
        """Test parsing financial metrics from DART data"""
        service = DartService()
        service.dart = Mock()
        service._configured = True

        # Split mock data by statement type
        statements = {
            "BS": mock_dart_data[mock_dart_data["sj_div"] == "BS"],
            "IS": mock_dart_data[mock_dart_data["sj_div"] == "IS"],
            "CF": mock_dart_data[mock_dart_data["sj_div"] == "CF"],
        }

        metrics = service.parse_financial_metrics(statements)

        assert metrics is not None
        assert "roe" in metrics
        assert "roa" in metrics
        assert "operating_margin" in metrics
        assert "debt_ratio" in metrics
        assert "current_ratio" in metrics
        assert "operating_cashflow" in metrics

        # Verify calculated values
        assert metrics["roe"] is not None
        assert metrics["roa"] is not None
        assert metrics["operating_margin"] is not None

    def test_parse_financial_metrics_with_none_statements(self):
        """Test parsing with None statements"""
        service = DartService()
        statements = {"BS": None, "IS": None, "CF": None}

        metrics = service.parse_financial_metrics(statements)

        assert metrics is not None
        # All calculated metrics should be None when inputs are None
        assert metrics["roe"] is None
        assert metrics["roa"] is None


class TestRateLimiting:
    """Test rate limiting functionality"""

    def test_rate_limit_enforcement(self):
        """Test that rate limiting enforces minimum delay between requests"""
        import time

        service = DartService()

        # Make two "requests" without actual API calls
        start_time = time.time()
        service._rate_limit()
        service._rate_limit()
        elapsed = time.time() - start_time

        # Should have enforced at least 0.5s delay
        assert elapsed >= 0.4  # Allow some tolerance


class TestCorpCodeCaching:
    """Test corp code mapping and caching"""

    def test_corp_code_cache_stores_result(self):
        """Test that corp code cache stores mapping"""
        service = DartService()
        service._corp_code_cache["123456"] = "12345678"

        result = service.get_corp_code("123456")
        assert result == "12345678"

    def test_corp_code_cache_prevents_duplicate_lookups(self):
        """Test that cached values prevent duplicate API lookups"""
        service = DartService()
        service._corp_code_cache["999999"] = None  # Negative cache

        result = service.get_corp_code("999999")
        assert result is None


@pytest.mark.integration
class TestIntegrationWithMockedAPI:
    """Integration tests with mocked DART API"""

    @patch("app.services.dart_service.OpenDartReader")
    def test_calculate_metrics_from_stock_code(self, mock_reader, mock_dart_data):
        """Test full flow: stock code -> corp code -> metrics"""
        # Setup mocks
        mock_instance = Mock()
        mock_reader.return_value = mock_instance

        # Mock corp_code lookup
        corp_list = pd.DataFrame(
            {
                "stock_code": ["005930"],
                "corp_code": ["00126380"],
            }
        )
        mock_instance.list.return_value = corp_list

        # Mock financial statements
        mock_instance.finstate_all.return_value = mock_dart_data

        # Create service with mocked OpenDartReader
        service = DartService()
        service.dart = mock_instance
        service._configured = True

        # Test full flow
        metrics = service.calculate_metrics_from_stock_code("005930")

        assert metrics is not None
        assert metrics["roe"] is not None
        assert metrics["roa"] is not None
        assert metrics["operating_margin"] is not None

        # Verify API was called
        mock_instance.list.assert_called()


@pytest.mark.parametrize(
    "input_value,expected",
    [
        (0, 0.0),
        (100, 100.0),
        (-50, -50.0),
        (None, None),
    ],
)
def test_edge_cases(input_value, expected):
    """Test edge cases for metric calculations"""
    if input_value is None:
        result = calculate_roe(input_value, 100)
        assert result is None
    else:
        result = calculate_roe(input_value, 100)
        assert result is not None or expected is None

"""DART API integration service for Korean financial statements"""

import logging
import time
from datetime import datetime
from typing import Any, Dict, Optional

import pandas as pd
import OpenDartReader

from app.core.config import settings

logger = logging.getLogger(__name__)


class DartService:
    """DART API integration service for Korean financial statements"""

    RATE_LIMIT_SECONDS = 0.5

    def __init__(self):
        """Initialize DART service with API key from config"""
        self.api_key = settings.DART_API_KEY
        self.dart = None
        self._corp_code_cache: Dict[str, Optional[str]] = {}
        self._configured = False
        self._last_request_time: Optional[datetime] = None

        if self.api_key:
            try:
                self.dart = OpenDartReader.OpenDartReader(self.api_key)
                self._configured = True
                logger.info("DART API initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize DART API: {e}")
        else:
            logger.warning("DART_API_KEY not configured")

    def is_available(self) -> bool:
        """Check if DART API is configured and ready to use"""
        return self._configured and self.dart is not None

    def get_corp_code(self, stock_code: str) -> Optional[str]:
        """
        Convert 6-digit stock code to 8-digit DART corp_code

        Args:
            stock_code: 6-digit Korean stock code

        Returns:
            8-digit DART corporation code or None if not found
        """
        # Check cache first
        if stock_code in self._corp_code_cache:
            return self._corp_code_cache[stock_code]

        try:
            self._rate_limit()

            # Fetch corp_code list and filter
            corp_list = self.dart.list()
            match = corp_list[corp_list["stock_code"] == stock_code]

            if not match.empty:
                corp_code = str(match.iloc[0]["corp_code"])
                self._corp_code_cache[stock_code] = corp_code
                logger.info(f"Mapped stock {stock_code} to corp_code {corp_code}")
                return corp_code

            logger.warning(f"Corp code not found for stock {stock_code}")
            self._corp_code_cache[stock_code] = None
            return None
        except Exception as e:
            logger.error(f"Error fetching corp_code for {stock_code}: {e}")
            return None

    def fetch_financial_statements(
        self, corp_code: str, year: int, reprt_code: str = "11011"
    ) -> Optional[Dict[str, pd.DataFrame]]:
        """
        Fetch financial statements from DART

        Args:
            corp_code: 8-digit DART corporation code
            year: Fiscal year (YYYY format)
            reprt_code: Report code - 11011=Annual, 11012=Semi-annual, 11013=Q1, 11014=Q3

        Returns:
            Dictionary with 'BS', 'IS', 'CF' DataFrames or None if failed
        """
        try:
            self._rate_limit()

            logger.info(f"Fetching financial statements for corp {corp_code}, year {year}")

            df = self.dart.finstate_all(
                corp_code=corp_code,
                bsns_year=str(year),
                reprt_code=reprt_code,
                fs_div="CFS",  # Consolidated Financial Statements
            )

            if df is None or df.empty:
                logger.warning(f"No data for corp {corp_code}, year {year}")
                return None

            # Split by statement type
            statements = {
                "BS": df[df["sj_div"] == "BS"],  # Balance Sheet
                "IS": df[df["sj_div"] == "IS"],  # Income Statement
                "CF": df[df["sj_div"] == "CF"],  # Cash Flow
            }

            logger.info(
                f"Successfully fetched statements for {corp_code}: "
                f"BS={len(statements['BS'])} items, "
                f"IS={len(statements['IS'])} items, "
                f"CF={len(statements['CF'])} items"
            )

            return statements
        except Exception as e:
            logger.error(f"Error fetching statements for {corp_code}: {e}")
            return None

    def parse_financial_metrics(
        self, statements: Dict[str, pd.DataFrame]
    ) -> Optional[Dict[str, Any]]:
        """
        Parse DART financial statements into FinancialMetrics fields

        Args:
            statements: Dictionary with 'BS', 'IS', 'CF' DataFrames

        Returns:
            Dictionary with calculated financial metrics or None if failed
        """
        try:
            from app.utils.dart_mappings import (
                calculate_current_ratio,
                calculate_debt_ratio,
                calculate_operating_margin,
                calculate_roa,
                calculate_roe,
                extract_account,
            )

            bs = statements.get("BS")
            is_stmt = statements.get("IS")
            cf = statements.get("CF")

            # Extract raw values from financial statements
            total_assets = extract_account(bs, "자산총계")
            total_liabilities = extract_account(bs, "부채총계")
            total_equity = extract_account(bs, "자본총계")
            current_assets = extract_account(bs, "유동자산")
            current_liabilities = extract_account(bs, "유동부채")

            revenue = extract_account(is_stmt, "매출액")
            operating_income = extract_account(is_stmt, "영업이익")
            net_income = extract_account(is_stmt, "당기순이익")

            operating_cashflow = extract_account(cf, "영업활동현금흐름")

            # Calculate metrics
            metrics = {
                "roe": calculate_roe(net_income, total_equity),
                "roa": calculate_roa(net_income, total_assets),
                "operating_margin": calculate_operating_margin(operating_income, revenue),
                "debt_ratio": calculate_debt_ratio(total_liabilities, total_equity),
                "current_ratio": calculate_current_ratio(current_assets, current_liabilities),
                "operating_cashflow": operating_cashflow,
                # Note: PER, PBR, PSR require stock price - calculated separately
                "per": None,
                "pbr": None,
                "psr": None,
                "ev_ebitda": None,
                "net_profit_growth": None,  # Requires historical comparison
                "interest_coverage": None,
                "dividend_yield": None,
                "dividend_payout_ratio": None,
                "consecutive_dividend_years": None,
            }

            logger.info(
                f"Parsed metrics - ROE: {metrics['roe']}, ROA: {metrics['roa']}, "
                f"Op Margin: {metrics['operating_margin']}"
            )

            return metrics
        except Exception as e:
            logger.error(f"Error parsing metrics: {e}")
            return None

    def calculate_metrics_from_stock_code(
        self, stock_code: str, year: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """
        High-level method: Convert stock code directly to financial metrics

        Args:
            stock_code: 6-digit Korean stock code
            year: Fiscal year (defaults to previous year)

        Returns:
            Dictionary with calculated metrics or None if failed
        """
        if not self.is_available():
            logger.warning("DART service not available")
            return None

        if year is None:
            year = datetime.now().year - 1  # Use last year's annual report

        # Get corp_code
        corp_code = self.get_corp_code(stock_code)
        if not corp_code:
            logger.warning(f"Could not map {stock_code} to corp_code")
            return None

        # Fetch statements
        statements = self.fetch_financial_statements(corp_code, year)
        if not statements:
            logger.warning(f"Could not fetch statements for {stock_code}")
            return None

        # Parse metrics
        metrics = self.parse_financial_metrics(statements)
        if metrics:
            logger.info(f"Successfully calculated metrics for {stock_code}")
        else:
            logger.warning(f"Failed to parse metrics for {stock_code}")

        return metrics

    def _rate_limit(self) -> None:
        """Enforce delay between API requests to respect rate limits"""
        if self._last_request_time:
            elapsed = (datetime.now() - self._last_request_time).total_seconds()
            if elapsed < self.RATE_LIMIT_SECONDS:
                time.sleep(self.RATE_LIMIT_SECONDS - elapsed)

        self._last_request_time = datetime.now()


# Singleton instance
dart_service = DartService()

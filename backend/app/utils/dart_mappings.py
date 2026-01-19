"""DART account mappings and financial metric calculation utilities"""

import logging
from typing import Any, Dict, Optional

import pandas as pd

logger = logging.getLogger(__name__)

# Account name mappings (Korean → English)
ACCOUNT_NAMES = {
    # Balance Sheet
    "자산총계": "total_assets",
    "부채총계": "total_liabilities",
    "자본총계": "total_equity",
    "유동자산": "current_assets",
    "유동부채": "current_liabilities",
    # Income Statement
    "매출액": "revenue",
    "영업이익": "operating_income",
    "당기순이익": "net_income",
    "매출원가": "cost_of_sales",
    "이자비용": "interest_expense",
    # Cash Flow
    "영업활동현금흐름": "operating_cashflow",
}


def extract_account(df: Optional[pd.DataFrame], account_name: str) -> Optional[float]:
    """
    Extract account value from DART DataFrame

    Args:
        df: DataFrame containing account items
        account_name: Korean account name (e.g., "자산총계")

    Returns:
        Numeric value or None if not found or invalid
    """
    if df is None or df.empty:
        return None

    try:
        match = df[df["account_nm"] == account_name]
        if match.empty:
            logger.debug(f"Account '{account_name}' not found in DataFrame")
            return None

        # Get current term amount (thstrm_amount)
        value = match.iloc[0]["thstrm_amount"]
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return None

        return float(value) if value else None
    except Exception as e:
        logger.warning(f"Error extracting account '{account_name}': {e}")
        return None


def calculate_roe(
    net_income: Optional[float], total_equity: Optional[float]
) -> Optional[float]:
    """
    Calculate Return on Equity (ROE)

    ROE = (Net Income / Total Equity) * 100

    Args:
        net_income: Net income from income statement
        total_equity: Total equity from balance sheet

    Returns:
        ROE as percentage or None if inputs invalid
    """
    if net_income is None or total_equity is None or total_equity <= 0:
        return None

    try:
        return round((net_income / total_equity) * 100, 2)
    except Exception as e:
        logger.warning(f"Error calculating ROE: {e}")
        return None


def calculate_roa(
    net_income: Optional[float], total_assets: Optional[float]
) -> Optional[float]:
    """
    Calculate Return on Assets (ROA)

    ROA = (Net Income / Total Assets) * 100

    Args:
        net_income: Net income from income statement
        total_assets: Total assets from balance sheet

    Returns:
        ROA as percentage or None if inputs invalid
    """
    if net_income is None or total_assets is None or total_assets <= 0:
        return None

    try:
        return round((net_income / total_assets) * 100, 2)
    except Exception as e:
        logger.warning(f"Error calculating ROA: {e}")
        return None


def calculate_operating_margin(
    operating_income: Optional[float], revenue: Optional[float]
) -> Optional[float]:
    """
    Calculate Operating Profit Margin

    Operating Margin = (Operating Income / Revenue) * 100

    Args:
        operating_income: Operating income from income statement
        revenue: Total revenue/sales from income statement

    Returns:
        Operating margin as percentage or None if inputs invalid
    """
    if operating_income is None or revenue is None or revenue <= 0:
        return None

    try:
        return round((operating_income / revenue) * 100, 2)
    except Exception as e:
        logger.warning(f"Error calculating operating margin: {e}")
        return None


def calculate_debt_ratio(
    total_liabilities: Optional[float], total_equity: Optional[float]
) -> Optional[float]:
    """
    Calculate Debt to Equity Ratio

    Debt Ratio = (Total Liabilities / Total Equity) * 100

    Args:
        total_liabilities: Total liabilities from balance sheet
        total_equity: Total equity from balance sheet

    Returns:
        Debt ratio as percentage or None if inputs invalid
    """
    if total_liabilities is None or total_equity is None or total_equity <= 0:
        return None

    try:
        return round((total_liabilities / total_equity) * 100, 2)
    except Exception as e:
        logger.warning(f"Error calculating debt ratio: {e}")
        return None


def calculate_current_ratio(
    current_assets: Optional[float], current_liabilities: Optional[float]
) -> Optional[float]:
    """
    Calculate Current Ratio

    Current Ratio = (Current Assets / Current Liabilities) * 100

    Args:
        current_assets: Current assets from balance sheet
        current_liabilities: Current liabilities from balance sheet

    Returns:
        Current ratio as percentage or None if inputs invalid
    """
    if current_assets is None or current_liabilities is None or current_liabilities <= 0:
        return None

    try:
        return round((current_assets / current_liabilities) * 100, 2)
    except Exception as e:
        logger.warning(f"Error calculating current ratio: {e}")
        return None


def calculate_interest_coverage(
    operating_income: Optional[float], interest_expense: Optional[float]
) -> Optional[float]:
    """
    Calculate Interest Coverage Ratio

    Interest Coverage = Operating Income / Interest Expense

    Args:
        operating_income: Operating income from income statement
        interest_expense: Interest expense from income statement

    Returns:
        Interest coverage ratio or None if inputs invalid
    """
    if operating_income is None or interest_expense is None or interest_expense <= 0:
        return None

    try:
        return round(operating_income / interest_expense, 2)
    except Exception as e:
        logger.warning(f"Error calculating interest coverage: {e}")
        return None


def validate_metrics(metrics: Dict[str, Any]) -> tuple[bool, list[str]]:
    """
    Validate financial metrics before saving to database

    Args:
        metrics: Dictionary of calculated metrics

    Returns:
        Tuple of (is_valid: bool, errors: list of error messages)
    """
    errors = []

    # Check required fields
    required_fields = ["roe", "roa", "operating_margin", "debt_ratio", "current_ratio"]
    for field in required_fields:
        if metrics.get(field) is None:
            errors.append(f"Missing required field: {field}")

    # Validate ranges
    if metrics.get("roe") is not None:
        roe = metrics["roe"]
        if not -100 <= roe <= 100:
            errors.append(f"Invalid ROE: {roe} (must be between -100 and 100)")

    if metrics.get("roa") is not None:
        roa = metrics["roa"]
        if not -100 <= roa <= 100:
            errors.append(f"Invalid ROA: {roa} (must be between -100 and 100)")

    if metrics.get("operating_margin") is not None:
        op_margin = metrics["operating_margin"]
        if not -100 <= op_margin <= 100:
            errors.append(f"Invalid operating margin: {op_margin} (must be between -100 and 100)")

    if metrics.get("debt_ratio") is not None:
        debt = metrics["debt_ratio"]
        if debt < 0:
            errors.append(f"Invalid debt ratio: {debt} (must be >= 0)")

    if metrics.get("current_ratio") is not None:
        cr = metrics["current_ratio"]
        if cr < 0:
            errors.append(f"Invalid current ratio: {cr} (must be >= 0)")

    is_valid = len(errors) == 0
    return is_valid, errors

"""Stock Screener API routes"""

from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from app.db.database import get_db
from app.models.stock import Stock
from app.models.value_score import ValueScore
from app.models.financial_metrics import FinancialMetrics
from app.schemas.stock import ScreenerRequest, ScreenerResponse, ScreenerResult

router = APIRouter()


@router.post("", response_model=ScreenerResponse)
def screen_stocks(
    request: ScreenerRequest,
    db: Session = Depends(get_db),
):
    """Screen stocks based on custom filters"""

    filters = request.filters

    # Get latest date for value scores and financial metrics
    latest_value_score_date = db.query(ValueScore.date).order_by(desc(ValueScore.date)).first()
    latest_financial_date = db.query(FinancialMetrics.date).order_by(desc(FinancialMetrics.date)).first()

    if not latest_value_score_date or not latest_financial_date:
        return ScreenerResponse(
            results=[],
            total_count=0,
            filters_applied=filters,
        )

    # Build base query
    query = (
        db.query(Stock, ValueScore, FinancialMetrics)
        .join(ValueScore, Stock.code == ValueScore.stock_code)
        .join(
            FinancialMetrics,
            and_(
                Stock.code == FinancialMetrics.stock_code,
                FinancialMetrics.date == latest_financial_date[0]
            )
        )
        .filter(ValueScore.date == latest_value_score_date[0])
    )

    # Apply filters
    if "market" in filters and filters["market"]:
        markets = filters["market"]
        if isinstance(markets, list):
            query = query.filter(Stock.market.in_(markets))
        else:
            query = query.filter(Stock.market == markets)

    if "market_cap_min" in filters and filters["market_cap_min"]:
        query = query.filter(Stock.market_cap >= filters["market_cap_min"])

    if "market_cap_max" in filters and filters["market_cap_max"]:
        query = query.filter(Stock.market_cap <= filters["market_cap_max"])

    if "sector" in filters and filters["sector"]:
        sectors = filters["sector"]
        if isinstance(sectors, list):
            query = query.filter(Stock.sector.in_(sectors))
        else:
            query = query.filter(Stock.sector == sectors)

    # Financial filters
    if "PER_max" in filters and filters["PER_max"]:
        query = query.filter(FinancialMetrics.per <= filters["PER_max"])

    if "PBR_max" in filters and filters["PBR_max"]:
        query = query.filter(FinancialMetrics.pbr <= filters["PBR_max"])

    if "ROE_min" in filters and filters["ROE_min"]:
        query = query.filter(FinancialMetrics.roe >= filters["ROE_min"])

    if "debt_ratio_max" in filters and filters["debt_ratio_max"]:
        query = query.filter(FinancialMetrics.debt_ratio <= filters["debt_ratio_max"])

    if "dividend_yield_min" in filters and filters["dividend_yield_min"]:
        query = query.filter(FinancialMetrics.dividend_yield >= filters["dividend_yield_min"])

    # Value score filters
    if "value_score_min" in filters and filters["value_score_min"]:
        query = query.filter(ValueScore.total_score >= filters["value_score_min"])

    # Apply sorting
    if request.sort_by == "value_score":
        sort_column = ValueScore.total_score
    elif request.sort_by == "PER":
        sort_column = FinancialMetrics.per
    elif request.sort_by == "PBR":
        sort_column = FinancialMetrics.pbr
    elif request.sort_by == "ROE":
        sort_column = FinancialMetrics.roe
    elif request.sort_by == "market_cap":
        sort_column = Stock.market_cap
    else:
        sort_column = ValueScore.total_score

    if request.order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)

    # Apply limit
    query = query.limit(request.limit)

    # Execute query
    results = query.all()

    # Build response
    screener_results = []
    for stock, value_score, financial_metrics in results:
        result = ScreenerResult(
            stock_code=stock.code,
            stock_name=stock.name,
            value_score=value_score.total_score,
            current_price=stock.current_price,
            PER=financial_metrics.per,
            PBR=financial_metrics.pbr,
            ROE=financial_metrics.roe,
        )
        screener_results.append(result)

    return ScreenerResponse(
        results=screener_results,
        total_count=len(screener_results),
        filters_applied=filters,
    )

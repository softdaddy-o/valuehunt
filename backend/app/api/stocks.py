"""Stock API routes"""

from typing import Optional, List
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from app.db.database import get_db
from app.models.stock import Stock
from app.models.value_score import ValueScore
from app.models.financial_metrics import FinancialMetrics
from app.schemas.stock import (
    TopPicksResponse,
    TopPickItem,
    StockDetailResponse,
    StockResponse,
    KeyMetrics,
    CategoryScores,
)

router = APIRouter()


@router.get("/top-picks", response_model=TopPicksResponse)
def get_top_picks(
    market: Optional[str] = Query(None, description="KOSPI, KOSDAQ, or ALL"),
    limit: int = Query(20, ge=10, le=50, description="Number of results"),
    category: Optional[str] = Query(None, description="valuation, profitability, stability, dividend"),
    db: Session = Depends(get_db),
):
    """Get top value picks based on Value Score"""

    # Get latest date with value scores
    latest_date = db.query(ValueScore.date).order_by(desc(ValueScore.date)).first()
    if not latest_date:
        return TopPicksResponse(data=[], total_count=0, updated_at=datetime.utcnow())

    # Build query
    query = (
        db.query(Stock, ValueScore, FinancialMetrics)
        .join(ValueScore, Stock.code == ValueScore.stock_code)
        .outerjoin(
            FinancialMetrics,
            and_(
                Stock.code == FinancialMetrics.stock_code,
                FinancialMetrics.date == latest_date[0]
            )
        )
        .filter(ValueScore.date == latest_date[0])
        .filter(Stock.current_price.isnot(None))
    )

    # Filter by market
    if market and market != "ALL":
        query = query.filter(Stock.market == market)

    # Sort by category score if specified
    if category == "valuation":
        query = query.order_by(desc(ValueScore.valuation_score))
    elif category == "profitability":
        query = query.order_by(desc(ValueScore.profitability_score))
    elif category == "stability":
        query = query.order_by(desc(ValueScore.stability_score))
    elif category == "dividend":
        query = query.order_by(desc(ValueScore.dividend_score))
    else:
        query = query.order_by(desc(ValueScore.total_score))

    # Apply limit
    results = query.limit(limit).all()

    # Build response
    top_picks = []
    for rank, (stock, value_score, financial_metrics) in enumerate(results, start=1):
        # Build key metrics
        key_metrics = KeyMetrics(
            PER=financial_metrics.per if financial_metrics else None,
            PBR=financial_metrics.pbr if financial_metrics else None,
            ROE=financial_metrics.roe if financial_metrics else None,
            debt_ratio=financial_metrics.debt_ratio if financial_metrics else None,
            dividend_yield=financial_metrics.dividend_yield if financial_metrics else None,
        )

        # Build category scores
        category_scores = CategoryScores(
            valuation=value_score.valuation_score or 0,
            profitability=value_score.profitability_score or 0,
            stability=value_score.stability_score or 0,
            dividend=value_score.dividend_score or 0,
        )

        # Build upside potential string
        upside_potential = None
        if value_score.upside_potential:
            upside_potential = f"+{value_score.upside_potential}%"

        top_pick = TopPickItem(
            rank=rank,
            stock_code=stock.code,
            stock_name=stock.name,
            market=stock.market,
            current_price=stock.current_price,
            change_rate=stock.change_rate,
            value_score=value_score.total_score,
            category_scores=category_scores,
            key_metrics=key_metrics,
            ai_summary=value_score.ai_summary,
            upside_potential=upside_potential,
        )
        top_picks.append(top_pick)

    return TopPicksResponse(
        data=top_picks,
        total_count=len(top_picks),
        updated_at=datetime.combine(latest_date[0], datetime.min.time()),
    )


@router.get("/{stock_code}", response_model=StockDetailResponse)
def get_stock_detail(
    stock_code: str,
    db: Session = Depends(get_db),
):
    """Get detailed stock information"""

    # Get stock
    stock = db.query(Stock).filter(Stock.code == stock_code).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    # Get latest value score
    latest_value_score = (
        db.query(ValueScore)
        .filter(ValueScore.stock_code == stock_code)
        .order_by(desc(ValueScore.date))
        .first()
    )

    # Get latest financial metrics
    latest_financial = (
        db.query(FinancialMetrics)
        .filter(FinancialMetrics.stock_code == stock_code)
        .order_by(desc(FinancialMetrics.date))
        .first()
    )

    # Get historical financial metrics (last 4 quarters)
    historical_financial = (
        db.query(FinancialMetrics)
        .filter(FinancialMetrics.stock_code == stock_code)
        .order_by(desc(FinancialMetrics.date))
        .limit(4)
        .all()
    )

    # Build value score object
    value_score = {
        "total": latest_value_score.total_score if latest_value_score else 0,
        "valuation": latest_value_score.valuation_score if latest_value_score else 0,
        "profitability": latest_value_score.profitability_score if latest_value_score else 0,
        "stability": latest_value_score.stability_score if latest_value_score else 0,
        "dividend": latest_value_score.dividend_score if latest_value_score else 0,
    }

    # Build AI analysis object
    ai_analysis = {
        "summary": latest_value_score.ai_summary if latest_value_score else None,
        "strengths": latest_value_score.strengths if latest_value_score else [],
        "risks": latest_value_score.risks if latest_value_score else [],
    }

    # Build financial metrics object
    financial_metrics = {
        "current": {
            "PER": float(latest_financial.per) if latest_financial and latest_financial.per else None,
            "PBR": float(latest_financial.pbr) if latest_financial and latest_financial.pbr else None,
            "ROE": float(latest_financial.roe) if latest_financial and latest_financial.roe else None,
            "ROA": float(latest_financial.roa) if latest_financial and latest_financial.roa else None,
            "debt_ratio": float(latest_financial.debt_ratio) if latest_financial and latest_financial.debt_ratio else None,
            "current_ratio": float(latest_financial.current_ratio) if latest_financial and latest_financial.current_ratio else None,
            "dividend_yield": float(latest_financial.dividend_yield) if latest_financial and latest_financial.dividend_yield else None,
        } if latest_financial else {},
        "historical": [
            {
                "date": str(fm.date),
                "PER": float(fm.per) if fm.per else None,
                "PBR": float(fm.pbr) if fm.pbr else None,
                "ROE": float(fm.roe) if fm.roe else None,
            }
            for fm in historical_financial
        ],
        "sector_comparison": {
            "sector": stock.sector,
            "avg_PER": None,  # TODO: Calculate from database
            "avg_ROE": None,
            "avg_debt_ratio": None,
        },
    }

    # External links
    external_links = {
        "dart": f"https://dart.fss.or.kr/dsaf001/main.do?rcpNo=xxx",
        "news": f"https://finance.naver.com/item/main.nhn?code={stock_code}",
    }

    return StockDetailResponse(
        stock_info=stock,
        value_score=value_score,
        ai_analysis=ai_analysis,
        financial_metrics=financial_metrics,
        peer_comparison=None,  # TODO: Implement peer comparison
        external_links=external_links,
    )

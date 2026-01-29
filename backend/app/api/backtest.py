"""
API endpoints for backtesting functionality.
"""
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.backtest import BacktestRecommendation, BacktestRun, BacktestStatus
from app.schemas.backtest import (
    BacktestCreateRequest,
    BacktestRecommendation as BacktestRecommendationSchema,
    BacktestRun as BacktestRunSchema,
    BacktestRunCreate,
    BacktestRunSummary,
)
from app.services.backtest_analytics import BacktestAnalytics
from app.services.backtest_engine import BacktestEngine
from app.services.historical_data_service import HistoricalDataService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/backtest", tags=["backtest"])


def backtest_to_summary(bt: BacktestRun) -> BacktestRunSummary:
    """Convert a BacktestRun model to a BacktestRunSummary schema."""
    return BacktestRunSummary(
        id=bt.id,
        name=bt.name,
        strategy_type=bt.strategy_type,
        market=bt.market,
        simulation_date=bt.simulation_date,
        lookback_years=bt.lookback_years,
        holding_period_months=bt.holding_period_months,
        status=bt.status,
        created_at=bt.created_at,
        completed_at=bt.completed_at,
        total_recommendations=bt.total_recommendations,
        avg_return_pct=bt.avg_return_pct,
        win_rate_pct=bt.win_rate_pct,
        market_index_return_pct=bt.market_index_return_pct,
        alpha_pct=bt.alpha_pct,
        sharpe_ratio=bt.sharpe_ratio,
    )


async def run_backtest_background(backtest_id: int, db: Session):
    """Background task to run a backtest."""
    try:
        engine = BacktestEngine(db)
        await engine.run_backtest(backtest_id)
    except Exception as e:
        logger.error(f"Background backtest {backtest_id} failed: {str(e)}")


@router.post("/create", response_model=List[BacktestRunSummary])
async def create_backtest_series(
    request: BacktestCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Create a series of backtests over a time period and run them in the background.

    Args:
        request: Backtest creation request
        background_tasks: FastAPI background tasks
        db: Database session

    Returns:
        List of created backtest run summaries
    """
    try:
        engine = BacktestEngine(db)

        # Create backtest series
        backtest_runs = await engine.create_backtest_series(
            name=request.name,
            strategy_type=request.strategy_type,
            market=request.market,
            start_date=request.start_date,
            end_date=request.end_date,
            lookback_years=request.lookback_years,
            holding_period_months=request.holding_period_months,
            frequency=request.frequency,
        )

        # Queue each backtest to run in background
        for backtest in backtest_runs:
            background_tasks.add_task(run_backtest_background, backtest.id, db)

        logger.info(f"Created and queued {len(backtest_runs)} backtests")

        return [backtest_to_summary(bt) for bt in backtest_runs]

    except Exception as e:
        logger.error(f"Error creating backtest series: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/runs", response_model=BacktestRunSchema)
async def create_single_backtest(
    backtest_data: BacktestRunCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Create a single backtest run and execute it in the background.

    Args:
        backtest_data: Backtest run creation data
        background_tasks: FastAPI background tasks
        db: Database session

    Returns:
        Created backtest run
    """
    try:
        backtest = BacktestRun(**backtest_data.model_dump())
        db.add(backtest)
        db.commit()
        db.refresh(backtest)

        # Queue backtest to run in background
        background_tasks.add_task(run_backtest_background, backtest.id, db)

        logger.info(f"Created backtest run {backtest.id}: {backtest.name}")
        return backtest

    except Exception as e:
        logger.error(f"Error creating backtest run: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/runs", response_model=List[BacktestRunSummary])
async def list_backtests(
    strategy_type: Optional[str] = None,
    market: Optional[str] = None,
    status: Optional[BacktestStatus] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    List backtest runs with optional filters.

    Args:
        strategy_type: Filter by strategy type
        market: Filter by market
        status: Filter by status
        limit: Maximum number of results
        offset: Offset for pagination
        db: Database session

    Returns:
        List of backtest run summaries
    """
    query = db.query(BacktestRun)

    if strategy_type:
        query = query.filter(BacktestRun.strategy_type == strategy_type)

    if market:
        query = query.filter(BacktestRun.market == market)

    if status:
        query = query.filter(BacktestRun.status == status)

    backtests = query.order_by(BacktestRun.created_at.desc()).offset(offset).limit(limit).all()

    return [backtest_to_summary(bt) for bt in backtests]


@router.get("/runs/{backtest_id}", response_model=BacktestRunSchema)
async def get_backtest_detail(backtest_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific backtest run.

    Args:
        backtest_id: ID of backtest run
        db: Database session

    Returns:
        Detailed backtest run with recommendations
    """
    backtest = db.query(BacktestRun).filter(BacktestRun.id == backtest_id).first()

    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest run not found")

    return backtest


@router.get("/runs/{backtest_id}/recommendations", response_model=List[BacktestRecommendationSchema])
async def get_backtest_recommendations(
    backtest_id: int,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    Get recommendations from a specific backtest run.

    Args:
        backtest_id: ID of backtest run
        limit: Maximum number of results
        offset: Offset for pagination
        db: Database session

    Returns:
        List of backtest recommendations
    """
    recommendations = (
        db.query(BacktestRecommendation)
        .filter(BacktestRecommendation.backtest_run_id == backtest_id)
        .order_by(BacktestRecommendation.recommendation_rank)
        .offset(offset)
        .limit(limit)
        .all()
    )

    return recommendations


@router.post("/runs/{backtest_id}/execute")
async def execute_backtest(
    backtest_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Execute a pending backtest run.

    Args:
        backtest_id: ID of backtest run
        background_tasks: FastAPI background tasks
        db: Database session

    Returns:
        Success message
    """
    backtest = db.query(BacktestRun).filter(BacktestRun.id == backtest_id).first()

    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest run not found")

    if backtest.status != BacktestStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Backtest is in {backtest.status} status, cannot execute",
        )

    # Queue backtest to run in background
    background_tasks.add_task(run_backtest_background, backtest_id, db)

    return {"message": f"Backtest {backtest_id} queued for execution"}


@router.delete("/runs/{backtest_id}")
async def delete_backtest(backtest_id: int, db: Session = Depends(get_db)):
    """
    Delete a backtest run and all its recommendations.

    Args:
        backtest_id: ID of backtest run
        db: Database session

    Returns:
        Success message
    """
    backtest = db.query(BacktestRun).filter(BacktestRun.id == backtest_id).first()

    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest run not found")

    db.delete(backtest)
    db.commit()

    logger.info(f"Deleted backtest run {backtest_id}")
    return {"message": f"Backtest {backtest_id} deleted successfully"}


@router.get("/analytics/compare")
async def compare_strategies(
    strategy_types: Optional[str] = None,
    market: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Compare performance across different strategies.

    Args:
        strategy_types: Comma-separated list of strategy types
        market: Filter by market
        db: Database session

    Returns:
        Strategy comparison data
    """
    analytics = BacktestAnalytics(db)

    strategy_list = strategy_types.split(",") if strategy_types else None

    comparison = analytics.compare_strategies(strategy_types=strategy_list, market=market)

    return comparison


@router.get("/analytics/runs/{backtest_id}/patterns")
async def analyze_recommendation_patterns(backtest_id: int, db: Session = Depends(get_db)):
    """
    Analyze patterns in recommendations from a backtest run.

    Args:
        backtest_id: ID of backtest run
        db: Database session

    Returns:
        Pattern analysis data
    """
    analytics = BacktestAnalytics(db)
    patterns = analytics.analyze_recommendation_patterns(backtest_id)

    return patterns


@router.get("/analytics/time-series")
async def get_time_series_performance(
    strategy_type: Optional[str] = None,
    market: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get time series of backtest performance over time.

    Args:
        strategy_type: Filter by strategy type
        market: Filter by market
        db: Database session

    Returns:
        Time series performance data
    """
    analytics = BacktestAnalytics(db)
    time_series = analytics.get_time_series_performance(
        strategy_type=strategy_type, market=market
    )

    return time_series


@router.get("/analytics/summary")
async def get_summary_statistics(db: Session = Depends(get_db)):
    """
    Get overall summary statistics for all backtests.

    Args:
        db: Database session

    Returns:
        Summary statistics
    """
    analytics = BacktestAnalytics(db)
    summary = analytics.get_summary_statistics()

    return summary


@router.get("/analytics/stock-frequency")
async def get_stock_frequency_analysis(
    min_occurrences: int = 2, db: Session = Depends(get_db)
):
    """
    Find stocks that appear frequently across multiple backtests.

    Args:
        min_occurrences: Minimum number of times stock must appear
        db: Database session

    Returns:
        Stock frequency analysis
    """
    analytics = BacktestAnalytics(db)
    frequency = analytics.get_stock_frequency_analysis(min_occurrences=min_occurrences)

    return {"frequent_stocks": frequency}


@router.post("/data/collect-historical-prices")
async def collect_historical_prices(
    start_date: datetime,
    end_date: datetime,
    market: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    """
    Collect historical price data for backtesting.

    Args:
        start_date: Start date for data collection
        end_date: End date for data collection
        market: Optional market filter
        background_tasks: FastAPI background tasks
        db: Database session

    Returns:
        Success message
    """
    try:
        historical_service = HistoricalDataService(db)

        # Run in background for large datasets
        if background_tasks:
            background_tasks.add_task(
                historical_service.collect_all_historical_prices,
                start_date,
                end_date,
                market,
            )
            return {
                "message": "Historical price collection started in background",
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            }
        else:
            # Run synchronously for small requests
            results = await historical_service.collect_all_historical_prices(
                start_date, end_date, market
            )
            return {
                "message": "Historical price collection completed",
                "results": results,
            }

    except Exception as e:
        logger.error(f"Error collecting historical prices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

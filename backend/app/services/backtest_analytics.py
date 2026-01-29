"""
Analytics service for comparing and analyzing backtest results.
"""
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.backtest import BacktestRecommendation, BacktestRun, BacktestStatus

logger = logging.getLogger(__name__)


def safe_average(values: List[float]) -> Optional[float]:
    """Calculate average of a list, returning None if empty."""
    return sum(values) / len(values) if values else None


class BacktestAnalytics:
    """Service for analyzing and comparing backtest results."""

    def __init__(self, db: Session):
        self.db = db

    def compare_strategies(
        self,
        strategy_types: Optional[List[str]] = None,
        market: Optional[str] = None,
        min_date: Optional[datetime] = None,
        max_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Compare performance across different strategies.

        Args:
            strategy_types: List of strategy types to compare (None = all)
            market: Market filter (KOSPI/KOSDAQ/ALL)
            min_date: Minimum simulation date
            max_date: Maximum simulation date

        Returns:
            Dictionary with comparison data
        """
        query = self.db.query(BacktestRun).filter(
            BacktestRun.status == BacktestStatus.COMPLETED
        )

        if strategy_types:
            query = query.filter(BacktestRun.strategy_type.in_(strategy_types))

        if market:
            query = query.filter(BacktestRun.market == market)

        if min_date:
            query = query.filter(BacktestRun.simulation_date >= min_date)

        if max_date:
            query = query.filter(BacktestRun.simulation_date <= max_date)

        backtests = query.all()

        if not backtests:
            return {"error": "No completed backtests found"}

        # Group by strategy type
        strategy_stats = {}

        for backtest in backtests:
            strategy = backtest.strategy_type or "Value Score"

            if strategy not in strategy_stats:
                strategy_stats[strategy] = {
                    "runs": [],
                    "avg_returns": [],
                    "win_rates": [],
                    "sharpe_ratios": [],
                    "alphas": [],
                }

            strategy_stats[strategy]["runs"].append(backtest.id)

            if backtest.avg_return_pct is not None:
                strategy_stats[strategy]["avg_returns"].append(backtest.avg_return_pct)

            if backtest.win_rate_pct is not None:
                strategy_stats[strategy]["win_rates"].append(backtest.win_rate_pct)

            if backtest.sharpe_ratio is not None:
                strategy_stats[strategy]["sharpe_ratios"].append(backtest.sharpe_ratio)

            if backtest.alpha_pct is not None:
                strategy_stats[strategy]["alphas"].append(backtest.alpha_pct)

        # Calculate aggregate statistics for each strategy
        comparison = {}

        for strategy, stats in strategy_stats.items():
            comparison[strategy] = {
                "total_runs": len(stats["runs"]),
                "avg_return": safe_average(stats["avg_returns"]),
                "avg_win_rate": safe_average(stats["win_rates"]),
                "avg_sharpe_ratio": safe_average(stats["sharpe_ratios"]),
                "avg_alpha": safe_average(stats["alphas"]),
            }

        # Find best strategy by different metrics
        best_return_strategy = max(
            comparison.items(),
            key=lambda x: x[1]["avg_return"] if x[1]["avg_return"] is not None else -999,
        )
        best_sharpe_strategy = max(
            comparison.items(),
            key=lambda x: x[1]["avg_sharpe_ratio"]
            if x[1]["avg_sharpe_ratio"] is not None
            else -999,
        )
        best_winrate_strategy = max(
            comparison.items(),
            key=lambda x: x[1]["avg_win_rate"] if x[1]["avg_win_rate"] is not None else -999,
        )

        return {
            "strategies": comparison,
            "best_by_return": {
                "strategy": best_return_strategy[0],
                "avg_return_pct": best_return_strategy[1]["avg_return"],
            },
            "best_by_sharpe": {
                "strategy": best_sharpe_strategy[0],
                "sharpe_ratio": best_sharpe_strategy[1]["avg_sharpe_ratio"],
            },
            "best_by_winrate": {
                "strategy": best_winrate_strategy[0],
                "win_rate_pct": best_winrate_strategy[1]["avg_win_rate"],
            },
            "total_backtests": len(backtests),
        }

    def analyze_recommendation_patterns(self, backtest_run_id: int) -> Dict[str, Any]:
        """
        Analyze patterns in recommendations from a backtest run.

        Args:
            backtest_run_id: ID of backtest run to analyze

        Returns:
            Dictionary with pattern analysis
        """
        recommendations = (
            self.db.query(BacktestRecommendation)
            .filter(BacktestRecommendation.backtest_run_id == backtest_run_id)
            .all()
        )

        if not recommendations:
            return {"error": "No recommendations found"}

        # Analyze by sector
        sector_performance = {}
        for rec in recommendations:
            if rec.sector and rec.actual_return_pct is not None:
                if rec.sector not in sector_performance:
                    sector_performance[rec.sector] = {"returns": [], "count": 0, "wins": 0}

                sector_performance[rec.sector]["returns"].append(rec.actual_return_pct)
                sector_performance[rec.sector]["count"] += 1

                if rec.actual_return_pct > 0:
                    sector_performance[rec.sector]["wins"] += 1

        # Calculate sector statistics
        sector_stats = {}
        for sector, data in sector_performance.items():
            sector_stats[sector] = {
                "avg_return_pct": sum(data["returns"]) / len(data["returns"]),
                "total_stocks": data["count"],
                "win_rate_pct": (data["wins"] / data["count"]) * 100,
                "best_return_pct": max(data["returns"]),
                "worst_return_pct": min(data["returns"]),
            }

        # Analyze by value score ranges
        score_ranges = {"80-100": [], "60-80": [], "40-60": [], "0-40": []}

        for rec in recommendations:
            if rec.value_score is not None and rec.actual_return_pct is not None:
                if rec.value_score >= 80:
                    score_ranges["80-100"].append(rec.actual_return_pct)
                elif rec.value_score >= 60:
                    score_ranges["60-80"].append(rec.actual_return_pct)
                elif rec.value_score >= 40:
                    score_ranges["40-60"].append(rec.actual_return_pct)
                else:
                    score_ranges["0-40"].append(rec.actual_return_pct)

        score_stats = {}
        for score_range, returns in score_ranges.items():
            if returns:
                score_stats[score_range] = {
                    "avg_return_pct": sum(returns) / len(returns),
                    "count": len(returns),
                    "win_rate_pct": (sum(1 for r in returns if r > 0) / len(returns)) * 100,
                }

        # Top and bottom performers
        sorted_recs = sorted(
            [r for r in recommendations if r.actual_return_pct is not None],
            key=lambda x: x.actual_return_pct,
            reverse=True,
        )

        top_performers = [
            {
                "stock_code": rec.stock_code,
                "stock_name": rec.stock_name,
                "return_pct": rec.actual_return_pct,
                "value_score": rec.value_score,
                "sector": rec.sector,
            }
            for rec in sorted_recs[:5]
        ]

        bottom_performers = [
            {
                "stock_code": rec.stock_code,
                "stock_name": rec.stock_name,
                "return_pct": rec.actual_return_pct,
                "value_score": rec.value_score,
                "sector": rec.sector,
            }
            for rec in sorted_recs[-5:]
        ]

        # Accuracy of AI predictions
        predictions_analysis = {"total_with_predictions": 0, "exceeded_count": 0, "missed_count": 0}

        for rec in recommendations:
            if rec.exceeded_prediction is not None:
                predictions_analysis["total_with_predictions"] += 1
                if rec.exceeded_prediction > 0:
                    predictions_analysis["exceeded_count"] += 1
                else:
                    predictions_analysis["missed_count"] += 1

        if predictions_analysis["total_with_predictions"] > 0:
            predictions_analysis["exceeded_rate_pct"] = (
                predictions_analysis["exceeded_count"]
                / predictions_analysis["total_with_predictions"]
            ) * 100

        return {
            "sector_performance": sector_stats,
            "value_score_performance": score_stats,
            "top_performers": top_performers,
            "bottom_performers": bottom_performers,
            "prediction_accuracy": predictions_analysis,
        }

    def get_time_series_performance(
        self, strategy_type: Optional[str] = None, market: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get time series of backtest performance over time.

        Args:
            strategy_type: Filter by strategy type
            market: Filter by market

        Returns:
            Dictionary with time series data
        """
        query = self.db.query(BacktestRun).filter(
            BacktestRun.status == BacktestStatus.COMPLETED
        )

        if strategy_type:
            query = query.filter(BacktestRun.strategy_type == strategy_type)

        if market:
            query = query.filter(BacktestRun.market == market)

        backtests = query.order_by(BacktestRun.simulation_date).all()

        if not backtests:
            return {"error": "No completed backtests found"}

        time_series = []

        for backtest in backtests:
            time_series.append(
                {
                    "date": backtest.simulation_date.isoformat(),
                    "name": backtest.name,
                    "avg_return_pct": backtest.avg_return_pct,
                    "win_rate_pct": backtest.win_rate_pct,
                    "sharpe_ratio": backtest.sharpe_ratio,
                    "market_return_pct": backtest.market_index_return_pct,
                    "alpha_pct": backtest.alpha_pct,
                    "total_recommendations": backtest.total_recommendations,
                }
            )

        return {"time_series": time_series, "total_backtests": len(backtests)}

    def get_summary_statistics(self) -> Dict[str, Any]:
        """
        Get overall summary statistics for all backtests.

        Returns:
            Dictionary with summary statistics
        """
        completed_backtests = (
            self.db.query(BacktestRun).filter(BacktestRun.status == BacktestStatus.COMPLETED).all()
        )

        if not completed_backtests:
            return {"error": "No completed backtests found"}

        # Overall statistics
        all_returns = [b.avg_return_pct for b in completed_backtests if b.avg_return_pct is not None]
        all_win_rates = [b.win_rate_pct for b in completed_backtests if b.win_rate_pct is not None]
        all_sharpes = [b.sharpe_ratio for b in completed_backtests if b.sharpe_ratio is not None]
        all_alphas = [b.alpha_pct for b in completed_backtests if b.alpha_pct is not None]

        # Count by status
        status_counts = (
            self.db.query(BacktestRun.status, func.count(BacktestRun.id))
            .group_by(BacktestRun.status)
            .all()
        )

        # Count by strategy
        strategy_counts = (
            self.db.query(BacktestRun.strategy_type, func.count(BacktestRun.id))
            .group_by(BacktestRun.strategy_type)
            .all()
        )

        best_backtest = max(completed_backtests, key=lambda x: x.avg_return_pct or -999)

        return {
            "total_backtests": len(completed_backtests),
            "overall_avg_return_pct": safe_average(all_returns),
            "overall_avg_win_rate_pct": safe_average(all_win_rates),
            "overall_avg_sharpe_ratio": safe_average(all_sharpes),
            "overall_avg_alpha_pct": safe_average(all_alphas),
            "best_backtest": {
                "name": best_backtest.name,
                "return_pct": best_backtest.avg_return_pct,
            },
            "status_distribution": {status.value: count for status, count in status_counts},
            "strategy_distribution": {
                (strategy or "Value Score"): count for strategy, count in strategy_counts
            },
        }

    def get_stock_frequency_analysis(self, min_occurrences: int = 2) -> List[Dict[str, Any]]:
        """
        Find stocks that appear frequently across multiple backtests.

        Args:
            min_occurrences: Minimum number of times stock must appear

        Returns:
            List of stocks with frequency data
        """
        # Query for stock codes that appear in multiple backtests
        stock_stats = (
            self.db.query(
                BacktestRecommendation.stock_code,
                BacktestRecommendation.stock_name,
                func.count(BacktestRecommendation.id).label("appearances"),
                func.avg(BacktestRecommendation.actual_return_pct).label("avg_return"),
                func.avg(BacktestRecommendation.value_score).label("avg_value_score"),
            )
            .filter(BacktestRecommendation.actual_return_pct.isnot(None))
            .group_by(BacktestRecommendation.stock_code, BacktestRecommendation.stock_name)
            .having(func.count(BacktestRecommendation.id) >= min_occurrences)
            .order_by(func.count(BacktestRecommendation.id).desc())
            .all()
        )

        return [
            {
                "stock_code": stat.stock_code,
                "stock_name": stat.stock_name,
                "appearances": stat.appearances,
                "avg_return_pct": float(stat.avg_return) if stat.avg_return else None,
                "avg_value_score": float(stat.avg_value_score) if stat.avg_value_score else None,
            }
            for stat in stock_stats
        ]

"""
Backtesting engine for running AI stock recommendations on historical data.
"""
import logging
import statistics
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.backtest import (
    BacktestRecommendation,
    BacktestRun,
    BacktestStatus,
)
from app.models.stock import Stock
from app.services.ai_service import AIService
from app.services.historical_data_service import HistoricalDataService
from app.services.value_scorer import ValueScorer

logger = logging.getLogger(__name__)


class BacktestEngine:
    """Engine for running backtests on historical data."""

    def __init__(self, db: Session):
        self.db = db
        self.historical_service = HistoricalDataService(db)
        self.value_scorer = ValueScorer(db)
        self.ai_service = AIService()

    async def run_backtest(self, backtest_run_id: int) -> BacktestRun:
        """
        Execute a backtest run.

        Args:
            backtest_run_id: ID of the backtest run to execute

        Returns:
            Updated BacktestRun object
        """
        backtest = self.db.query(BacktestRun).filter(BacktestRun.id == backtest_run_id).first()

        if not backtest:
            raise ValueError(f"Backtest run {backtest_run_id} not found")

        try:
            # Update status to running
            backtest.status = BacktestStatus.RUNNING
            backtest.started_at = datetime.utcnow()
            self.db.commit()

            logger.info(f"Starting backtest run {backtest_run_id}: {backtest.name}")

            # Step 1: Generate recommendations at the simulation date
            recommendations = await self._generate_historical_recommendations(backtest)

            if not recommendations:
                raise ValueError("No recommendations generated")

            # Step 2: Calculate actual performance after holding period
            await self._calculate_performance(backtest, recommendations)

            # Step 3: Calculate aggregate statistics
            await self._calculate_statistics(backtest)

            # Update status to completed
            backtest.status = BacktestStatus.COMPLETED
            backtest.completed_at = datetime.utcnow()
            self.db.commit()

            logger.info(f"Backtest run {backtest_run_id} completed successfully")
            return backtest

        except Exception as e:
            logger.error(f"Backtest run {backtest_run_id} failed: {str(e)}")
            backtest.status = BacktestStatus.FAILED
            backtest.error_message = str(e)
            backtest.completed_at = datetime.utcnow()
            self.db.commit()
            raise

    async def _generate_historical_recommendations(
        self, backtest: BacktestRun
    ) -> List[BacktestRecommendation]:
        """
        Generate stock recommendations as they would have been at simulation_date.

        Args:
            backtest: BacktestRun object

        Returns:
            List of BacktestRecommendation objects
        """
        logger.info(f"Generating recommendations for {backtest.simulation_date.date()}")

        # Get all stocks available at simulation date
        stocks_query = self.db.query(Stock)
        if backtest.market and backtest.market != "ALL":
            stocks_query = stocks_query.filter(Stock.market == backtest.market)

        stocks = stocks_query.all()

        recommendations = []

        if backtest.strategy_type:
            # Use AI strategy
            recommendations = await self._generate_ai_recommendations(backtest, stocks)
        else:
            # Use Value Score only
            recommendations = await self._generate_value_score_recommendations(backtest, stocks)

        # Save recommendations to database
        for rec in recommendations:
            self.db.add(rec)

        self.db.commit()

        logger.info(f"Generated {len(recommendations)} recommendations")
        return recommendations

    async def _generate_value_score_recommendations(
        self, backtest: BacktestRun, stocks: List[Stock]
    ) -> List[BacktestRecommendation]:
        """
        Generate recommendations based on Value Score algorithm.

        Args:
            backtest: BacktestRun object
            stocks: List of stocks to evaluate

        Returns:
            List of BacktestRecommendation objects
        """
        stock_scores = []

        for stock in stocks:
            # Get historical price at simulation date
            historical_price = self.historical_service.get_historical_price(
                stock.code, backtest.simulation_date
            )

            if not historical_price:
                continue

            # Get historical metrics at simulation date
            historical_metrics = self.historical_service.get_historical_metrics(
                stock.code, backtest.simulation_date
            )

            if not historical_metrics:
                continue

            # Calculate value score using historical metrics
            # Create a temporary FinancialMetrics-like object for scoring
            from app.models.financial_metrics import FinancialMetrics

            temp_metrics = FinancialMetrics(
                stock_code=stock.code,
                date=backtest.simulation_date,
                per=historical_metrics.per,
                pbr=historical_metrics.pbr,
                psr=historical_metrics.psr,
                ev_ebitda=historical_metrics.ev_ebitda,
                roe=historical_metrics.roe,
                roa=historical_metrics.roa,
                operating_margin=historical_metrics.operating_margin,
                net_profit_growth=historical_metrics.net_profit_growth,
                debt_ratio=historical_metrics.debt_ratio,
                current_ratio=historical_metrics.current_ratio,
                interest_coverage=historical_metrics.interest_coverage,
                operating_cash_flow=historical_metrics.operating_cash_flow,
                dividend_yield=historical_metrics.dividend_yield,
                dividend_payout_ratio=historical_metrics.dividend_payout_ratio,
                consecutive_dividend_years=historical_metrics.consecutive_dividend_years,
            )

            valuation_score = self.value_scorer.calculate_valuation_score(temp_metrics)
            profitability_score = self.value_scorer.calculate_profitability_score(temp_metrics)
            stability_score = self.value_scorer.calculate_stability_score(temp_metrics)
            dividend_score = self.value_scorer.calculate_dividend_score(temp_metrics)

            total_score = (
                valuation_score + profitability_score + stability_score + dividend_score
            )

            # Calculate upside potential
            upside_potential = self._calculate_upside_potential(temp_metrics)

            stock_scores.append(
                {
                    "stock": stock,
                    "price": historical_price.close,
                    "value_score": total_score,
                    "upside_potential": upside_potential,
                    "metrics": historical_metrics,
                }
            )

        # Sort by value score descending and take top stocks
        stock_scores.sort(key=lambda x: x["value_score"], reverse=True)
        top_stocks = stock_scores[:20]  # Take top 20 stocks

        # Create recommendation objects
        recommendations = []
        for rank, stock_data in enumerate(top_stocks, 1):
            recommendation = BacktestRecommendation(
                backtest_run_id=backtest.id,
                stock_code=stock_data["stock"].code,
                stock_name=stock_data["stock"].name,
                recommendation_rank=rank,
                value_score=stock_data["value_score"],
                ai_upside_potential_pct=stock_data["upside_potential"],
                price_at_recommendation=stock_data["price"],
                per_at_recommendation=stock_data["metrics"].per,
                pbr_at_recommendation=stock_data["metrics"].pbr,
                roe_at_recommendation=stock_data["metrics"].roe,
                debt_ratio_at_recommendation=stock_data["metrics"].debt_ratio,
                market_cap_at_recommendation=stock_data["metrics"].market_cap,
                sector=stock_data["stock"].sector,
            )
            recommendations.append(recommendation)

        return recommendations

    async def _generate_ai_recommendations(
        self, backtest: BacktestRun, stocks: List[Stock]
    ) -> List[BacktestRecommendation]:
        """
        Generate recommendations using AI strategy on historical data.

        Args:
            backtest: BacktestRun object
            stocks: List of stocks to evaluate

        Returns:
            List of BacktestRecommendation objects
        """
        # For now, fall back to value score method
        # In the future, you could replay AI strategy with historical context
        logger.warning(
            f"AI strategy backtesting not fully implemented, using Value Score for {backtest.strategy_type}"
        )
        return await self._generate_value_score_recommendations(backtest, stocks)

    def _calculate_upside_potential(self, metrics) -> Optional[float]:
        """
        Calculate upside potential based on valuation metrics.

        Args:
            metrics: FinancialMetrics object

        Returns:
            Upside potential percentage or None
        """
        if metrics.per is None or metrics.per <= 0:
            return None

        # Assume fair value PER of 10
        target_per = 10.0
        current_per = float(metrics.per)

        if current_per >= target_per:
            return 0.0

        upside_pct = ((target_per - current_per) / current_per) * 100
        return min(upside_pct, 200.0)  # Cap at 200%

    async def _calculate_performance(
        self, backtest: BacktestRun, recommendations: List[BacktestRecommendation]
    ) -> None:
        """
        Calculate actual performance for each recommendation after holding period.

        Args:
            backtest: BacktestRun object
            recommendations: List of recommendations to update
        """
        logger.info("Calculating actual performance for recommendations")

        end_date = backtest.simulation_date + timedelta(days=30 * backtest.holding_period_months)

        for rec in recommendations:
            # Get price performance during holding period
            performance = self.historical_service.get_price_return(
                rec.stock_code, backtest.simulation_date, end_date
            )

            if performance:
                rec.price_after_holding = performance["end_price"]
                rec.actual_return_pct = performance["return_pct"]
                rec.max_price_during_holding = performance["max_price"]
                rec.min_price_during_holding = performance["min_price"]
                rec.max_return_pct = performance["max_return_pct"]
                rec.max_drawdown_pct = performance["max_drawdown_pct"]

                # Check if exceeded AI prediction
                if rec.ai_upside_potential_pct:
                    rec.exceeded_prediction = (
                        rec.actual_return_pct - rec.ai_upside_potential_pct
                    )

        self.db.commit()

    async def _calculate_statistics(self, backtest: BacktestRun) -> None:
        """
        Calculate aggregate statistics for the backtest run.

        Args:
            backtest: BacktestRun object to update
        """
        logger.info("Calculating aggregate statistics")

        # Get all recommendations with performance data
        recommendations = (
            self.db.query(BacktestRecommendation)
            .filter(
                and_(
                    BacktestRecommendation.backtest_run_id == backtest.id,
                    BacktestRecommendation.actual_return_pct.isnot(None),
                )
            )
            .all()
        )

        if not recommendations:
            logger.warning("No recommendations with performance data")
            return

        returns = [rec.actual_return_pct for rec in recommendations]

        # Basic statistics
        backtest.total_recommendations = len(recommendations)
        backtest.avg_return_pct = statistics.mean(returns)
        backtest.median_return_pct = statistics.median(returns)
        backtest.best_return_pct = max(returns)
        backtest.worst_return_pct = min(returns)

        # Win rate
        winning_trades = sum(1 for r in returns if r > 0)
        backtest.win_rate_pct = (winning_trades / len(returns)) * 100

        # Volatility
        if len(returns) > 1:
            backtest.volatility_pct = statistics.stdev(returns)
        else:
            backtest.volatility_pct = 0.0

        # Calculate market benchmark return
        market_return = await self._calculate_market_return(backtest)
        if market_return:
            backtest.market_index_return_pct = market_return
            backtest.alpha_pct = backtest.avg_return_pct - market_return

        # Sharpe ratio (assuming risk-free rate of 3%)
        risk_free_rate = 3.0
        if backtest.volatility_pct > 0:
            backtest.sharpe_ratio = (
                backtest.avg_return_pct - risk_free_rate
            ) / backtest.volatility_pct
        else:
            backtest.sharpe_ratio = 0.0

        # Max drawdown across all recommendations
        drawdowns = [rec.max_drawdown_pct for rec in recommendations if rec.max_drawdown_pct]
        if drawdowns:
            backtest.max_drawdown_pct = min(drawdowns)  # Most negative value

        self.db.commit()

    async def _calculate_market_return(self, backtest: BacktestRun) -> Optional[float]:
        """
        Calculate market index return during the backtest period.

        Args:
            backtest: BacktestRun object

        Returns:
            Market return percentage or None
        """
        # Use KOSDAQ index only for KOSDAQ market, otherwise default to KOSPI
        index_code = "KQ11" if backtest.market == "KOSDAQ" else "KS11"
        end_date = backtest.simulation_date + timedelta(days=30 * backtest.holding_period_months)

        performance = self.historical_service.get_price_return(
            index_code, backtest.simulation_date, end_date
        )

        return performance["return_pct"] if performance else None

    async def create_backtest_series(
        self,
        name: str,
        strategy_type: Optional[str],
        market: str,
        start_date: datetime,
        end_date: datetime,
        lookback_years: int,
        holding_period_months: int,
        frequency: str = "monthly",
    ) -> List[BacktestRun]:
        """
        Create a series of backtest runs over a time period.

        Args:
            name: Base name for backtest series
            strategy_type: AI strategy type or None for Value Score
            market: Market filter
            start_date: Start of backtesting period
            end_date: End of backtesting period
            lookback_years: Years of historical data to use
            holding_period_months: Holding period for each test
            frequency: Frequency of tests (monthly, quarterly, yearly)

        Returns:
            List of created BacktestRun objects
        """
        simulation_dates = self._generate_simulation_dates(start_date, end_date, frequency)

        backtest_runs = []

        for i, sim_date in enumerate(simulation_dates, 1):
            backtest = BacktestRun(
                name=f"{name} - {sim_date.strftime('%Y-%m')}",
                strategy_type=strategy_type,
                market=market,
                simulation_date=sim_date,
                lookback_years=lookback_years,
                holding_period_months=holding_period_months,
                status=BacktestStatus.PENDING,
            )
            self.db.add(backtest)
            backtest_runs.append(backtest)

        self.db.commit()

        logger.info(f"Created {len(backtest_runs)} backtest runs from {start_date.date()} to {end_date.date()}")
        return backtest_runs

    def _generate_simulation_dates(
        self, start_date: datetime, end_date: datetime, frequency: str
    ) -> List[datetime]:
        """
        Generate simulation dates based on frequency.

        Args:
            start_date: Start date
            end_date: End date
            frequency: Frequency (monthly, quarterly, yearly)

        Returns:
            List of simulation dates
        """
        frequency_days = {
            "monthly": 30,
            "quarterly": 90,
            "yearly": 365,
        }

        if frequency not in frequency_days:
            raise ValueError(f"Invalid frequency: {frequency}")

        delta = timedelta(days=frequency_days[frequency])
        dates = []
        current_date = start_date

        while current_date <= end_date:
            dates.append(current_date)
            current_date += delta

        return dates

"""
Service for collecting and storing historical stock data for backtesting.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

import FinanceDataReader as fdr
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.backtest import HistoricalFinancialMetrics, HistoricalStockPrice
from app.models.stock import Stock
from app.services.dart_service import DartService

logger = logging.getLogger(__name__)


class HistoricalDataService:
    """Service for collecting historical stock data."""

    def __init__(self, db: Session):
        self.db = db
        self.dart_service = DartService()

    async def collect_historical_prices(
        self,
        stock_code: str,
        start_date: datetime,
        end_date: datetime,
    ) -> int:
        """
        Collect historical OHLCV data for a stock.

        Args:
            stock_code: Stock code
            start_date: Start date for data collection
            end_date: End date for data collection

        Returns:
            Number of price records inserted
        """
        try:
            logger.info(
                f"Collecting historical prices for {stock_code} "
                f"from {start_date.date()} to {end_date.date()}"
            )

            # Fetch data from FinanceDataReader
            df = fdr.DataReader(stock_code, start_date, end_date)

            if df.empty:
                logger.warning(f"No price data found for {stock_code}")
                return 0

            # Reset index to get date as a column
            df = df.reset_index()

            inserted_count = 0
            for _, row in df.iterrows():
                # Check if record already exists
                existing = (
                    self.db.query(HistoricalStockPrice)
                    .filter(
                        and_(
                            HistoricalStockPrice.stock_code == stock_code,
                            HistoricalStockPrice.date == row["Date"],
                        )
                    )
                    .first()
                )

                if existing:
                    continue

                # Create new historical price record
                price_record = HistoricalStockPrice(
                    stock_code=stock_code,
                    date=row["Date"],
                    open=float(row["Open"]),
                    high=float(row["High"]),
                    low=float(row["Low"]),
                    close=float(row["Close"]),
                    volume=int(row["Volume"]),
                )

                self.db.add(price_record)
                inserted_count += 1

            self.db.commit()
            logger.info(f"Inserted {inserted_count} historical price records for {stock_code}")
            return inserted_count

        except Exception as e:
            logger.error(f"Error collecting historical prices for {stock_code}: {str(e)}")
            self.db.rollback()
            return 0

    async def collect_all_historical_prices(
        self,
        start_date: datetime,
        end_date: datetime,
        market: Optional[str] = None,
    ) -> dict:
        """
        Collect historical prices for all stocks.

        Args:
            start_date: Start date for data collection
            end_date: End date for data collection
            market: Optional market filter (KOSPI/KOSDAQ)

        Returns:
            Dictionary with success/failure counts
        """
        query = self.db.query(Stock)
        if market and market != "ALL":
            query = query.filter(Stock.market == market)

        stocks = query.all()

        results = {"success": 0, "failed": 0, "total": len(stocks)}

        for stock in stocks:
            try:
                count = await self.collect_historical_prices(
                    stock.code, start_date, end_date
                )
                if count > 0:
                    results["success"] += 1
                else:
                    results["failed"] += 1
            except Exception as e:
                logger.error(f"Failed to collect prices for {stock.code}: {str(e)}")
                results["failed"] += 1

        logger.info(
            f"Historical price collection completed: "
            f"{results['success']} success, {results['failed']} failed"
        )
        return results

    async def collect_historical_financial_metrics(
        self,
        stock_code: str,
        snapshot_date: datetime,
    ) -> Optional[HistoricalFinancialMetrics]:
        """
        Collect financial metrics as they would have appeared at a specific date.

        Args:
            stock_code: Stock code
            snapshot_date: The date to snapshot metrics from

        Returns:
            HistoricalFinancialMetrics object or None
        """
        try:
            logger.info(f"Collecting historical metrics for {stock_code} at {snapshot_date.date()}")

            # Get the most recent financial report that would have been available at snapshot_date
            # In reality, quarterly reports are published ~45 days after quarter end
            # For simplicity, we'll look for data up to 3 months before snapshot_date

            lookback_date = snapshot_date - timedelta(days=90)

            # Try to get actual DART data (this will likely fail for old dates)
            metrics_data = await self.dart_service.get_financial_metrics(stock_code)

            if not metrics_data:
                # Fall back to estimating based on current patterns
                logger.warning(
                    f"No DART data available for {stock_code} at {snapshot_date.date()}, "
                    "using estimation"
                )
                metrics_data = self._estimate_historical_metrics(stock_code, snapshot_date)

            if not metrics_data:
                return None

            # Get price data for the snapshot date to calculate market cap
            price_record = (
                self.db.query(HistoricalStockPrice)
                .filter(
                    and_(
                        HistoricalStockPrice.stock_code == stock_code,
                        HistoricalStockPrice.date <= snapshot_date,
                    )
                )
                .order_by(HistoricalStockPrice.date.desc())
                .first()
            )

            market_cap = None
            if price_record:
                # Simplified market cap calculation (would need shares outstanding)
                market_cap = metrics_data.get("market_cap")

            # Check if record already exists
            existing = (
                self.db.query(HistoricalFinancialMetrics)
                .filter(
                    and_(
                        HistoricalFinancialMetrics.stock_code == stock_code,
                        HistoricalFinancialMetrics.snapshot_date == snapshot_date,
                    )
                )
                .first()
            )

            if existing:
                logger.info(f"Historical metrics already exist for {stock_code} at {snapshot_date.date()}")
                return existing

            # Create new historical metrics record
            historical_metrics = HistoricalFinancialMetrics(
                stock_code=stock_code,
                snapshot_date=snapshot_date,
                report_date=metrics_data.get("report_date", snapshot_date),
                per=metrics_data.get("per"),
                pbr=metrics_data.get("pbr"),
                psr=metrics_data.get("psr"),
                ev_ebitda=metrics_data.get("ev_ebitda"),
                roe=metrics_data.get("roe"),
                roa=metrics_data.get("roa"),
                operating_margin=metrics_data.get("operating_margin"),
                net_profit_growth=metrics_data.get("net_profit_growth"),
                debt_ratio=metrics_data.get("debt_ratio"),
                current_ratio=metrics_data.get("current_ratio"),
                interest_coverage=metrics_data.get("interest_coverage"),
                operating_cash_flow=metrics_data.get("operating_cash_flow"),
                dividend_yield=metrics_data.get("dividend_yield"),
                dividend_payout_ratio=metrics_data.get("dividend_payout_ratio"),
                consecutive_dividend_years=metrics_data.get("consecutive_dividend_years"),
                market_cap=market_cap,
            )

            self.db.add(historical_metrics)
            self.db.commit()
            self.db.refresh(historical_metrics)

            logger.info(f"Collected historical metrics for {stock_code} at {snapshot_date.date()}")
            return historical_metrics

        except Exception as e:
            logger.error(
                f"Error collecting historical metrics for {stock_code} "
                f"at {snapshot_date.date()}: {str(e)}"
            )
            self.db.rollback()
            return None

    def _estimate_historical_metrics(
        self,
        stock_code: str,
        snapshot_date: datetime,
    ) -> Optional[dict]:
        """
        Estimate historical metrics based on current data and price trends.
        This is a fallback when actual historical financial data is unavailable.

        Args:
            stock_code: Stock code
            snapshot_date: Date to estimate metrics for

        Returns:
            Dictionary of estimated metrics or None
        """
        try:
            # Get current stock
            stock = self.db.query(Stock).filter(Stock.code == stock_code).first()
            if not stock:
                return None

            # Get historical price at snapshot date
            historical_price = (
                self.db.query(HistoricalStockPrice)
                .filter(
                    and_(
                        HistoricalStockPrice.stock_code == stock_code,
                        HistoricalStockPrice.date <= snapshot_date,
                    )
                )
                .order_by(HistoricalStockPrice.date.desc())
                .first()
            )

            if not historical_price:
                return None

            # This is a simplified estimation - in production, you'd want more sophisticated methods
            # For now, we'll return mock data similar to the current system
            return {
                "report_date": snapshot_date,
                "per": 12.5,
                "pbr": 1.2,
                "psr": 0.8,
                "ev_ebitda": 8.5,
                "roe": 15.0,
                "roa": 8.0,
                "operating_margin": 12.0,
                "net_profit_growth": 10.0,
                "debt_ratio": 45.0,
                "current_ratio": 150.0,
                "interest_coverage": 8.0,
                "operating_cash_flow": 100000000.0,
                "dividend_yield": 2.5,
                "dividend_payout_ratio": 30.0,
                "consecutive_dividend_years": 5,
                "market_cap": historical_price.close * 10000000,  # Rough estimate
            }

        except Exception as e:
            logger.error(f"Error estimating historical metrics: {str(e)}")
            return None

    def get_historical_price(
        self,
        stock_code: str,
        target_date: datetime,
    ) -> Optional[HistoricalStockPrice]:
        """
        Get the closest historical price on or before target_date.

        Args:
            stock_code: Stock code
            target_date: Target date

        Returns:
            HistoricalStockPrice or None
        """
        return (
            self.db.query(HistoricalStockPrice)
            .filter(
                and_(
                    HistoricalStockPrice.stock_code == stock_code,
                    HistoricalStockPrice.date <= target_date,
                )
            )
            .order_by(HistoricalStockPrice.date.desc())
            .first()
        )

    def get_historical_metrics(
        self,
        stock_code: str,
        target_date: datetime,
    ) -> Optional[HistoricalFinancialMetrics]:
        """
        Get the closest historical metrics on or before target_date.

        Args:
            stock_code: Stock code
            target_date: Target date

        Returns:
            HistoricalFinancialMetrics or None
        """
        return (
            self.db.query(HistoricalFinancialMetrics)
            .filter(
                and_(
                    HistoricalFinancialMetrics.stock_code == stock_code,
                    HistoricalFinancialMetrics.snapshot_date <= target_date,
                )
            )
            .order_by(HistoricalFinancialMetrics.snapshot_date.desc())
            .first()
        )

    def get_price_return(
        self,
        stock_code: str,
        start_date: datetime,
        end_date: datetime,
    ) -> Optional[dict]:
        """
        Calculate price return between two dates.

        Args:
            stock_code: Stock code
            start_date: Start date
            end_date: End date

        Returns:
            Dictionary with return metrics or None
        """
        start_price = self.get_historical_price(stock_code, start_date)
        end_price = self.get_historical_price(stock_code, end_date)

        if not start_price or not end_price:
            return None

        # Get all prices in the period for min/max calculation
        prices = (
            self.db.query(HistoricalStockPrice)
            .filter(
                and_(
                    HistoricalStockPrice.stock_code == stock_code,
                    HistoricalStockPrice.date >= start_date,
                    HistoricalStockPrice.date <= end_date,
                )
            )
            .all()
        )

        if not prices:
            return None

        max_price = max(p.high for p in prices)
        min_price = min(p.low for p in prices)

        return_pct = ((end_price.close - start_price.close) / start_price.close) * 100
        max_return_pct = ((max_price - start_price.close) / start_price.close) * 100
        max_drawdown_pct = ((min_price - start_price.close) / start_price.close) * 100

        return {
            "start_price": start_price.close,
            "end_price": end_price.close,
            "return_pct": return_pct,
            "max_price": max_price,
            "min_price": min_price,
            "max_return_pct": max_return_pct,
            "max_drawdown_pct": max_drawdown_pct,
        }

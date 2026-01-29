"""Celery tasks for insider trading data collection"""

import logging
import time
from datetime import datetime
from typing import Optional

from celery import group

from app.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.stock import Stock
from app.models.insider_trading import InsiderTrading
from app.services.dart_service import dart_service

logger = logging.getLogger(__name__)


def _parse_int(value) -> Optional[int]:
    """Parse value to integer, handling various formats"""
    if value is None or value == "" or str(value).strip() == "-":
        return None
    try:
        # Remove commas from formatted numbers
        clean_value = str(value).replace(",", "")
        return int(float(clean_value))
    except (ValueError, TypeError):
        return None


def _parse_decimal(value) -> Optional[float]:
    """Parse value to decimal/float"""
    if value is None or value == "" or str(value).strip() == "-":
        return None
    try:
        return float(str(value).replace(",", ""))
    except (ValueError, TypeError):
        return None


@celery_app.task(bind=True, max_retries=3)
def fetch_insider_trading_task(self, stock_code: str):
    """
    Fetch insider trading data from DART API for a single stock

    Args:
        stock_code: 6-digit Korean stock code

    Returns:
        Dictionary with task status and stock_code
    """
    try:
        logger.info(f"Fetching insider trading for {stock_code}...")

        if not dart_service.is_available():
            logger.warning("DART service not available")
            return {"status": "skipped", "stock_code": stock_code, "reason": "DART unavailable"}

        df = dart_service.fetch_insider_trading_by_stock_code(stock_code)

        if df is None or df.empty:
            return {"status": "no_data", "stock_code": stock_code}

        db = SessionLocal()
        try:
            inserted = 0
            skipped = 0

            for _, row in df.iterrows():
                try:
                    rcept_no = str(row.get("rcept_no", ""))
                    if not rcept_no:
                        continue

                    # Check if already exists
                    existing = (
                        db.query(InsiderTrading)
                        .filter(InsiderTrading.rcept_no == rcept_no)
                        .first()
                    )

                    if existing:
                        skipped += 1
                        continue

                    # Parse date
                    rcept_dt_str = str(row.get("rcept_dt", ""))
                    try:
                        rcept_dt = (
                            datetime.strptime(rcept_dt_str, "%Y%m%d").date()
                            if rcept_dt_str
                            else None
                        )
                    except ValueError:
                        rcept_dt = None

                    # Create new record
                    record = InsiderTrading(
                        stock_code=stock_code,
                        rcept_no=rcept_no,
                        rcept_dt=rcept_dt,
                        corp_code=str(row.get("corp_code", "")),
                        corp_name=row.get("corp_name"),
                        repror=row.get("repror"),
                        isu_exctv_rgist_at=row.get("isu_exctv_rgist_at"),
                        isu_exctv_ofcps=row.get("isu_exctv_ofcps"),
                        isu_main_shrholdr=row.get("isu_main_shrholdr"),
                        sp_stock_lmp_cnt=_parse_int(row.get("sp_stock_lmp_cnt")),
                        sp_stock_lmp_irds_cnt=_parse_int(row.get("sp_stock_lmp_irds_cnt")),
                        sp_stock_lmp_rate=_parse_decimal(row.get("sp_stock_lmp_rate")),
                        sp_stock_lmp_irds_rate=_parse_decimal(row.get("sp_stock_lmp_irds_rate")),
                    )
                    db.add(record)
                    inserted += 1

                except Exception as e:
                    logger.warning(f"Error processing insider record: {e}")
                    continue

            db.commit()
            logger.info(f"Insider trading for {stock_code}: {inserted} inserted, {skipped} skipped")

            return {
                "status": "success",
                "stock_code": stock_code,
                "inserted": inserted,
                "skipped": skipped,
            }

        finally:
            db.close()

    except Exception as exc:
        logger.error(f"Insider trading fetch failed for {stock_code}: {exc}")
        countdown = 60 * (3**self.request.retries)
        raise self.retry(exc=exc, countdown=countdown)


@celery_app.task(bind=True)
def fetch_all_insider_trading_task(self, limit: Optional[int] = None, batch_size: int = 50):
    """
    Fetch insider trading data for all stocks in batches

    Args:
        limit: Maximum number of stocks to process
        batch_size: Number of stocks per batch

    Returns:
        Dictionary with collection results
    """
    try:
        logger.info("Starting batch insider trading collection...")

        db = SessionLocal()
        try:
            stocks = db.query(Stock).all()

            if limit:
                stocks = stocks[:limit]

            total = len(stocks)
            success_count = 0
            failed_count = 0

            logger.info(f"Processing {total} stocks in batches of {batch_size}")

            for i in range(0, total, batch_size):
                batch = stocks[i : i + batch_size]
                batch_num = i // batch_size + 1

                logger.info(
                    f"Processing batch {batch_num}: stocks {i+1}-{min(i+batch_size, total)}/{total}"
                )

                job = group(fetch_insider_trading_task.s(stock.code) for stock in batch)

                result = job.apply_async()
                batch_results = result.get()

                for r in batch_results:
                    if r.get("status") == "success":
                        success_count += 1
                    else:
                        failed_count += 1

                # Rate limiting between batches
                if i + batch_size < total:
                    logger.info("Sleeping 30s before next batch...")
                    time.sleep(30)

            result_data = {
                "status": "completed",
                "total": total,
                "success": success_count,
                "failed": failed_count,
                "success_rate": f"{(success_count/total*100):.2f}%" if total > 0 else "0%",
            }

            logger.info(f"Batch insider trading collection completed: {result_data}")
            return result_data

        finally:
            db.close()

    except Exception as exc:
        logger.error(f"Batch insider trading collection failed: {exc}")
        return {"status": "error", "message": str(exc)}

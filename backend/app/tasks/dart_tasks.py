"""Celery tasks for DART API data collection with rate limiting"""

import logging
import time
from typing import Optional

from celery import group

from app.celery_app import celery_app
from app.db.database import SessionLocal
from app.services.data_collector import DataCollector

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def fetch_dart_financial_metrics_task(self, stock_code: str):
    """
    Fetch financial metrics from DART API for a single stock

    Args:
        stock_code: 6-digit Korean stock code

    Returns:
        Dictionary with task status and stock_code
    """
    try:
        logger.info(f"Fetching DART metrics for {stock_code}...")

        db = SessionLocal()
        try:
            collector = DataCollector(db)
            success = collector.calculate_financial_metrics(stock_code, use_dart=True)
            status = "success" if success else "failed"
            logger.info(f"DART fetch for {stock_code}: {status}")

            return {"status": status, "stock_code": stock_code}
        finally:
            db.close()

    except Exception as exc:
        logger.error(f"DART metrics fetch failed for {stock_code}: {exc}")
        # Exponential backoff: 60s, 300s, 900s
        countdown = 60 * (3 ** self.request.retries)
        logger.info(f"Retrying {stock_code} in {countdown}s...")
        raise self.retry(exc=exc, countdown=countdown)


@celery_app.task(bind=True)
def fetch_all_dart_financial_metrics_task(
    self, limit: Optional[int] = None, batch_size: int = 50
):
    """
    Fetch DART financial metrics for all stocks in batches with rate limiting

    Args:
        limit: Maximum number of stocks to process (optional)
        batch_size: Number of stocks to process per batch (default: 50)

    Returns:
        Dictionary with collection results and statistics
    """
    try:
        logger.info("Starting batch DART financial metrics collection...")

        db = SessionLocal()
        try:
            from app.models.stock import Stock

            stocks = db.query(Stock).all()

            if limit:
                stocks = stocks[:limit]

            total = len(stocks)
            success_count = 0
            failed_count = 0

            logger.info(f"Processing {total} stocks in batches of {batch_size}")

            # Process in batches
            for i in range(0, total, batch_size):
                batch = stocks[i : i + batch_size]
                batch_num = i // batch_size + 1
                end_idx = min(i + batch_size, total)

                logger.info(
                    f"Processing batch {batch_num}: stocks {i+1}-{end_idx}/{total}"
                )

                # Create group of tasks for parallel execution within batch
                job = group(
                    fetch_dart_financial_metrics_task.s(stock.code) for stock in batch
                )

                # Execute batch and wait for completion
                result = job.apply_async()
                batch_results = result.get()

                # Count successes and failures
                for r in batch_results:
                    if r.get("status") == "success":
                        success_count += 1
                    else:
                        failed_count += 1

                # Sleep between batches to respect rate limits
                if i + batch_size < total:
                    logger.info(f"Sleeping 30s before next batch...")
                    time.sleep(30)

            result_data = {
                "status": "completed",
                "total": total,
                "success": success_count,
                "failed": failed_count,
                "success_rate": (
                    f"{(success_count/total*100):.2f}%" if total > 0 else "0%"
                ),
            }

            logger.info(f"Batch DART collection completed: {result_data}")
            return result_data

        finally:
            db.close()

    except Exception as exc:
        logger.error(f"Batch DART financial metrics collection failed: {exc}")
        return {"status": "error", "message": str(exc)}


@celery_app.task(bind=True)
def update_corp_code_cache_task(self):
    """
    Update corp_code cache for all stocks

    This task should be run periodically (e.g., weekly or monthly)
    to refresh the mapping between stock codes and DART corp codes.

    Returns:
        Dictionary with cache update results
    """
    try:
        logger.info("Updating corp_code cache...")

        from app.services.dart_service import dart_service

        if not dart_service.is_available():
            logger.warning("DART service not available")
            return {"status": "error", "message": "DART service not available"}

        db = SessionLocal()
        try:
            from app.models.stock import Stock

            stocks = db.query(Stock).all()

            updated = 0
            failed = 0

            for stock in stocks:
                try:
                    corp_code = dart_service.get_corp_code(stock.code)
                    if corp_code:
                        updated += 1
                    else:
                        failed += 1

                    # Rate limiting
                    time.sleep(0.2)
                except Exception as e:
                    logger.warning(f"Failed to get corp_code for {stock.code}: {e}")
                    failed += 1

            result_data = {
                "status": "success",
                "updated": updated,
                "failed": failed,
                "total": len(stocks),
            }

            logger.info(f"Corp code cache updated: {result_data}")
            return result_data

        finally:
            db.close()

    except Exception as exc:
        logger.error(f"Corp code cache update failed: {exc}")
        return {"status": "error", "message": str(exc)}

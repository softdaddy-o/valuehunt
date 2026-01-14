"""Data Collection Celery Tasks"""

import logging
from app.celery_app import celery_app
from app.db.database import SessionLocal
from app.services.data_collector import DataCollector
from app.services.value_scorer import ValueScorer

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def collect_stock_list_task(self):
    """KRX 전체 종목 리스트 수집 태스크"""
    try:
        logger.info("Starting stock list collection task...")
        db = SessionLocal()
        try:
            collector = DataCollector(db)
            count = collector.collect_stock_list()
            logger.info(f"Stock list collection completed: {count} stocks")
            return {"status": "success", "count": count}
        finally:
            db.close()
    except Exception as exc:
        logger.error(f"Stock list collection failed: {exc}")
        # Retry after 5 minutes
        raise self.retry(exc=exc, countdown=300)


@celery_app.task(bind=True, max_retries=3)
def collect_stock_prices_task(self, stock_code: str):
    """특정 종목의 주가 데이터 수집 태스크"""
    try:
        logger.info(f"Starting price collection for {stock_code}...")
        db = SessionLocal()
        try:
            collector = DataCollector(db)
            success = collector.collect_stock_prices(stock_code)
            return {"status": "success" if success else "failed", "stock_code": stock_code}
        finally:
            db.close()
    except Exception as exc:
        logger.error(f"Price collection failed for {stock_code}: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True)
def collect_all_stock_prices_task(self, limit: int = None):
    """전체 종목의 주가 데이터 수집 태스크"""
    try:
        logger.info("Starting all stock prices collection task...")
        db = SessionLocal()
        try:
            collector = DataCollector(db)
            result = collector.collect_all_stock_prices(limit=limit)
            logger.info(f"All stock prices collection completed: {result}")
            return result
        finally:
            db.close()
    except Exception as exc:
        logger.error(f"All stock prices collection failed: {exc}")
        return {"status": "error", "message": str(exc)}


@celery_app.task(bind=True, max_retries=3)
def calculate_financial_metrics_task(self, stock_code: str):
    """특정 종목의 재무 지표 계산 태스크"""
    try:
        logger.info(f"Starting financial metrics calculation for {stock_code}...")
        db = SessionLocal()
        try:
            collector = DataCollector(db)
            success = collector.calculate_financial_metrics(stock_code)
            return {"status": "success" if success else "failed", "stock_code": stock_code}
        finally:
            db.close()
    except Exception as exc:
        logger.error(f"Financial metrics calculation failed for {stock_code}: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True)
def calculate_all_financial_metrics_task(self, limit: int = None):
    """전체 종목의 재무 지표 계산 태스크"""
    try:
        logger.info("Starting all financial metrics calculation task...")
        db = SessionLocal()
        try:
            collector = DataCollector(db)
            result = collector.collect_all_financial_metrics(limit=limit)
            logger.info(f"All financial metrics calculation completed: {result}")
            return result
        finally:
            db.close()
    except Exception as exc:
        logger.error(f"All financial metrics calculation failed: {exc}")
        return {"status": "error", "message": str(exc)}


@celery_app.task(bind=True, max_retries=3)
def calculate_value_score_task(self, stock_code: str):
    """특정 종목의 Value Score 계산 태스크"""
    try:
        logger.info(f"Starting Value Score calculation for {stock_code}...")
        db = SessionLocal()
        try:
            scorer = ValueScorer(db)
            value_score = scorer.calculate_value_score(stock_code)
            return {
                "status": "success" if value_score else "failed",
                "stock_code": stock_code,
                "score": float(value_score.total_score) if value_score else None
            }
        finally:
            db.close()
    except Exception as exc:
        logger.error(f"Value Score calculation failed for {stock_code}: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True)
def calculate_all_value_scores_task(self, limit: int = None):
    """전체 종목의 Value Score 계산 태스크"""
    try:
        logger.info("Starting all Value Scores calculation task...")
        db = SessionLocal()
        try:
            scorer = ValueScorer(db)
            result = scorer.calculate_all_value_scores(limit=limit)
            logger.info(f"All Value Scores calculation completed: {result}")
            return result
        finally:
            db.close()
    except Exception as exc:
        logger.error(f"All Value Scores calculation failed: {exc}")
        return {"status": "error", "message": str(exc)}


@celery_app.task(bind=True)
def full_data_pipeline_task(self, limit: int = None):
    """
    전체 데이터 파이프라인 실행
    1. 종목 리스트 수집
    2. 주가 데이터 수집
    3. 재무 지표 계산
    4. Value Score 계산
    """
    try:
        logger.info("Starting full data pipeline...")
        db = SessionLocal()
        try:
            # Step 1: Collect stock list
            collector = DataCollector(db)
            stock_count = collector.collect_stock_list()
            logger.info(f"Step 1: Collected {stock_count} stocks")

            # Step 2: Collect prices
            price_result = collector.collect_all_stock_prices(limit=limit)
            logger.info(f"Step 2: Price collection - {price_result}")

            # Step 3: Calculate financial metrics
            metrics_result = collector.collect_all_financial_metrics(limit=limit)
            logger.info(f"Step 3: Metrics calculation - {metrics_result}")

            # Step 4: Calculate Value Scores
            scorer = ValueScorer(db)
            score_result = scorer.calculate_all_value_scores(limit=limit)
            logger.info(f"Step 4: Value Score calculation - {score_result}")

            return {
                "status": "success",
                "stock_count": stock_count,
                "prices": price_result,
                "metrics": metrics_result,
                "scores": score_result,
            }
        finally:
            db.close()
    except Exception as exc:
        logger.error(f"Full data pipeline failed: {exc}")
        return {"status": "error", "message": str(exc)}

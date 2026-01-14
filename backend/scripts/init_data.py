"""Initialize Database with Sample Data

데이터베이스에 샘플 데이터를 생성하는 스크립트
개발 및 테스트 용도
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.database import SessionLocal
from app.services.data_collector import DataCollector
from app.services.value_scorer import ValueScorer

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    """메인 함수"""
    db = SessionLocal()

    try:
        print("=" * 60)
        print("ValueHunt - Sample Data Initialization")
        print("=" * 60)

        # Step 1: Collect stock list
        print("\n[Step 1/4] Collecting KRX stock list...")
        collector = DataCollector(db)
        stock_count = collector.collect_stock_list()
        print(f"✓ Collected {stock_count} stocks")

        # Limit to first 100 stocks for testing
        limit = 100
        print(f"\n[Info] Processing first {limit} stocks for sample data...")

        # Step 2: Collect prices
        print("\n[Step 2/4] Collecting stock prices...")
        price_result = collector.collect_all_stock_prices(limit=limit)
        print(f"✓ Prices collected: {price_result}")

        # Step 3: Calculate financial metrics
        print("\n[Step 3/4] Calculating financial metrics...")
        metrics_result = collector.collect_all_financial_metrics(limit=limit)
        print(f"✓ Metrics calculated: {metrics_result}")

        # Step 4: Calculate Value Scores
        print("\n[Step 4/4] Calculating Value Scores...")
        scorer = ValueScorer(db)
        score_result = scorer.calculate_all_value_scores(limit=limit)
        print(f"✓ Value Scores calculated: {score_result}")

        print("\n" + "=" * 60)
        print("✓ Sample data initialization completed successfully!")
        print("=" * 60)
        print(f"\nYou can now access the API:")
        print(f"  - Top Picks: http://localhost:8000/api/v1/stocks/top-picks")
        print(f"  - API Docs: http://localhost:8000/docs")
        print()

    except Exception as e:
        logger.error(f"Error initializing data: {e}")
        print(f"\n✗ Error: {e}")
        sys.exit(1)

    finally:
        db.close()


if __name__ == "__main__":
    main()

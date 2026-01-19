"""Data Collection Service

주가 및 재무 데이터 수집을 위한 서비스
FinanceDataReader를 사용하여 KRX 데이터 수집
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

import FinanceDataReader as fdr
import pandas as pd
from sqlalchemy.orm import Session

from app.models.stock import Stock
from app.models.financial_metrics import FinancialMetrics

logger = logging.getLogger(__name__)


class DataCollector:
    """주가 및 재무 데이터 수집 클래스"""

    def __init__(self, db: Session):
        self.db = db

    def collect_stock_list(self) -> int:
        """
        KRX 전체 종목 리스트 수집 및 저장

        Returns:
            수집된 종목 수
        """
        try:
            logger.info("Collecting stock list from KRX...")

            # KRX 전체 종목 리스트 조회
            df_krx = fdr.StockListing('KRX')

            if df_krx.empty:
                logger.warning("No stocks found in KRX listing")
                return 0

            count = 0
            for _, row in df_krx.iterrows():
                try:
                    stock_code = row['Code']
                    stock_name = row['Name']
                    market = row['Market']
                    sector = row.get('Sector', None)
                    market_cap = row.get('Marcap', None)

                    # 기존 종목 확인
                    existing_stock = self.db.query(Stock).filter(
                        Stock.code == stock_code
                    ).first()

                    if existing_stock:
                        # 업데이트
                        existing_stock.name = stock_name
                        existing_stock.market = market
                        existing_stock.sector = sector
                        existing_stock.market_cap = int(market_cap) if pd.notna(market_cap) else None
                    else:
                        # 신규 추가
                        new_stock = Stock(
                            code=stock_code,
                            name=stock_name,
                            market=market,
                            sector=sector,
                            market_cap=int(market_cap) if pd.notna(market_cap) else None,
                        )
                        self.db.add(new_stock)

                    count += 1

                    if count % 100 == 0:
                        logger.info(f"Processed {count} stocks...")
                        self.db.commit()

                except Exception as e:
                    logger.error(f"Error processing stock {row.get('Code', 'unknown')}: {e}")
                    continue

            self.db.commit()
            logger.info(f"Successfully collected {count} stocks")
            return count

        except Exception as e:
            logger.error(f"Error collecting stock list: {e}")
            self.db.rollback()
            raise

    def collect_stock_prices(
        self,
        stock_code: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> bool:
        """
        특정 종목의 주가 데이터 수집

        Args:
            stock_code: 종목 코드
            start_date: 시작일 (기본: 1년 전)
            end_date: 종료일 (기본: 오늘)

        Returns:
            성공 여부
        """
        try:
            if start_date is None:
                start_date = datetime.now() - timedelta(days=365)
            if end_date is None:
                end_date = datetime.now()

            # 주가 데이터 조회
            df = fdr.DataReader(
                stock_code,
                start_date.strftime('%Y-%m-%d'),
                end_date.strftime('%Y-%m-%d')
            )

            if df.empty:
                logger.warning(f"No price data found for {stock_code}")
                return False

            # 최신 주가로 Stock 테이블 업데이트
            latest_price = df.iloc[-1]
            stock = self.db.query(Stock).filter(Stock.code == stock_code).first()

            if stock:
                stock.current_price = int(latest_price['Close'])

                # 전일 대비 등락률 계산
                if len(df) >= 2:
                    prev_close = df.iloc[-2]['Close']
                    change_rate = ((latest_price['Close'] - prev_close) / prev_close) * 100
                    stock.change_rate = round(change_rate, 2)

                self.db.commit()
                logger.info(f"Updated price for {stock_code}: {stock.current_price}")
                return True

            return False

        except Exception as e:
            logger.error(f"Error collecting prices for {stock_code}: {e}")
            return False

    def collect_all_stock_prices(self, limit: Optional[int] = None) -> Dict[str, Any]:
        """
        전체 종목의 주가 데이터 수집

        Args:
            limit: 수집할 종목 수 제한 (테스트용)

        Returns:
            수집 결과 통계
        """
        stocks = self.db.query(Stock).all()

        if limit:
            stocks = stocks[:limit]

        total = len(stocks)
        success = 0
        failed = 0

        logger.info(f"Starting to collect prices for {total} stocks...")

        for idx, stock in enumerate(stocks, 1):
            try:
                if self.collect_stock_prices(stock.code):
                    success += 1
                else:
                    failed += 1

                if idx % 50 == 0:
                    logger.info(f"Progress: {idx}/{total} ({success} success, {failed} failed)")

            except Exception as e:
                logger.error(f"Error processing {stock.code}: {e}")
                failed += 1
                continue

        result = {
            "total": total,
            "success": success,
            "failed": failed,
            "success_rate": f"{(success/total*100):.2f}%" if total > 0 else "0%",
        }

        logger.info(f"Price collection completed: {result}")
        return result

    def calculate_financial_metrics(self, stock_code: str, use_dart: bool = True) -> bool:
        """
        종목의 재무 지표 계산 및 저장

        DART API를 통해 실제 재무제표 데이터를 수집하고, 실패 시 더미 데이터로 대체

        Args:
            stock_code: 종목 코드
            use_dart: DART API 사용 여부 (False 또는 API 실패 시 mock data 사용)

        Returns:
            성공 여부
        """
        try:
            stock = self.db.query(Stock).filter(Stock.code == stock_code).first()
            if not stock:
                logger.warning(f"Stock {stock_code} not found")
                return False

            today = datetime.now().date()

            # 기존 데이터 확인
            existing = self.db.query(FinancialMetrics).filter(
                FinancialMetrics.stock_code == stock_code,
                FinancialMetrics.date == today
            ).first()

            if existing:
                logger.info(f"Financial metrics already exist for {stock_code}")
                return True

            # DART API에서 데이터 수집 시도
            dart_data = self._fetch_dart_data(stock_code) if use_dart else None

            # DART 실패 시 더미 데이터로 대체
            if dart_data is None:
                logger.info(f"Using mock data for {stock_code}")
                dart_data = self._generate_mock_metrics()

            # FinancialMetrics 객체 생성
            metrics = FinancialMetrics(
                stock_code=stock_code,
                date=today,
                **dart_data
            )

            self.db.add(metrics)
            self.db.commit()

            logger.info(f"Created financial metrics for {stock_code}")
            return True

        except Exception as e:
            logger.error(f"Error calculating metrics for {stock_code}: {e}")
            self.db.rollback()
            return False

    def _fetch_dart_data(self, stock_code: str) -> Optional[Dict[str, Any]]:
        """DART API에서 재무 데이터 수집 시도"""
        from app.services.dart_service import dart_service

        if not dart_service.is_available():
            return None

        try:
            logger.info(f"Fetching DART data for {stock_code}...")
            dart_data = dart_service.calculate_metrics_from_stock_code(stock_code)

            if dart_data:
                logger.info(f"Successfully fetched DART data for {stock_code}")

            return dart_data
        except Exception as e:
            logger.warning(f"DART API failed for {stock_code}: {e}. Falling back to mock data.")
            return None

    def _generate_mock_metrics(self) -> Dict[str, Any]:
        """더미 재무 지표 생성 (DART 실패 시 대체용)"""
        import random

        return {
            "per": round(random.uniform(5, 20), 2),
            "pbr": round(random.uniform(0.5, 3), 2),
            "psr": round(random.uniform(0.5, 5), 2),
            "ev_ebitda": round(random.uniform(5, 15), 2),
            "roe": round(random.uniform(5, 25), 2),
            "roa": round(random.uniform(3, 15), 2),
            "operating_margin": round(random.uniform(5, 20), 2),
            "net_profit_growth": round(random.uniform(-10, 30), 2),
            "debt_ratio": round(random.uniform(20, 100), 2),
            "current_ratio": round(random.uniform(100, 300), 2),
            "interest_coverage": round(random.uniform(5, 20), 2),
            "operating_cashflow": random.randint(100000000, 1000000000),
            "dividend_yield": round(random.uniform(0, 5), 2),
            "dividend_payout_ratio": round(random.uniform(10, 50), 2),
            "consecutive_dividend_years": random.randint(0, 10),
        }

    def collect_all_financial_metrics(self, limit: Optional[int] = None) -> Dict[str, Any]:
        """
        전체 종목의 재무 지표 수집

        Args:
            limit: 수집할 종목 수 제한

        Returns:
            수집 결과 통계
        """
        stocks = self.db.query(Stock).all()

        if limit:
            stocks = stocks[:limit]

        total = len(stocks)
        success = 0
        failed = 0

        logger.info(f"Starting to collect financial metrics for {total} stocks...")

        for idx, stock in enumerate(stocks, 1):
            try:
                if self.calculate_financial_metrics(stock.code):
                    success += 1
                else:
                    failed += 1

                if idx % 50 == 0:
                    logger.info(f"Progress: {idx}/{total} ({success} success, {failed} failed)")

            except Exception as e:
                logger.error(f"Error processing {stock.code}: {e}")
                failed += 1
                continue

        result = {
            "total": total,
            "success": success,
            "failed": failed,
            "success_rate": f"{(success/total*100):.2f}%" if total > 0 else "0%",
        }

        logger.info(f"Financial metrics collection completed: {result}")
        return result

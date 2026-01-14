"""Value Score Calculation Service

재무 지표를 기반으로 Value Score를 계산하는 서비스
"""

import logging
from datetime import datetime, date
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models.stock import Stock
from app.models.financial_metrics import FinancialMetrics
from app.models.value_score import ValueScore

logger = logging.getLogger(__name__)


class ValueScorer:
    """Value Score 계산 클래스"""

    def __init__(self, db: Session):
        self.db = db

    def calculate_valuation_score(self, metrics: FinancialMetrics) -> float:
        """
        밸류에이션 점수 계산 (0-40점)

        낮은 PER, PBR이 좋음
        """
        score = 0.0

        # PER 점수 (0-20점)
        if metrics.per is not None:
            per = float(metrics.per)
            if per < 0:
                score += 0  # 적자 기업
            elif per < 5:
                score += 20
            elif per < 10:
                score += 15
            elif per < 15:
                score += 10
            elif per < 20:
                score += 5
            else:
                score += 0

        # PBR 점수 (0-20점)
        if metrics.pbr is not None:
            pbr = float(metrics.pbr)
            if pbr < 0.5:
                score += 20
            elif pbr < 1.0:
                score += 15
            elif pbr < 1.5:
                score += 10
            elif pbr < 2.0:
                score += 5
            else:
                score += 0

        return min(score, 40.0)

    def calculate_profitability_score(self, metrics: FinancialMetrics) -> float:
        """
        수익성 점수 계산 (0-30점)

        높은 ROE, 영업이익률이 좋음
        """
        score = 0.0

        # ROE 점수 (0-15점)
        if metrics.roe is not None:
            roe = float(metrics.roe)
            if roe >= 20:
                score += 15
            elif roe >= 15:
                score += 12
            elif roe >= 10:
                score += 9
            elif roe >= 5:
                score += 5
            else:
                score += 0

        # 영업이익률 점수 (0-15점)
        if metrics.operating_margin is not None:
            margin = float(metrics.operating_margin)
            if margin >= 20:
                score += 15
            elif margin >= 15:
                score += 12
            elif margin >= 10:
                score += 9
            elif margin >= 5:
                score += 5
            else:
                score += 0

        return min(score, 30.0)

    def calculate_stability_score(self, metrics: FinancialMetrics) -> float:
        """
        안정성 점수 계산 (0-20점)

        낮은 부채비율, 높은 유동비율이 좋음
        """
        score = 0.0

        # 부채비율 점수 (0-10점)
        if metrics.debt_ratio is not None:
            debt = float(metrics.debt_ratio)
            if debt < 30:
                score += 10
            elif debt < 50:
                score += 8
            elif debt < 100:
                score += 5
            elif debt < 150:
                score += 2
            else:
                score += 0

        # 유동비율 점수 (0-10점)
        if metrics.current_ratio is not None:
            current = float(metrics.current_ratio)
            if current >= 200:
                score += 10
            elif current >= 150:
                score += 8
            elif current >= 100:
                score += 5
            elif current >= 80:
                score += 2
            else:
                score += 0

        return min(score, 20.0)

    def calculate_dividend_score(self, metrics: FinancialMetrics) -> float:
        """
        배당 점수 계산 (0-10점)

        높은 배당수익률, 배당 연속성이 좋음
        """
        score = 0.0

        # 배당수익률 점수 (0-7점)
        if metrics.dividend_yield is not None:
            dividend_yield = float(metrics.dividend_yield)
            if dividend_yield >= 5:
                score += 7
            elif dividend_yield >= 3:
                score += 5
            elif dividend_yield >= 2:
                score += 3
            elif dividend_yield >= 1:
                score += 1
            else:
                score += 0

        # 연속 배당 점수 (0-3점)
        if metrics.consecutive_dividend_years is not None:
            years = metrics.consecutive_dividend_years
            if years >= 10:
                score += 3
            elif years >= 5:
                score += 2
            elif years >= 3:
                score += 1
            else:
                score += 0

        return min(score, 10.0)

    def calculate_value_score(self, stock_code: str) -> Optional[ValueScore]:
        """
        종목의 Value Score 계산 및 저장

        Args:
            stock_code: 종목 코드

        Returns:
            계산된 ValueScore 객체 또는 None
        """
        try:
            # 최신 재무 지표 조회
            metrics = (
                self.db.query(FinancialMetrics)
                .filter(FinancialMetrics.stock_code == stock_code)
                .order_by(FinancialMetrics.date.desc())
                .first()
            )

            if not metrics:
                logger.warning(f"No financial metrics found for {stock_code}")
                return None

            # 각 카테고리 점수 계산
            valuation_score = self.calculate_valuation_score(metrics)
            profitability_score = self.calculate_profitability_score(metrics)
            stability_score = self.calculate_stability_score(metrics)
            dividend_score = self.calculate_dividend_score(metrics)

            # 총점 계산
            total_score = (
                valuation_score +
                profitability_score +
                stability_score +
                dividend_score
            )

            # 상승 여력 계산 (간단한 예시)
            upside_potential = None
            if metrics.per and float(metrics.per) < 10:
                upside_potential = round(((10 - float(metrics.per)) / float(metrics.per)) * 100, 2)

            # AI 요약 생성 (간단한 템플릿, 추후 GPT-4로 대체)
            ai_summary = self._generate_simple_summary(
                metrics, total_score, valuation_score, profitability_score
            )

            # 강점과 리스크 (간단한 로직, 추후 AI로 대체)
            strengths, risks = self._generate_strengths_risks(metrics)

            today = date.today()

            # 기존 데이터 확인
            existing = self.db.query(ValueScore).filter(
                ValueScore.stock_code == stock_code,
                ValueScore.date == today
            ).first()

            if existing:
                # 업데이트
                existing.total_score = total_score
                existing.valuation_score = valuation_score
                existing.profitability_score = profitability_score
                existing.stability_score = stability_score
                existing.dividend_score = dividend_score
                existing.upside_potential = upside_potential
                existing.ai_summary = ai_summary
                existing.strengths = strengths
                existing.risks = risks
                value_score = existing
            else:
                # 신규 생성
                value_score = ValueScore(
                    stock_code=stock_code,
                    date=today,
                    total_score=total_score,
                    valuation_score=valuation_score,
                    profitability_score=profitability_score,
                    stability_score=stability_score,
                    dividend_score=dividend_score,
                    upside_potential=upside_potential,
                    ai_summary=ai_summary,
                    strengths=strengths,
                    risks=risks,
                )
                self.db.add(value_score)

            self.db.commit()
            logger.info(f"Calculated Value Score for {stock_code}: {total_score:.2f}")
            return value_score

        except Exception as e:
            logger.error(f"Error calculating Value Score for {stock_code}: {e}")
            self.db.rollback()
            return None

    def _generate_simple_summary(
        self,
        metrics: FinancialMetrics,
        total_score: float,
        valuation_score: float,
        profitability_score: float
    ) -> str:
        """간단한 AI 요약 생성"""
        summary_parts = []

        if valuation_score >= 25:
            summary_parts.append("업종 대비 저평가 상태")
        elif valuation_score >= 15:
            summary_parts.append("적정 밸류에이션")

        if profitability_score >= 20:
            summary_parts.append("안정적인 수익성 유지")
        elif profitability_score >= 10:
            summary_parts.append("양호한 수익성")

        if metrics.roe and float(metrics.roe) >= 15:
            summary_parts.append(f"ROE {float(metrics.roe):.1f}%로 우수")

        if not summary_parts:
            summary_parts.append("재무 지표 분석 결과 참고")

        return ", ".join(summary_parts) + "."

    def _generate_strengths_risks(self, metrics: FinancialMetrics) -> tuple:
        """강점과 리스크 생성"""
        strengths = []
        risks = []

        # 강점
        if metrics.per and float(metrics.per) < 10:
            strengths.append(f"PER {float(metrics.per):.1f}로 저평가")

        if metrics.roe and float(metrics.roe) >= 15:
            strengths.append(f"ROE {float(metrics.roe):.1f}%로 높은 수익성")

        if metrics.debt_ratio and float(metrics.debt_ratio) < 50:
            strengths.append(f"부채비율 {float(metrics.debt_ratio):.1f}%로 건전한 재무구조")

        if metrics.dividend_yield and float(metrics.dividend_yield) >= 3:
            strengths.append(f"배당수익률 {float(metrics.dividend_yield):.1f}%")

        # 리스크
        if metrics.debt_ratio and float(metrics.debt_ratio) > 100:
            risks.append(f"부채비율 {float(metrics.debt_ratio):.1f}%로 높은 편")

        if metrics.operating_margin and float(metrics.operating_margin) < 5:
            risks.append(f"영업이익률 {float(metrics.operating_margin):.1f}%로 낮음")

        if metrics.current_ratio and float(metrics.current_ratio) < 100:
            risks.append("유동비율이 100% 미만으로 단기 유동성 주의 필요")

        return strengths, risks

    def calculate_all_value_scores(self, limit: Optional[int] = None) -> Dict[str, Any]:
        """
        전체 종목의 Value Score 계산

        Args:
            limit: 계산할 종목 수 제한

        Returns:
            계산 결과 통계
        """
        stocks = self.db.query(Stock).all()

        if limit:
            stocks = stocks[:limit]

        total = len(stocks)
        success = 0
        failed = 0

        logger.info(f"Starting to calculate Value Scores for {total} stocks...")

        for idx, stock in enumerate(stocks, 1):
            try:
                if self.calculate_value_score(stock.code):
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

        logger.info(f"Value Score calculation completed: {result}")
        return result

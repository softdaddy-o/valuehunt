"""Tests for ValueScorer service"""

import pytest
from datetime import date
from app.services.value_scorer import ValueScorer
from app.models.financial_metrics import FinancialMetrics


# Helper function to create test metrics
def create_metrics(**kwargs):
    """Create FinancialMetrics with required fields and custom values"""
    defaults = {
        'stock_code': 'TEST',
        'date': date(2024, 1, 1),
        'per': 0,
        'pbr': 0,
        'roe': 0,
        'roa': 0,
        'operating_margin': 0,
        'debt_ratio': 0,
        'current_ratio': 0,
        'dividend_yield': 0,
    }
    defaults.update(kwargs)
    return FinancialMetrics(**defaults)


class TestValueScorer:
    """Test ValueScorer calculation logic"""

    def test_calculate_valuation_score_excellent(self):
        """Test valuation score with excellent metrics (PER < 5, PBR < 0.5)"""
        scorer = ValueScorer(None)
        metrics = create_metrics(per=4.5, pbr=0.4)

        score = scorer.calculate_valuation_score(metrics)
        assert score == 40.0  # Max score

    def test_calculate_valuation_score_good(self):
        """Test valuation score with good metrics (PER < 10, PBR < 1.0)"""
        scorer = ValueScorer(None)
        metrics = create_metrics(per=8.0, pbr=0.8)

        score = scorer.calculate_valuation_score(metrics)
        assert score == 30.0  # 15 + 15

    def test_calculate_valuation_score_poor(self):
        """Test valuation score with poor metrics (PER >= 20, PBR >= 2.0)"""
        scorer = ValueScorer(None)
        metrics = create_metrics(per=25.0, pbr=2.5)

        score = scorer.calculate_valuation_score(metrics)
        assert score == 0.0  # Min score

    def test_calculate_profitability_score_excellent(self):
        """Test profitability score with excellent metrics (ROE >= 20%, margin >= 20%)"""
        scorer = ValueScorer(None)
        metrics = create_metrics(roe=25.0, operating_margin=25.0)

        score = scorer.calculate_profitability_score(metrics)
        assert score == 30.0  # Max score

    def test_calculate_profitability_score_good(self):
        """Test profitability score with good metrics (ROE >= 15%, margin >= 15%)"""
        scorer = ValueScorer(None)
        metrics = create_metrics(roe=17.0, operating_margin=17.0)

        score = scorer.calculate_profitability_score(metrics)
        assert score == 24.0  # 12 + 12

    def test_calculate_stability_score_excellent(self):
        """Test stability score with excellent metrics (debt < 30%, current >= 200%)"""
        scorer = ValueScorer(None)
        metrics = create_metrics(debt_ratio=25.0, current_ratio=220.0)

        score = scorer.calculate_stability_score(metrics)
        assert score == 20.0  # Max score

    def test_calculate_stability_score_poor(self):
        """Test stability score with poor metrics (debt >= 150%, current < 80%)"""
        scorer = ValueScorer(None)
        metrics = create_metrics(debt_ratio=180.0, current_ratio=60.0)

        score = scorer.calculate_stability_score(metrics)
        assert score == 0.0  # Min score

    def test_calculate_dividend_score_excellent(self):
        """Test dividend score with excellent yield (>= 5%)"""
        scorer = ValueScorer(None)
        metrics = create_metrics(dividend_yield=5.5)

        score = scorer.calculate_dividend_score(metrics)
        assert score == 7.0  # Max yield score (consistency score requires DB)

    def test_generate_strengths_and_risks(self):
        """Test strengths and risks generation"""
        scorer = ValueScorer(None)
        metrics = create_metrics(
            per=6.0,  # Good
            pbr=0.7,  # Good
            roe=22.0,  # Excellent
            operating_margin=18.0,  # Good
            debt_ratio=35.0,  # Good
            current_ratio=180.0,  # Good
            dividend_yield=4.2,  # Good
        )

        strengths, risks = scorer.generate_strengths_and_risks(metrics)

        # Check that we have strengths
        assert len(strengths) > 0
        assert any('ROE' in s or 'roe' in s.lower() for s in strengths)  # Should mention excellent ROE

        # Should have minimal risks with good metrics
        assert len(risks) <= 2

    def test_total_score_calculation(self):
        """Test that total score is sum of all category scores"""
        # This would require database access, so it's a placeholder for integration tests
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

"""Value Score model"""

from sqlalchemy import Column, Integer, String, Date, Numeric, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.db.database import Base


class ValueScore(Base):
    """Value Score model for AI-based stock valuation scores"""

    __tablename__ = "value_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stock_code = Column(String(10), ForeignKey("stocks.code", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)

    # Score Components (0-100 scale)
    total_score = Column(Numeric(5, 2), nullable=False)  # Total value score (0-100)
    valuation_score = Column(Numeric(5, 2))  # Valuation component (0-40)
    profitability_score = Column(Numeric(5, 2))  # Profitability component (0-30)
    stability_score = Column(Numeric(5, 2))  # Financial stability component (0-20)
    dividend_score = Column(Numeric(5, 2))  # Dividend component (0-10)

    # AI Analysis
    upside_potential = Column(Numeric(5, 2))  # Expected return percentage
    ai_summary = Column(Text)  # AI-generated summary text

    # Structured AI Insights (JSON arrays)
    strengths = Column(JSONB)  # List of strength points: [{"text": "..."}, ...]
    risks = Column(JSONB)  # List of risk points: [{"text": "..."}, ...]

    # Relationships
    stock = relationship("Stock", back_populates="value_scores")

    __table_args__ = (
        UniqueConstraint('stock_code', 'date', name='uix_value_score_stock_date'),
        {'extend_existing': True}
    )

    def __repr__(self):
        return f"<ValueScore(stock_code={self.stock_code}, date={self.date}, total_score={self.total_score})>"

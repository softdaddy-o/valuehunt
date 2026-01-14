"""Stock model"""

from sqlalchemy import Column, String, BigInteger, Integer, Numeric
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.base import TimestampMixin


class Stock(Base, TimestampMixin):
    """Stock model for basic stock information"""

    __tablename__ = "stocks"

    code = Column(String(10), primary_key=True)
    name = Column(String(100), nullable=False)
    market = Column(String(10), nullable=False, index=True)  # KOSPI, KOSDAQ
    sector = Column(String(50), index=True)
    market_cap = Column(BigInteger, index=True)  # Market capitalization
    current_price = Column(Integer)  # Current stock price
    change_rate = Column(Numeric(5, 2))  # Daily change rate (%)

    # Relationships
    financial_metrics = relationship(
        "FinancialMetrics",
        back_populates="stock",
        cascade="all, delete-orphan",
        order_by="FinancialMetrics.date.desc()",
    )
    value_scores = relationship(
        "ValueScore",
        back_populates="stock",
        cascade="all, delete-orphan",
        order_by="ValueScore.date.desc()",
    )
    watchlist_items = relationship(
        "Watchlist",
        back_populates="stock",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Stock(code={self.code}, name={self.name}, market={self.market})>"

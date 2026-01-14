"""Financial Metrics model"""

from sqlalchemy import Column, Integer, String, Date, Numeric, BigInteger, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base


class FinancialMetrics(Base):
    """Financial metrics model for stock fundamental data"""

    __tablename__ = "financial_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stock_code = Column(String(10), ForeignKey("stocks.code", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)

    # Valuation Metrics
    per = Column(Numeric(10, 2))  # Price to Earnings Ratio
    pbr = Column(Numeric(10, 2))  # Price to Book Ratio
    psr = Column(Numeric(10, 2))  # Price to Sales Ratio
    ev_ebitda = Column(Numeric(10, 2))  # Enterprise Value to EBITDA

    # Profitability Metrics
    roe = Column(Numeric(5, 2))  # Return on Equity (%)
    roa = Column(Numeric(5, 2))  # Return on Assets (%)
    operating_margin = Column(Numeric(5, 2))  # Operating Margin (%)
    net_profit_growth = Column(Numeric(5, 2))  # Net Profit Growth Rate (%)

    # Stability Metrics
    debt_ratio = Column(Numeric(5, 2))  # Debt Ratio (%)
    current_ratio = Column(Numeric(5, 2))  # Current Ratio
    interest_coverage = Column(Numeric(10, 2))  # Interest Coverage Ratio
    operating_cashflow = Column(BigInteger)  # Operating Cash Flow

    # Dividend Metrics
    dividend_yield = Column(Numeric(5, 2))  # Dividend Yield (%)
    dividend_payout_ratio = Column(Numeric(5, 2))  # Dividend Payout Ratio (%)
    consecutive_dividend_years = Column(Integer)  # Years of consecutive dividend payments

    # Relationships
    stock = relationship("Stock", back_populates="financial_metrics")

    __table_args__ = (
        UniqueConstraint('stock_code', 'date', name='uix_stock_code_date'),
        {'extend_existing': True}
    )

    def __repr__(self):
        return f"<FinancialMetrics(stock_code={self.stock_code}, date={self.date}, PER={self.per}, ROE={self.roe})>"

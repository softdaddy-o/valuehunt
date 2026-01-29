"""Insider Trading model"""

from sqlalchemy import Column, Integer, String, Date, Numeric, BigInteger, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.base import TimestampMixin


class InsiderTrading(Base, TimestampMixin):
    """Insider trading model for executive/major shareholder ownership reports from DART"""

    __tablename__ = "insider_trading"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stock_code = Column(
        String(10), ForeignKey("stocks.code", ondelete="CASCADE"), nullable=False, index=True
    )

    # DART API fields
    rcept_no = Column(String(14), nullable=False, unique=True)  # 접수번호 (14자리)
    rcept_dt = Column(Date, nullable=False, index=True)  # 접수일자
    corp_code = Column(String(8), nullable=False)  # 고유번호
    corp_name = Column(String(100), nullable=True)  # 회사명

    # Reporter/Executive info
    repror = Column(String(100), nullable=True)  # 보고자명
    isu_exctv_rgist_at = Column(String(50), nullable=True)  # 발행회사 관계 (등기임원, 비등기임원 등)
    isu_exctv_ofcps = Column(String(100), nullable=True)  # 직위 (대표이사, 이사, 전무 등)
    isu_main_shrholdr = Column(String(100), nullable=True)  # 주요주주 여부

    # Stock ownership details
    sp_stock_lmp_cnt = Column(BigInteger, nullable=True)  # 특정증권등 소유 주식수
    sp_stock_lmp_irds_cnt = Column(BigInteger, nullable=True)  # 특정증권등 소유 증감 주식수
    sp_stock_lmp_rate = Column(Numeric(10, 4), nullable=True)  # 특정증권등 소유 비율 (%)
    sp_stock_lmp_irds_rate = Column(Numeric(10, 4), nullable=True)  # 특정증권등 소유 증감 비율 (%)

    # Relationship
    stock = relationship("Stock", back_populates="insider_trading")

    def __repr__(self):
        return f"<InsiderTrading(stock_code={self.stock_code}, repror={self.repror}, rcept_dt={self.rcept_dt})>"

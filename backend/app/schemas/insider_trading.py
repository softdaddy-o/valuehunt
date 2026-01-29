"""Insider Trading schemas"""

from datetime import date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field


class InsiderTradingBase(BaseModel):
    """Base insider trading schema"""

    rcept_no: str = Field(..., max_length=14)
    rcept_dt: date
    repror: Optional[str] = None
    isu_exctv_rgist_at: Optional[str] = None
    isu_exctv_ofcps: Optional[str] = None
    isu_main_shrholdr: Optional[str] = None
    sp_stock_lmp_cnt: Optional[int] = None
    sp_stock_lmp_irds_cnt: Optional[int] = None
    sp_stock_lmp_rate: Optional[Decimal] = None
    sp_stock_lmp_irds_rate: Optional[Decimal] = None


class InsiderTradingResponse(InsiderTradingBase):
    """Schema for insider trading response"""

    id: int
    stock_code: str
    corp_name: Optional[str] = None

    # Computed field for frontend
    transaction_type: Optional[str] = None  # "매수", "매도", "변동없음"

    class Config:
        from_attributes = True


class InsiderTradingSummary(BaseModel):
    """Summary of insider trading activity"""

    total_transactions: int
    net_buy_count: int  # Number of buy transactions
    net_sell_count: int  # Number of sell transactions
    largest_holder: Optional[str] = None
    largest_holding_rate: Optional[Decimal] = None
    recent_trend: str  # "매수우세", "매도우세", "중립"


class InsiderTradingListResponse(BaseModel):
    """Schema for insider trading list response"""

    data: List[InsiderTradingResponse]
    summary: InsiderTradingSummary
    total_count: int

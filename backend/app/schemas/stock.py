"""Stock schemas"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field


class StockBase(BaseModel):
    """Base stock schema"""
    code: str = Field(..., max_length=10)
    name: str = Field(..., max_length=100)
    market: str = Field(..., max_length=10, description="KOSPI or KOSDAQ")
    sector: Optional[str] = Field(None, max_length=50)


class StockCreate(StockBase):
    """Schema for stock creation"""
    market_cap: Optional[int] = None
    current_price: Optional[int] = None
    change_rate: Optional[Decimal] = None


class StockUpdate(BaseModel):
    """Schema for stock update"""
    market_cap: Optional[int] = None
    current_price: Optional[int] = None
    change_rate: Optional[Decimal] = None


class StockResponse(StockBase):
    """Schema for stock response"""
    market_cap: Optional[int] = None
    current_price: Optional[int] = None
    change_rate: Optional[Decimal] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class KeyMetrics(BaseModel):
    """Key financial metrics"""
    PER: Optional[Decimal] = None
    PBR: Optional[Decimal] = None
    ROE: Optional[Decimal] = None
    debt_ratio: Optional[Decimal] = None
    dividend_yield: Optional[Decimal] = None


class CategoryScores(BaseModel):
    """Value score category breakdown"""
    valuation: Decimal
    profitability: Decimal
    stability: Decimal
    dividend: Decimal


class TopPickItem(BaseModel):
    """Schema for top pick list item"""
    rank: int
    stock_code: str
    stock_name: str
    market: str
    current_price: Optional[int] = None
    change_rate: Optional[Decimal] = None
    value_score: Decimal
    category_scores: CategoryScores
    key_metrics: KeyMetrics
    ai_summary: Optional[str] = None
    upside_potential: Optional[str] = None


class TopPicksResponse(BaseModel):
    """Schema for top picks response"""
    data: List[TopPickItem]
    total_count: int
    updated_at: datetime


class StockDetailResponse(BaseModel):
    """Schema for detailed stock information"""
    stock_info: StockResponse
    value_score: Dict[str, Any]
    ai_analysis: Dict[str, Any]
    financial_metrics: Dict[str, Any]
    peer_comparison: Optional[List[Dict[str, Any]]] = None
    external_links: Optional[Dict[str, str]] = None


class ScreenerRequest(BaseModel):
    """Schema for screener filter request"""
    filters: Dict[str, Any] = Field(
        ...,
        description="Filter criteria (market, PER_max, ROE_min, etc.)"
    )
    sort_by: str = Field(default="value_score", description="Sort field")
    order: str = Field(default="desc", description="Sort order (asc/desc)")
    limit: int = Field(default=50, ge=1, le=100)


class ScreenerResult(BaseModel):
    """Single screener result item"""
    stock_code: str
    stock_name: str
    value_score: Decimal
    current_price: Optional[int] = None
    PER: Optional[Decimal] = None
    PBR: Optional[Decimal] = None
    ROE: Optional[Decimal] = None


class ScreenerResponse(BaseModel):
    """Schema for screener response"""
    results: List[ScreenerResult]
    total_count: int
    filters_applied: Dict[str, Any]

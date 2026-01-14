"""Watchlist schemas"""

from datetime import datetime
from typing import Optional
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field


class WatchlistBase(BaseModel):
    """Base watchlist schema"""
    stock_code: str = Field(..., max_length=10)
    target_price: Optional[int] = None
    alert_enabled: bool = True


class WatchlistCreate(WatchlistBase):
    """Schema for adding stock to watchlist"""
    pass


class WatchlistUpdate(BaseModel):
    """Schema for updating watchlist item"""
    target_price: Optional[int] = None
    alert_enabled: Optional[bool] = None


class WatchlistItem(WatchlistBase):
    """Schema for watchlist item response"""
    id: int
    stock_name: str
    current_price: Optional[int] = None
    value_score: Optional[Decimal] = None
    value_score_change: Optional[str] = None
    added_at: datetime

    class Config:
        from_attributes = True


class WatchlistResponse(BaseModel):
    """Schema for watchlist response"""
    watchlist: list[WatchlistItem]

"""Watchlist model"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class Watchlist(Base):
    """Watchlist model for user's favorite stocks"""

    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    stock_code = Column(String(10), ForeignKey("stocks.code", ondelete="CASCADE"), nullable=False)
    target_price = Column(Integer)  # User's target price for the stock
    alert_enabled = Column(Boolean, default=True, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="watchlist")
    stock = relationship("Stock", back_populates="watchlist_items")

    __table_args__ = (
        UniqueConstraint('user_id', 'stock_code', name='uix_user_stock'),
        {'extend_existing': True}
    )

    def __repr__(self):
        return f"<Watchlist(user_id={self.user_id}, stock_code={self.stock_code}, target_price={self.target_price})>"

"""Screener Filter model"""

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.base import TimestampMixin


class ScreenerFilter(Base, TimestampMixin):
    """Screener filter model for saved user screening criteria"""

    __tablename__ = "screener_filters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    filters = Column(JSONB, nullable=False)  # JSON object with filter criteria

    # Relationships
    user = relationship("User", back_populates="screener_filters")

    def __repr__(self):
        return f"<ScreenerFilter(id={self.id}, user_id={self.user_id}, name={self.name})>"

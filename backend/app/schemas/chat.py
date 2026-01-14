"""Chat schemas"""

from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class RelatedLink(BaseModel):
    """Related link for chat response"""
    title: str
    url: str


class ChatRequest(BaseModel):
    """Schema for chat request"""
    message: str = Field(..., min_length=1, max_length=1000)
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Schema for chat response"""
    reply: str
    conversation_id: str
    related_links: Optional[List[RelatedLink]] = None

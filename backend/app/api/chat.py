"""Chat API routes"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, RelatedLink

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    AI chatbot for investment Q&A

    Requires authentication

    TODO: Integrate with Anthropic Claude API
    """
    # Generate or use existing conversation ID
    conversation_id = request.conversation_id or str(uuid.uuid4())

    # TODO: Integrate with Claude API
    # For now, return a placeholder response
    reply = f"Thank you for your question: '{request.message}'. This feature is coming soon!"

    # Related links based on question keywords
    related_links = []
    if "ROE" in request.message.upper():
        related_links.append(
            RelatedLink(
                title="ROE 높은 종목 보기",
                url="/screener?ROE_min=10",
            )
        )
    elif "PER" in request.message.upper():
        related_links.append(
            RelatedLink(
                title="저PER 종목 보기",
                url="/screener?PER_max=10",
            )
        )

    return ChatResponse(
        reply=reply,
        conversation_id=conversation_id,
        related_links=related_links if related_links else None,
    )

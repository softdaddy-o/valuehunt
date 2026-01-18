"""AI API routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import (
    StockAnalysisRequest,
    StockAnalysisResponse,
    AIChatRequest,
    AIChatResponse,
    StrategyRequest,
    StrategyResponse,
)
from app.services.ai_service import ai_service

router = APIRouter()


@router.get("/status")
async def ai_status():
    """Check if AI service is available"""
    return {
        "available": ai_service.is_available(),
        "message": "AI service is ready" if ai_service.is_available() else "AI service not configured (missing GEMINI_API_KEY)",
    }


@router.post("/analyze-stock", response_model=StockAnalysisResponse)
async def analyze_stock(
    request: StockAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate AI-powered stock analysis

    Requires authentication
    """
    if not ai_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not available. Please configure GEMINI_API_KEY.",
        )

    try:
        return await ai_service.analyze_stock(request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/chat", response_model=AIChatResponse)
async def chat(
    request: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    AI chatbot for investment Q&A

    Requires authentication
    """
    if not ai_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not available. Please configure GEMINI_API_KEY.",
        )

    try:
        return await ai_service.chat(request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/strategy", response_model=StrategyResponse)
async def execute_strategy(
    request: StrategyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Execute AI-powered trading strategy analysis

    Requires authentication

    Available strategies:
    - undervalued_screener: Find undervalued quality stocks
    - fear_driven_quality: Find oversold quality stocks
    - dividend_analyzer: Find stable dividend stocks
    """
    if not ai_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not available. Please configure GEMINI_API_KEY.",
        )

    try:
        return await ai_service.execute_strategy(request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

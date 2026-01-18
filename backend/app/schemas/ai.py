"""AI Service Schemas"""

from typing import Optional, List, Literal
from enum import Enum
from pydantic import BaseModel, Field


class StrategyType(str, Enum):
    """Strategy types for AI stock analysis"""
    UNDERVALUED_SCREENER = "undervalued_screener"
    FEAR_DRIVEN_QUALITY = "fear_driven_quality"
    DIVIDEND_ANALYZER = "dividend_analyzer"
    INSIDER_TRADING = "insider_trading"
    THEME_VS_REAL = "theme_vs_real"
    SECTOR_ROTATION = "sector_rotation"
    HIDDEN_GROWTH = "hidden_growth"
    PORTFOLIO_DESIGNER = "portfolio_designer"


class RiskLevel(str, Enum):
    """Risk level for stock recommendations"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# Stock Analysis Schemas
class StockMetrics(BaseModel):
    """Stock financial metrics"""
    PER: Optional[float] = None
    PBR: Optional[float] = None
    ROE: Optional[float] = None
    ROA: Optional[float] = None
    debtRatio: Optional[float] = None
    dividendYield: Optional[float] = None


class StockAnalysisRequest(BaseModel):
    """Request for stock analysis"""
    stockCode: str = Field(..., min_length=1)
    stockName: str = Field(..., min_length=1)
    marketCap: Optional[float] = None
    sector: Optional[str] = None
    currentPrice: Optional[float] = None
    metrics: Optional[StockMetrics] = None
    valueScore: Optional[float] = None


class StockAnalysisResponse(BaseModel):
    """Response from stock analysis"""
    summary: str
    strengths: List[str]
    risks: List[str]
    investmentThesis: Optional[str] = None
    targetPriceRange: Optional[str] = None


# Chat Schemas
class ConversationMessage(BaseModel):
    """Single message in conversation history"""
    role: Literal["user", "assistant"]
    content: str


class ChatContext(BaseModel):
    """Context for chat request"""
    stockCode: Optional[str] = None
    conversationHistory: Optional[List[ConversationMessage]] = None


class AIChatRequest(BaseModel):
    """Request for AI chat"""
    message: str = Field(..., min_length=1, max_length=2000)
    context: Optional[ChatContext] = None


class AIChatResponse(BaseModel):
    """Response from AI chat"""
    reply: str
    relatedStocks: Optional[List[str]] = None


# Strategy Schemas
class StrategyRequest(BaseModel):
    """Request for strategy execution"""
    strategyType: StrategyType
    market: Optional[Literal["KOSPI", "KOSDAQ", "US", "ALL"]] = "ALL"
    sector: Optional[str] = None
    stockCount: int = Field(default=10, ge=1, le=50)


class StockRecommendationMetrics(BaseModel):
    """Metrics for stock recommendation"""
    PER: Optional[float] = None
    PBR: Optional[float] = None
    ROE: Optional[float] = None
    debtRatio: Optional[float] = None
    dividendYield: Optional[float] = None
    revenueGrowth: Optional[float] = None
    profitGrowth: Optional[float] = None


class StockRecommendation(BaseModel):
    """Single stock recommendation"""
    stockCode: str
    stockName: str
    market: str
    sector: Optional[str] = None
    currentPrice: Optional[float] = None
    targetPrice: Optional[float] = None
    upsidePotential: Optional[str] = None
    rationale: str
    metrics: StockRecommendationMetrics
    riskLevel: RiskLevel
    confidenceScore: float = Field(..., ge=0, le=100)


class StrategyResponse(BaseModel):
    """Response from strategy execution"""
    strategyType: StrategyType
    title: str
    summary: str
    recommendations: List[StockRecommendation]
    marketContext: Optional[str] = None
    risks: List[str]
    methodology: str
    disclaimer: str
    generatedAt: str

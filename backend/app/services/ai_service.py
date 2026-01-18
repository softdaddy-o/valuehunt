"""
AI Service using Google Gemini
Handles stock analysis, chat, and strategy execution
"""

import asyncio
import json
import re
from datetime import datetime
from typing import List, Any

import google.generativeai as genai

from app.core.config import settings
from app.schemas.ai import (
    StockAnalysisRequest,
    StockAnalysisResponse,
    AIChatRequest,
    AIChatResponse,
    StrategyRequest,
    StrategyResponse,
    StrategyType,
    StockRecommendation,
    StockRecommendationMetrics,
    RiskLevel,
)


class AIService:
    """AI Service using Google Gemini"""

    def __init__(self):
        self.model_name = settings.GEMINI_MODEL
        self._configured = False
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._configured = True

    def is_available(self) -> bool:
        """Check if AI service is available"""
        return self._configured

    async def analyze_stock(self, request: StockAnalysisRequest) -> StockAnalysisResponse:
        """Generate stock analysis"""
        if not self._configured:
            raise ValueError("Gemini API key not configured")

        model = genai.GenerativeModel(self.model_name)
        prompt = self._build_stock_analysis_prompt(request)

        try:
            response = await asyncio.to_thread(model.generate_content, prompt)
            return self._parse_stock_analysis(response.text)
        except Exception as e:
            raise ValueError(f"Failed to generate stock analysis: {str(e)}")

    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        """Generate chat response"""
        if not self._configured:
            raise ValueError("Gemini API key not configured")

        model = genai.GenerativeModel(self.model_name)
        prompt = self._build_chat_prompt(request)

        try:
            response = await asyncio.to_thread(model.generate_content, prompt)
            text = response.text
            return AIChatResponse(
                reply=text,
                relatedStocks=self._extract_stock_mentions(text),
            )
        except Exception as e:
            raise ValueError(f"Failed to generate chat response: {str(e)}")

    async def execute_strategy(self, request: StrategyRequest) -> StrategyResponse:
        """Execute a trading strategy analysis"""
        if not self._configured:
            raise ValueError("Gemini API key not configured")

        model = genai.GenerativeModel(self.model_name)
        prompt = self._build_strategy_prompt(request)

        try:
            response = await asyncio.to_thread(model.generate_content, prompt)
            return self._parse_strategy_response(response.text, request.strategyType)
        except Exception as e:
            raise ValueError(f"Failed to execute strategy: {str(e)}")

    def _build_stock_analysis_prompt(self, request: StockAnalysisRequest) -> str:
        """Build prompt for stock analysis"""
        metrics = request.metrics or {}

        return f"""당신은 한국 주식 시장 전문 애널리스트입니다. 다음 종목에 대한 간결하고 명확한 투자 분석을 제공해주세요.

종목 정보:
- 종목명: {request.stockName} ({request.stockCode})
- 섹터: {request.sector or 'N/A'}
- 현재가: {f'{request.currentPrice:,.0f}' if request.currentPrice else 'N/A'}원
- Value Score: {request.valueScore or 'N/A'}

재무 지표:
- PER: {metrics.PER if metrics.PER else 'N/A'}
- PBR: {metrics.PBR if metrics.PBR else 'N/A'}
- ROE: {f'{metrics.ROE}%' if metrics.ROE else 'N/A'}
- 부채비율: {f'{metrics.debtRatio}%' if metrics.debtRatio else 'N/A'}
- 배당수익률: {f'{metrics.dividendYield}%' if metrics.dividendYield else 'N/A'}

다음 형식으로 JSON 응답을 제공해주세요:
{{
  "summary": "2-3문장으로 된 종목 요약",
  "strengths": ["강점1", "강점2", "강점3"],
  "risks": ["리스크1", "리스크2", "리스크3"],
  "investmentThesis": "투자 의견 (1-2문장)"
}}

JSON만 출력하고 다른 텍스트는 포함하지 마세요."""

    def _build_chat_prompt(self, request: AIChatRequest) -> str:
        """Build prompt for chat"""
        prompt = f"""당신은 ValueHunt의 AI 투자 어시스턴트입니다. 한국 주식 시장의 저평가 우량주를 찾고 투자 전략을 세우는 데 도움을 드립니다.

사용자 질문: {request.message}"""

        if request.context:
            if request.context.stockCode:
                prompt += f"\n\n관련 종목: {request.context.stockCode}"

            if request.context.conversationHistory:
                prompt += "\n\n이전 대화 내용:\n"
                for msg in request.context.conversationHistory:
                    role = "사용자" if msg.role == "user" else "AI"
                    prompt += f"{role}: {msg.content}\n"

        prompt += "\n\n친절하고 전문적인 어조로 답변해주세요. 구체적인 투자 조언보다는 정보 제공과 교육에 초점을 맞춰주세요."

        return prompt

    def _build_strategy_prompt(self, request: StrategyRequest) -> str:
        """Build prompt based on strategy type"""
        market = request.market or "한국"
        stock_count = request.stockCount

        strategy_prompts = {
            StrategyType.UNDERVALUED_SCREENER: self._build_undervalued_prompt(market, stock_count),
            StrategyType.FEAR_DRIVEN_QUALITY: self._build_fear_driven_prompt(market, stock_count),
            StrategyType.DIVIDEND_ANALYZER: self._build_dividend_prompt(market, stock_count),
        }

        return strategy_prompts.get(
            request.strategyType,
            self._build_undervalued_prompt(market, stock_count),
        )

    def _build_undervalued_prompt(self, market: str, stock_count: int) -> str:
        return f"""당신은 한국 주식 시장의 가치투자 전문가입니다.

현재 {market} 주식 시장에서 재무적으로 건전한 저평가 종목 {stock_count}개를 찾아주세요.

선정 기준:
- 동종 업계 평균보다 낮은 PER
- 최근 3년간 이익 성장
- 낮은 부채비율 (100% 이하 선호)
- 안정적인 현금흐름
- 증권사 리포트 기준 30% 이상 상승 여력

다음 JSON 형식으로 응답해주세요:
{{
  "title": "저평가 우량주 TOP {stock_count}",
  "summary": "시장 상황 및 종목 선정 개요 (2-3문장)",
  "recommendations": [
    {{
      "stockCode": "종목코드 (6자리 숫자)",
      "stockName": "종목명",
      "market": "KOSPI/KOSDAQ",
      "sector": "업종",
      "rationale": "저평가 이유 (2-3문장, 구체적인 재무지표 언급)",
      "metrics": {{
        "PER": 8.5,
        "PBR": 0.8,
        "ROE": 15.2,
        "debtRatio": 45.0,
        "profitGrowth": 12.5
      }},
      "upsidePotential": "+35%",
      "riskLevel": "low",
      "confidenceScore": 85
    }}
  ],
  "marketContext": "현재 시장 상황 분석 (2-3문장)",
  "risks": ["리스크 요인 1", "리스크 요인 2", "리스크 요인 3"],
  "methodology": "분석 방법론 설명 (1-2문장)"
}}

JSON만 출력하고 다른 텍스트는 포함하지 마세요."""

    def _build_fear_driven_prompt(self, market: str, stock_count: int) -> str:
        return f"""당신은 한국 주식 시장의 역발상 투자 전문가입니다.

현재 {market} 주식 시장에서 악재나 소문, 단기 이슈로 과도하게 매도된 우량주 {stock_count}개를 찾아주세요.

비교 분석:
- 최근 주가 하락 원인
- 실제 재무 상태 (매출, 이익, 현금흐름)
- 부채 상황
- 펀더멘털과 주가 괴리도

"시장이 오해하여 팔고 있는" 종목 {stock_count}개를 선정해주세요.

다음 JSON 형식으로 응답해주세요:
{{
  "title": "공포에 팔린 우량주 TOP {stock_count}",
  "summary": "시장 심리 및 기회 개요 (2-3문장)",
  "recommendations": [
    {{
      "stockCode": "종목코드 (6자리 숫자)",
      "stockName": "종목명",
      "market": "KOSPI/KOSDAQ",
      "sector": "업종",
      "rationale": "과매도 이유 및 실제 펀더멘털 분석 (2-3문장)",
      "metrics": {{
        "PER": 10.2,
        "PBR": 1.1,
        "ROE": 12.8,
        "debtRatio": 55.0,
        "revenueGrowth": 8.5
      }},
      "upsidePotential": "+40%",
      "riskLevel": "medium",
      "confidenceScore": 75
    }}
  ],
  "marketContext": "현재 시장 심리 및 공포 요인 분석 (2-3문장)",
  "risks": ["리스크 요인 1", "리스크 요인 2", "리스크 요인 3"],
  "methodology": "분석 방법론 설명 (1-2문장)"
}}

JSON만 출력하고 다른 텍스트는 포함하지 마세요."""

    def _build_dividend_prompt(self, market: str, stock_count: int) -> str:
        return f"""당신은 한국 주식 시장의 배당투자 전문가입니다.

현재 {market} 주식 시장에서 10년 이상 꾸준히 배당을 지급하거나 증액한 안정적인 배당주 {stock_count}개를 찾아주세요.

분석 항목:
- 배당수익률
- 배당 지속가능성
- 배당성향 대비 이익
- 10년 장기투자 시뮬레이션

은퇴 자금 / 장기 소득투자에 적합한 종목을 선정해주세요.

다음 JSON 형식으로 응답해주세요:
{{
  "title": "장기 투자용 배당주 TOP {stock_count}",
  "summary": "배당주 투자 환경 및 선정 개요 (2-3문장)",
  "recommendations": [
    {{
      "stockCode": "종목코드 (6자리 숫자)",
      "stockName": "종목명",
      "market": "KOSPI/KOSDAQ",
      "sector": "업종",
      "rationale": "배당 안정성 및 매력도 분석 (2-3문장)",
      "metrics": {{
        "dividendYield": 4.5,
        "PER": 12.0,
        "PBR": 1.2,
        "ROE": 10.5,
        "debtRatio": 35.0
      }},
      "upsidePotential": "+15% + 배당",
      "riskLevel": "low",
      "confidenceScore": 90
    }}
  ],
  "marketContext": "배당주 투자 환경 분석 (2-3문장)",
  "risks": ["리스크 요인 1", "리스크 요인 2", "리스크 요인 3"],
  "methodology": "분석 방법론 설명 (1-2문장)"
}}

JSON만 출력하고 다른 텍스트는 포함하지 마세요."""

    def _parse_stock_analysis(self, text: str) -> StockAnalysisResponse:
        """Parse stock analysis response"""
        try:
            clean_text = self._clean_json_response(text)
            parsed = json.loads(clean_text)

            return StockAnalysisResponse(
                summary=parsed.get("summary", ""),
                strengths=parsed.get("strengths", []),
                risks=parsed.get("risks", []),
                investmentThesis=parsed.get("investmentThesis"),
                targetPriceRange=parsed.get("targetPriceRange"),
            )
        except (json.JSONDecodeError, KeyError) as e:
            return StockAnalysisResponse(
                summary=text[:200] + "..." if len(text) > 200 else text,
                strengths=["분석 데이터 처리 중"],
                risks=["분석 데이터 처리 중"],
                investmentThesis="상세 분석이 필요합니다.",
            )

    def _parse_strategy_response(
        self, text: str, strategy_type: StrategyType
    ) -> StrategyResponse:
        """Parse strategy response"""
        default_titles = {
            StrategyType.UNDERVALUED_SCREENER: "저평가 우량주 TOP 10",
            StrategyType.FEAR_DRIVEN_QUALITY: "공포에 팔린 우량주 TOP 5",
            StrategyType.DIVIDEND_ANALYZER: "장기 투자용 배당주 TOP 10",
        }
        default_title = default_titles.get(strategy_type, "AI 분석 결과")

        try:
            clean_text = self._clean_json_response(text)
            parsed = json.loads(clean_text)

            return StrategyResponse(
                strategyType=strategy_type,
                title=parsed.get("title", default_title),
                summary=parsed.get("summary", ""),
                recommendations=self._validate_recommendations(
                    parsed.get("recommendations", [])
                ),
                marketContext=parsed.get("marketContext"),
                risks=parsed.get("risks", []),
                methodology=parsed.get("methodology", "AI 기반 정량적 분석"),
                disclaimer="본 분석은 AI 기반 참고 자료이며, 투자 권유가 아닙니다. 투자 판단은 본인 책임입니다.",
                generatedAt=datetime.utcnow().isoformat(),
            )
        except (json.JSONDecodeError, KeyError) as e:
            return StrategyResponse(
                strategyType=strategy_type,
                title=default_title,
                summary="AI 응답 처리 중 오류가 발생했습니다.",
                recommendations=[],
                risks=["응답 파싱 오류"],
                methodology="AI 분석",
                disclaimer="본 분석은 AI 기반 참고 자료이며, 투자 권유가 아닙니다. 투자 판단은 본인 책임입니다.",
                generatedAt=datetime.utcnow().isoformat(),
            )

    def _validate_recommendations(
        self, recommendations: List[Any]
    ) -> List[StockRecommendation]:
        """Validate and sanitize recommendations"""
        result = []
        for rec in recommendations:
            if not isinstance(rec, dict):
                continue
            if not rec.get("stockCode") or not rec.get("stockName"):
                continue

            metrics_data = rec.get("metrics", {})
            metrics = StockRecommendationMetrics(
                PER=metrics_data.get("PER"),
                PBR=metrics_data.get("PBR"),
                ROE=metrics_data.get("ROE"),
                debtRatio=metrics_data.get("debtRatio"),
                dividendYield=metrics_data.get("dividendYield"),
                revenueGrowth=metrics_data.get("revenueGrowth"),
                profitGrowth=metrics_data.get("profitGrowth"),
            )

            risk_level_str = rec.get("riskLevel", "medium").lower()
            try:
                risk_level = RiskLevel(risk_level_str)
            except ValueError:
                risk_level = RiskLevel.MEDIUM

            result.append(
                StockRecommendation(
                    stockCode=rec["stockCode"],
                    stockName=rec["stockName"],
                    market=rec.get("market", "KOSPI"),
                    sector=rec.get("sector"),
                    currentPrice=rec.get("currentPrice"),
                    targetPrice=rec.get("targetPrice"),
                    upsidePotential=rec.get("upsidePotential", "N/A"),
                    rationale=rec.get("rationale", ""),
                    metrics=metrics,
                    riskLevel=risk_level,
                    confidenceScore=rec.get("confidenceScore", 50),
                )
            )
        return result

    def _clean_json_response(self, text: str) -> str:
        """Remove markdown code blocks from response"""
        clean = re.sub(r"```json\n?", "", text)
        clean = re.sub(r"```\n?", "", clean)
        return clean.strip()

    def _extract_stock_mentions(self, text: str) -> List[str]:
        """Extract stock codes from text"""
        code_pattern = r"\b\d{6}\b"
        matches = re.findall(code_pattern, text)
        return list(set(matches))


# Singleton instance
ai_service = AIService()

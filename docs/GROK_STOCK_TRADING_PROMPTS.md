# GROK Stock Trading Algorithm - AI Prompts Summary

## Overview
GROK is described as a genius-level stock trader. This document summarizes 8 AI prompts that can automate stock trading analysis and discovery.

## 8 AI Prompts for Stock Trading Automation

### 1. Automated Undervalued Stock Screener (저평가 종목 자동 스크리너)

**Prompt:**
```
Analyze the current Korean stock market (or US stock market) and find 10 financially solid undervalued stocks.

Criteria:
- Lower PER compared to industry average
- Profit growth over the last 3 years
- Low debt ratio
- Stable cash flow
- 30%+ upside potential based on brokerage reports

Explain in simple terms why each stock is undervalued.
```

**Use Case:** Identifying value investment opportunities based on fundamental analysis.

---

### 2. Insider Trading Pattern Analysis (내부자 매수 패턴 분석)

**Prompt:**
```
Find companies in [sector/industry] where executives, major shareholders, and insiders have continuously purchased their own company's stocks in the last 6 months.

Exclude short-term event-driven purchases, focusing on:
- Repeated purchases
- Large voluntary purchases
- Long-term holding intent

Select TOP 5 stocks and explain what this pattern means to investors.
```

**Use Case:** Detecting strong buy signals from insider confidence.

---

### 3. Fear-Driven Quality Stock Discovery (공포에 팔린 우량주 찾기)

**Prompt:**
```
Find stocks that have been excessively sold off due to bad news, rumors, or short-term issues, but have solid fundamentals.

Compare:
- Recent stock price drop reasons
- Actual financial condition
- Revenue, profit, cash flow
- Debt situation

Select 5 stocks that "people are misunderstanding and selling off."
```

**Use Case:** Contrarian investing - buying quality stocks during market overreactions.

---

### 4. Long-term Dividend Stock Analyzer (장기 투자용 배당주 분석기)

**Prompt:**
```
Analyze stable dividend stocks that have consistently paid or increased dividends for 10+ years.

For each stock, calculate:
- Dividend yield
- Dividend sustainability
- Payout ratio vs earnings
- 10-year return simulation for long-term investment

Rank stocks suitable for retirement/passive income investing.
```

**Use Case:** Building passive income portfolios for long-term wealth.

---

### 5. Theme Stock vs Real Performance Stock Classifier (테마주 vs 진짜 실적주 구분기)

**Prompt:**
```
Among currently popular theme stocks (AI, secondary batteries, semiconductors, robotics), distinguish between:
- Stocks with high expectations only
- Stocks backed by actual performance

Based on PER, revenue growth, net profit, and cash flow, select:
- 3 overvalued stocks
- 3 undervalued stocks

Explain the reasons simply.
```

**Use Case:** Avoiding hype-driven investments and finding real value.

---

### 6. Sector Rotation Based on Economic Indicators (금리·물가·경기 기준 섹터 로테이션)

**Prompt:**
```
Analyze current interest rates, inflation, and economic trends to predict favorable sectors for the next 6-12 months.

Examples: Semiconductors, Healthcare, Finance, Consumer Staples, Energy

For each sector, organize:
- Why it's favorable
- Which stocks are promising
- Short/medium/long-term strategies
```

**Use Case:** Strategic asset allocation based on macroeconomic cycles.

---

### 7. Hidden Growth Stock Finder (아직 안 알려진 소형 성장주 찾기)

**Prompt:**
```
Find stocks with small market cap but high growth potential.

Criteria:
- Annual revenue growth 20%+
- Improving operating profit margin
- Low debt
- Low institutional ownership
- Understandable business structure

Select 5 "hidden gems" and also explain the risks.
```

**Use Case:** Early-stage growth investing with asymmetric upside potential.

---

### 8. Personalized Portfolio Designer for Korean Retail Investors (한국 개인투자자 맞춤 포트폴리오 설계)

**Prompt:**
```
My investment amount is [amount] KRW, and my investment style is [conservative/neutral/aggressive].

Build a portfolio divided into short/medium/long-term with:
- Stock allocation by weight
- Expected volatility
- Expected return
- Stop-loss criteria
- Rebalancing schedule

Create a realistic portfolio.
```

**Use Case:** Personalized investment strategy based on risk tolerance and goals.

---

## Implementation Potential for ValueHunt

These prompts can be integrated into ValueHunt's AI-powered stock discovery platform to provide:

1. **Automated Stock Screening** - Replace manual research with AI-driven analysis
2. **Multi-Strategy Analysis** - Combine value, growth, dividend, and contrarian strategies
3. **Risk Management** - Built-in stop-loss and portfolio rebalancing features
4. **Personalization** - Tailor recommendations to user risk profiles
5. **Market Intelligence** - Leverage insider patterns and macroeconomic indicators

## Technical Considerations

- **Data Sources:** Need access to financial APIs (Korean/US stock market data)
- **AI Model:** Can use GPT-4, Claude, or GROK API for analysis
- **Real-time Updates:** Implement scheduled analysis runs
- **User Interface:** Present recommendations in an intuitive dashboard
- **Backtesting:** Validate strategies against historical data

## Next Steps

1. Evaluate available financial data APIs (Yahoo Finance, Alpha Vantage, Korean exchanges)
2. Design prompt engineering templates for each strategy
3. Build AI service integration layer
4. Create user preference collection flow
5. Implement portfolio recommendation engine
6. Add backtesting and performance tracking features

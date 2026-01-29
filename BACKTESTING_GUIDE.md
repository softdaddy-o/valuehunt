# AI Stock Backtesting Feature Guide

## Overview

The backtesting feature allows you to validate the AI stock recommendation algorithm using historical data. By simulating how the algorithm would have performed in the past, you can verify its effectiveness before using it for real investments.

## How It Works

### 1. **Historical Simulation**
The backtesting engine runs the AI algorithm on historical stock data from a specific date in the past (e.g., 5 years ago). It identifies which stocks would have been recommended at that time.

### 2. **Performance Tracking**
After identifying recommendations, the system tracks how those stocks actually performed over a defined holding period (e.g., 12 months). This includes:
- Actual returns achieved
- Comparison against market indices (KOSPI/KOSDAQ)
- Risk metrics (volatility, Sharpe ratio, max drawdown)

### 3. **Analysis & Insights**
The system provides comprehensive analytics to help you understand:
- Which strategies perform best
- Sector-specific performance patterns
- Value score effectiveness
- Prediction accuracy

## Getting Started

### Step 1: Database Migration

Run the Alembic migration to create the backtesting tables:

```bash
cd backend
alembic upgrade head
```

This creates the following tables:
- `backtest_runs` - Stores backtest configuration and results
- `backtest_recommendations` - Individual stock recommendations and performance
- `historical_stock_prices` - Historical OHLC price data
- `historical_financial_metrics` - Historical financial metrics snapshots
- `backtest_schedules` - Automated backtesting schedules

### Step 2: Collect Historical Data

Before running backtests, you need to collect historical stock price data:

```bash
# Via API endpoint (recommended for first-time setup)
POST /api/v1/backtest/data/collect-historical-prices
{
  "start_date": "2019-01-01",
  "end_date": "2024-01-01",
  "market": "ALL"
}
```

This process runs in the background and collects:
- Historical daily OHLC prices for all stocks
- Historical financial metrics (when available from DART)

**Note:** Collecting 5 years of data for all stocks may take significant time. The process runs asynchronously.

### Step 3: Create a Backtest

#### Via Frontend UI

1. Navigate to `/backtest` in the web application
2. Click "New Backtest" button
3. Fill in the configuration:
   - **Name**: Descriptive name (e.g., "5-Year Value Strategy Test")
   - **Strategy Type**: Choose from 8 AI strategies or "Value Score Only"
   - **Market**: KOSPI, KOSDAQ, or ALL
   - **Start Date**: Beginning of test period (e.g., 2019-01-01)
   - **End Date**: End of test period (e.g., 2024-01-01)
   - **Lookback Years**: Historical data to use (5 or 10 years)
   - **Holding Period**: How long to hold stocks (3, 6, 12, or 24 months)
   - **Test Frequency**: How often to run simulations (monthly, quarterly, yearly)
4. Click "Create & Run"

#### Via API

```bash
POST /api/v1/backtest/create
{
  "name": "5-Year Value Strategy Test",
  "strategy_type": "UNDERVALUED_SCREENER",
  "market": "ALL",
  "start_date": "2019-01-01",
  "end_date": "2024-01-01",
  "lookback_years": 5,
  "holding_period_months": 12,
  "frequency": "monthly"
}
```

This creates multiple backtest runs (one per frequency interval) and executes them in the background.

## Understanding Results

### Performance Metrics

#### **Average Return (%)**
- The mean return across all recommended stocks
- **Good**: > 10% annually
- **Excellent**: > 20% annually

#### **Win Rate (%)**
- Percentage of recommendations that had positive returns
- **Good**: > 60%
- **Excellent**: > 70%

#### **Alpha (%)**
- Excess return compared to the market index
- **Good**: > 5%
- **Excellent**: > 10%
- Negative alpha means underperformed the market

#### **Sharpe Ratio**
- Risk-adjusted return (higher is better)
- **Good**: > 1.0
- **Excellent**: > 2.0
- Accounts for volatility of returns

#### **Max Drawdown (%)**
- Largest peak-to-trough decline
- **Good**: < -20%
- **Concerning**: > -40%
- Indicates worst-case scenario risk

#### **Volatility (%)**
- Standard deviation of returns
- Lower is better for conservative investors
- Higher volatility = higher risk

### Strategy Comparison

The Analytics tab shows comparative performance across different strategies:

1. **Best by Return**: Highest average returns
2. **Best by Sharpe**: Best risk-adjusted returns
3. **Best by Win Rate**: Most consistent positive outcomes

Use this to identify which strategy aligns with your investment goals and risk tolerance.

### Pattern Analysis

For each backtest run, you can analyze:

#### **Sector Performance**
- Which sectors performed best/worst
- Sector-specific win rates
- Helps identify sector biases in the algorithm

#### **Value Score Analysis**
- Performance by value score ranges (0-40, 40-60, 60-80, 80-100)
- Validates if higher value scores correlate with better returns
- Expected: Higher scores should have better average returns

#### **Top/Bottom Performers**
- Top 5 best-performing recommendations
- Bottom 5 worst-performing recommendations
- Learn from outliers and edge cases

## API Reference

### Backtest Management

```bash
# List all backtests
GET /api/v1/backtest/runs?limit=50&offset=0&status=completed

# Get specific backtest details
GET /api/v1/backtest/runs/{backtest_id}

# Get recommendations from a backtest
GET /api/v1/backtest/runs/{backtest_id}/recommendations

# Delete a backtest
DELETE /api/v1/backtest/runs/{backtest_id}

# Execute a pending backtest
POST /api/v1/backtest/runs/{backtest_id}/execute
```

### Analytics

```bash
# Compare strategies
GET /api/v1/backtest/analytics/compare?strategy_types=UNDERVALUED_SCREENER,DIVIDEND_ANALYZER&market=KOSPI

# Analyze recommendation patterns
GET /api/v1/backtest/analytics/runs/{backtest_id}/patterns

# Get time series performance
GET /api/v1/backtest/analytics/time-series?strategy_type=UNDERVALUED_SCREENER

# Get summary statistics
GET /api/v1/backtest/analytics/summary

# Find frequently recommended stocks
GET /api/v1/backtest/analytics/stock-frequency?min_occurrences=3
```

## Best Practices

### 1. **Sufficient Historical Data**
- Collect at least 5 years of historical data
- More data = more reliable backtest results
- Consider market cycles (bull and bear markets)

### 2. **Multiple Time Periods**
- Test across different time periods
- Include both bull markets and bear markets
- Identify if strategy is market-dependent

### 3. **Realistic Holding Periods**
- Match your actual investment horizon
- Shorter holding periods (3-6 months) for active trading
- Longer holding periods (12-24 months) for value investing

### 4. **Compare Multiple Strategies**
- Don't rely on a single strategy
- Use analytics to compare performance
- Consider portfolio diversification

### 5. **Understand Limitations**
- Past performance doesn't guarantee future results
- Historical data may have survivorship bias
- Market conditions change over time

## Architecture

### Database Schema

```
backtest_runs
├── Configuration (strategy, market, dates)
├── Status (pending, running, completed, failed)
└── Performance Metrics (returns, win rate, Sharpe, etc.)

backtest_recommendations
├── Stock Details (code, name, sector)
├── Recommendation Data (rank, value score, AI predictions)
├── Entry Metrics (price, PER, PBR at recommendation time)
└── Exit Performance (actual returns, max drawdown, etc.)

historical_stock_prices
├── Stock Code
├── Date
└── OHLC + Volume

historical_financial_metrics
├── Stock Code
├── Snapshot Date
└── Financial Ratios (PER, ROE, etc.)
```

### Backtesting Engine Flow

1. **Create Backtest Run** → Defines configuration
2. **Historical Data Lookup** → Retrieves price/metrics at simulation date
3. **Run Algorithm** → Generates recommendations using historical data
4. **Track Performance** → Monitors actual price movements
5. **Calculate Statistics** → Aggregates results
6. **Store Results** → Saves for analysis

## Troubleshooting

### Issue: No historical data available

**Solution:** Run the historical data collection endpoint first:
```bash
POST /api/v1/backtest/data/collect-historical-prices
```

### Issue: Backtest stuck in "running" status

**Possible causes:**
1. Background task failed - check backend logs
2. Missing historical data for stocks
3. Database connection issues

**Solution:**
- Check backend logs for errors
- Retry execution via API
- Delete and recreate the backtest

### Issue: Low performance across all backtests

**This could indicate:**
1. Algorithm needs tuning
2. Strategy not suited for the market period tested
3. Historical data quality issues

**Solution:**
- Review algorithm parameters
- Test different strategies
- Verify historical data accuracy

## Future Enhancements

Planned improvements:
- [ ] Transaction cost modeling
- [ ] Portfolio rebalancing simulation
- [ ] Monte Carlo simulation
- [ ] Walk-forward optimization
- [ ] Custom strategy builder
- [ ] Export reports to PDF/Excel
- [ ] Automated scheduled backtesting

## Support

For questions or issues:
1. Check the backend logs: `backend/logs/`
2. Review API documentation: `/docs`
3. Inspect database directly for debugging

---

**Remember:** Backtesting is a tool for validation, not prediction. Always combine quantitative analysis with qualitative research and risk management.

# Claude Sonnet 4.5 Setup Guide

ValueHunt is now configured to use **Claude Sonnet 4.5** as the primary AI provider for best-quality stock analysis and investment insights.

## Why Claude Sonnet 4.5?

Claude Sonnet 4.5 provides superior analytical capabilities for financial analysis:

### Advantages
- **Superior Financial Analysis** - Exceptional at analyzing financial metrics and market context
- **Detailed Investment Thesis** - Generates comprehensive, nuanced investment recommendations
- **Industry Context** - Better understanding of sector dynamics and competitive positioning
- **Risk Assessment** - More thorough identification and articulation of investment risks
- **Analytical Writing** - Natural, professional-grade analysis that reads like a human analyst

### Comparison

| Feature | Claude Sonnet 4.5 | Gemini 2.5 Flash | GPT-4o |
|---------|-------------------|------------------|---------|
| Quality | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Good |
| Financial Analysis | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐ Fair | ⭐⭐⭐⭐ Good |
| Cost per Analysis | $0.033 | $0.0007 | $0.0225 |
| Speed | 2-4 seconds | 1-2 seconds | 2-3 seconds |
| Context Window | 200K tokens | 128K tokens | 128K tokens |

## Quick Start

### 1. Get Your Claude API Key

1. Visit https://console.anthropic.com/
2. Sign up or log in to your account
3. Navigate to "API Keys" section
4. Click "Create Key"
5. Name it (e.g., "ValueHunt Production")
6. Copy the key immediately (shown only once)

**Important:** Store the key securely - you won't be able to see it again.

### 2. Configure Environment

```bash
cd frontend
cp .env.example .env
```

Edit `.env` and add your Claude API key:

```env
# REQUIRED - Claude Sonnet 4.5 for best quality analysis
VITE_CLAUDE_API_KEY=sk-ant-api03-your-actual-key-here
VITE_CLAUDE_MODEL=claude-sonnet-4-5-20250929

# OPTIONAL - Gemini as fallback
VITE_GEMINI_API_KEY=
VITE_GEMINI_MODEL=gemini-2.5-flash
```

### 3. Test the Integration

```bash
npm run dev
```

Navigate to http://localhost:5173/chat

You should see:
- ✅ Green banner: "AI 활성화: Claude Sonnet 4.5로 고품질 투자 분석을 제공합니다."

Try asking:
- "삼성전자 분석해줘"
- "포트폴리오 전략 알려줘"
- "배당주 추천해줘"

Console should show:
```
HybridAIService initialized: {
  geminiAvailable: false,
  claudeAvailable: true,
  defaultProvider: 'claude'
}
Chat query with claude
```

## Pricing & Usage

### Claude Sonnet 4.5 Pricing (2026)

- **Input:** $3 per million tokens
- **Output:** $15 per million tokens
- **Context Window:** 200K tokens

### Estimated Monthly Costs

**Conservative Usage (50 analyses/day):**
- Stock analyses: ~$50/month
- Chat queries: ~$25/month
- **Total: ~$75/month**

**Active Usage (100 analyses/day):**
- Stock analyses: ~$99/month
- Chat queries: ~$50/month
- **Total: ~$150/month**

**Per Request Cost:**
- Stock analysis (deep): ~$0.033 per request
- Chat response: ~$0.020 per request

### Cost Optimization Tips

1. **Prompt Caching** (Already Implemented)
   - Caches system prompts and templates
   - 90% cost reduction on cached content
   - Automatic - no configuration needed

2. **Batch API** (Future Enhancement)
   - 50% discount for overnight processing
   - Perfect for pre-generating analysis
   - Process 1,000 stocks overnight: ~$16.50 instead of ~$33

3. **Smart Fallback**
   - Gemini handles requests if Claude unavailable
   - Reduces costs during high-volume periods
   - Maintains service reliability

## API Tier Recommendations

### Tier 1 (Default - Free)
- **Rate Limits:** 5 requests/minute, 40K tokens/minute
- **Monthly Spend:** $0
- **Best For:** Development, testing, low-volume usage
- **Limitations:** May need to add delays for batch operations

### Tier 2 ($5 initial deposit)
- **Rate Limits:** 50 requests/minute, 400K tokens/minute
- **Monthly Spend:** $5 minimum
- **Best For:** Small production deployments
- **Supports:** ~150 analyses/day comfortably

### Tier 3+ (Contact Sales)
- **Rate Limits:** Higher limits, custom pricing
- **Best For:** High-volume production use
- **Supports:** Unlimited scaling

**Recommendation:** Start with Tier 1 for development, upgrade to Tier 2 for production.

## Configuration Details

### Current Setup (Claude-First)

The system is configured to:
1. **Default Provider:** Claude Sonnet 4.5
2. **Fallback:** Gemini 2.5 Flash (if configured)
3. **Analysis Type:** Deep analysis by default
4. **Mock Fallback:** If no AI available, uses placeholder responses

### Smart Routing

All requests prioritize Claude:

**Stock Analysis:**
```typescript
// Always uses Claude when available
generateStockAnalysis(stockDetail) // → Claude Sonnet 4.5
```

**Chat:**
```typescript
// Claude for all queries by default
getAIChatResponse(message, history) // → Claude Sonnet 4.5
```

**Fallback Chain:**
```
Claude → Gemini (if configured) → Mock/Placeholder
```

## Features Enabled with Claude

### Stock Analysis
- **Summary:** 3-4 sentence comprehensive overview
- **Strengths:** 4 specific strengths with data backing
- **Risks:** 4 concrete risks across categories
- **Investment Thesis:** Detailed recommendation with Value Score context
- **Target Price Range:** Price potential analysis

### Chat Features
- **Financial Q&A:** Deep understanding of Korean stock market
- **Portfolio Strategy:** Comprehensive diversification advice
- **Risk Management:** Detailed risk assessment
- **Sector Analysis:** Industry-specific insights
- **Comparative Analysis:** Multi-stock comparisons

## Monitoring Usage

### Check Console Logs

Development mode shows routing decisions:
```javascript
HybridAIService initialized: {
  geminiAvailable: false,
  claudeAvailable: true,
  defaultProvider: 'claude'
}

Analyzing stock 005930 with claude
Chat query with claude
```

### Anthropic Dashboard

Monitor usage at https://console.anthropic.com/

Track:
- Daily token usage
- Cost per day
- Request volume
- Error rates

Set up budget alerts to avoid surprises.

## Troubleshooting

### "AI service not available"

**Check 1:** API key is set correctly
```bash
# In frontend/.env
echo $VITE_CLAUDE_API_KEY  # Should show your key
```

**Check 2:** Key is valid
- Visit https://console.anthropic.com/
- Check if key is still active
- Regenerate if needed

**Check 3:** Restart dev server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Rate Limiting Errors

**Symptom:** "429 Too Many Requests"

**Solutions:**
1. Wait 60 seconds between requests (Tier 1: 5 req/min)
2. Use batch generation with delays:
   ```typescript
   batchGenerateStockSummaries(stocks, 12000) // 12 second delay
   ```
3. Upgrade to Tier 2 for higher limits

### High Costs

**Monitor in Console:**
```javascript
// Check which provider is being used
getAIService().getServiceStatus()
```

**Cost Controls:**
1. Set budget alerts in Anthropic dashboard
2. Monitor daily usage
3. Consider adding Gemini for high-volume simple queries:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_key
   ```
4. Implement user-based rate limiting

## Advanced Configuration

### Add Gemini as Fallback

To reduce costs while maintaining quality:

```env
# Primary - Claude for quality
VITE_CLAUDE_API_KEY=sk-ant-api03-your-key

# Fallback - Gemini for availability
VITE_GEMINI_API_KEY=your-gemini-key
```

Benefits:
- Claude handles all requests when available
- Gemini provides backup during Claude outages
- Gemini free tier (1,500 req/day) for development

### Custom Model Configuration

To use a different Claude model:

```env
# Use Claude Haiku for faster, cheaper responses
VITE_CLAUDE_MODEL=claude-haiku-4-5-20250929

# Or Claude Opus for maximum quality
VITE_CLAUDE_MODEL=claude-opus-4-5-20251101
```

**Model Comparison:**
- **Haiku:** Faster, cheaper ($1/$5 per M tokens)
- **Sonnet:** Balanced (current choice)
- **Opus:** Highest quality ($5/$25 per M tokens)

## Security Best Practices

### API Key Security

1. **Never commit .env files**
   ```bash
   # .env is in .gitignore - verify:
   git status .env  # Should not appear
   ```

2. **Rotate keys regularly**
   - Every 90 days minimum
   - Immediately if compromised
   - After team member departure

3. **Use environment-specific keys**
   - Development: Separate key
   - Production: Separate key
   - Never share keys between environments

### Production Deployment

For production, consider:

1. **Backend Proxy** (Recommended)
   ```
   Frontend → Backend API → Claude API
   ```
   Benefits:
   - Hide API keys from client
   - Add rate limiting per user
   - Monitor and log requests
   - Implement caching

2. **Environment Variables**
   - Use platform secrets (Vercel, Netlify)
   - Never hardcode keys
   - Rotate on deployment

3. **Usage Monitoring**
   - Set up budget alerts
   - Monitor unusual patterns
   - Log all API calls

## Next Steps

### 1. Development
```bash
# Add Claude key to .env
VITE_CLAUDE_API_KEY=your_key

# Test locally
npm run dev
```

### 2. Integration
Wire up stock detail pages:
```typescript
import { generateStockAnalysis } from '@/services/aiStockService'

const analysis = await generateStockAnalysis(stockDetail)
// Uses Claude automatically
```

### 3. Production
- Move API calls to backend
- Implement response caching
- Set up monitoring
- Configure budget alerts

## Support

### Issues?

1. Check browser console for errors
2. Verify API key is active in Anthropic dashboard
3. Review this guide's troubleshooting section
4. Check https://status.anthropic.com/ for service status

### Need Help?

- Anthropic Support: https://support.anthropic.com/
- API Documentation: https://docs.anthropic.com/
- GitHub Issues: https://github.com/anthropics/anthropic-sdk-typescript

## Summary

You're now configured to use **Claude Sonnet 4.5** for best-in-class stock analysis:

- ✅ Superior financial analysis quality
- ✅ Comprehensive investment insights
- ✅ Professional-grade analytical writing
- ✅ Smart fallback to Gemini (if configured)
- ✅ Automatic prompt caching (90% savings)
- ✅ Production-ready implementation

**Cost:** ~$75-150/month for active usage
**Quality:** ⭐⭐⭐⭐⭐ Excellent
**Setup Time:** < 5 minutes

Get your API key and start analyzing! 🚀

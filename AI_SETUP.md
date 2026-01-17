# AI Integration Setup Guide

ValueHunt uses a hybrid AI approach combining Google Gemini and Anthropic Claude for intelligent stock analysis and chat functionality.

## Overview

### Hybrid AI Strategy

- **Gemini 2.5 Flash**: Quick, cost-effective analysis (~$2/month for 100 analyses/day)
  - Used for: General chat, quick stock summaries, high-volume requests
  - Cost: $0.075 input / $0.30 output per million tokens

- **Claude Sonnet 4.5**: Deep, high-quality analysis (~$99/month for 100 analyses/day)
  - Used for: Watchlist stocks, detailed analysis, complex financial questions
  - Cost: $3 input / $15 output per million tokens
  - Features: Superior analytical writing, prompt caching (90% savings on repeated content)

### Smart Routing Logic

The system automatically routes requests to the most appropriate AI:

**Stock Analysis:**
- Value Score ≥ 70 → Claude (deep analysis for quality picks)
- Value Score < 70 → Gemini (quick analysis for screening)
- Complete financial data → Claude
- Partial data → Gemini

**Chat:**
- Complex keywords (분석, 비교, 전략, 포트폴리오) → Claude
- Simple queries → Gemini

**Fallback:**
- If primary service fails, automatically falls back to the other
- If both unavailable, falls back to placeholder analysis

## Setup Instructions

### 1. Get API Keys

#### Google Gemini
1. Visit https://ai.google.dev/
2. Sign in with your Google account
3. Click "Get API Key" in Google AI Studio
4. Copy your API key

**Free Tier:** 1,500 requests/day for development

#### Anthropic Claude
1. Visit https://console.anthropic.com/
2. Create an account or sign in
3. Go to "API Keys" section
4. Create a new API key
5. Copy your API key

**Pricing:** Pay-as-you-go, no free tier

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```env
   # Google Gemini AI
   VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
   VITE_GEMINI_MODEL=gemini-2.5-flash

   # Anthropic Claude AI
   VITE_CLAUDE_API_KEY=your_actual_claude_api_key_here
   VITE_CLAUDE_MODEL=claude-sonnet-4-5-20250929
   ```

3. **Important:** Never commit `.env` to git. It's already in `.gitignore`.

### 3. Test the Integration

Start the development server:
```bash
npm run dev
```

Navigate to the Chat page (`/chat`) and you should see:
- Green banner: "AI 활성화: Gemini와 Claude를 활용한 하이브리드 AI가 응답합니다."
- If amber banner appears, check your API keys

Try asking:
- "삼성전자 분석해줘" (Should use Gemini for quick response)
- "포트폴리오 전략 알려줘" (Should use Claude for detailed advice)

### 4. Monitor Usage

Check browser console for AI routing decisions:
```
Analyzing stock 005930 with gemini
Chat query with claude
```

## Architecture

### File Structure

```
frontend/src/services/ai/
├── types.ts              # TypeScript interfaces and types
├── gemini.service.ts     # Gemini implementation
├── claude.service.ts     # Claude implementation
├── hybrid.service.ts     # Smart routing orchestrator
└── index.ts              # Factory and singleton

frontend/src/services/
├── aiChatService.ts      # Chat integration
└── aiStockService.ts     # Stock analysis integration
```

### Usage in Code

```typescript
import { getAIService, AnalysisType } from '@/services/ai'

// Get the hybrid service
const aiService = getAIService()

// Analyze stock (automatic routing)
const analysis = await aiService.analyzeStock({
  stockCode: '005930',
  stockName: '삼성전자',
  valueScore: 75,
  metrics: { PER: 12, PBR: 1.5, ROE: 15 }
})

// Force specific analysis type
const deepAnalysis = await aiService.analyzeStock(request, AnalysisType.DEEP)

// Chat
const response = await aiService.chat({
  message: '투자 전략 알려줘',
  context: { conversationHistory }
})
```

## Cost Optimization Tips

### 1. Use Batch API (Future Enhancement)
- Gemini/Claude both offer 50% discount for batch processing
- Ideal for pre-generating analysis overnight

### 2. Implement Prompt Caching (Claude)
- Cache system prompts and financial data templates
- 90% cost reduction on cached content
- Already configured in ClaudeService

### 3. Rate Limiting
- `aiStockService.batchGenerateStockSummaries()` includes configurable delays
- Prevents API throttling
- Adjust `delayMs` parameter based on your tier

### 4. Smart Routing
- Let the hybrid service choose the right model
- Don't force Claude for everything
- Default routing saves ~70% on costs

### 5. Environment-Based Configuration
```typescript
// Production: Conservative routing
VITE_AI_DEFAULT_PROVIDER=gemini

// Development: Test with Gemini free tier
VITE_GEMINI_API_KEY=your_key
VITE_CLAUDE_API_KEY=  // Leave empty
```

## Estimated Monthly Costs

### Scenario: 100 stock analyses + 100 chat queries per day

| Approach | Monthly Cost | Notes |
|----------|-------------|-------|
| Gemini Only | $4 | Best for budget |
| Claude Only | $170 | Best for quality |
| Hybrid (Default) | $20-40 | Best balance |
| Hybrid + Batch | $10-20 | Best optimization |

### Breakdown (Hybrid Default)
- Quick analyses (Gemini): ~70 × $0.00068 = $1.40/day
- Deep analyses (Claude): ~30 × $0.033 = $1/day
- Chat (mixed): ~$0.50/day
- **Total: ~$90/month**

## Troubleshooting

### "AI service not available" Error

1. Check API keys are set in `.env`
2. Verify keys are valid (test in respective consoles)
3. Check browser console for specific errors
4. Ensure environment variables are loaded (restart dev server)

### API Rate Limiting

**Gemini:**
- Free tier: 60 requests/minute
- Solution: Use `batchGenerateStockSummaries` with 1000ms delay

**Claude:**
- Tier 1: 5 requests/minute, 40k tokens/minute
- Solution: Upgrade tier or implement request queue

### CORS Errors

The SDKs use `dangerouslyAllowBrowser: true` for Claude. This is acceptable for:
- Development
- Client-side analysis

For production, consider:
- Moving AI calls to backend API
- Using environment variables for key rotation

### Unexpected High Costs

1. Check `getServiceStatus()` to see which provider is being used
2. Review console logs for routing decisions
3. Consider forcing Gemini for non-critical requests:
   ```typescript
   await aiService.analyzeStock(request, AnalysisType.QUICK)
   ```

## Testing

Run AI service tests:
```bash
npm test src/tests/services/ai.test.ts
```

Tests verify:
- Service initialization
- API key validation
- Hybrid routing logic
- Fallback mechanisms
- Error handling

## Security Best Practices

1. **Never commit API keys**
   - Use `.env` files (gitignored)
   - Rotate keys regularly

2. **Environment separation**
   - Development: Use free tiers
   - Production: Use separate paid accounts

3. **Rate limiting**
   - Implement user-based rate limits
   - Monitor usage in provider dashboards

4. **Key rotation**
   - Claude: Rotate every 90 days
   - Gemini: Rotate every 90 days
   - Use environment variables for easy updates

## Future Enhancements

### Planned Features
1. **Backend Proxy** - Move API calls server-side for better security
2. **Response Caching** - Cache common analyses in database
3. **Batch Processing** - Overnight analysis generation with 50% discount
4. **Usage Analytics** - Track costs and routing decisions
5. **A/B Testing** - Compare Gemini vs Claude quality
6. **User Preferences** - Let users choose AI provider

### Alternative Providers
If you want to try other providers:
- **OpenAI GPT-4o**: $2.50/$10 per million tokens (middle ground)
- **OpenAI GPT-4o Mini**: $0.15/$0.60 (cheaper than Gemini)
- **Cohere**: Competitive pricing for financial analysis
- **Local LLMs**: Llama 3, Mistral (free but requires infrastructure)

## Support

For issues or questions:
1. Check browser console for error messages
2. Review this guide's troubleshooting section
3. Test API keys in respective provider consoles
4. Open an issue on GitHub with error logs

## Summary

ValueHunt's hybrid AI integration provides:
- **Cost-effective** analysis with Gemini for high-volume requests
- **High-quality** insights with Claude for important decisions
- **Automatic fallback** for reliability
- **Smart routing** for optimal cost/quality balance

Get started by adding your API keys to `.env` and enjoy AI-powered stock analysis!

# Frontend API Client Usage Guide

## Installation

The API client is already set up in the project. No additional installation is required.

## Configuration

Set the API base URL in `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

## Basic Usage

### Import API clients

```typescript
import { authApi, stocksApi, screenerApi, watchlistApi, chatApi } from '@/api'
```

## Authentication

### Register a new user

```typescript
import { authApi } from '@/api'

const handleRegister = async () => {
  try {
    const user = await authApi.register({
      email: 'user@example.com',
      password: 'SecurePass123!',
      name: '홍길동',
    })
    console.log('Registered user:', user)
  } catch (error) {
    console.error('Registration failed:', error)
  }
}
```

### Login

```typescript
const handleLogin = async () => {
  try {
    const tokens = await authApi.login({
      email: 'user@example.com',
      password: 'SecurePass123!',
    })
    console.log('Logged in successfully')
    // Tokens are automatically stored in localStorage
  } catch (error) {
    console.error('Login failed:', error)
  }
}
```

### Get current user

```typescript
const getCurrentUser = async () => {
  try {
    const user = await authApi.getCurrentUser()
    console.log('Current user:', user)
  } catch (error) {
    console.error('Failed to get user:', error)
  }
}
```

### Logout

```typescript
const handleLogout = async () => {
  try {
    await authApi.logout()
    console.log('Logged out successfully')
    // Tokens are automatically removed from localStorage
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
```

### Check authentication status

```typescript
const isLoggedIn = authApi.isAuthenticated()
if (isLoggedIn) {
  console.log('User is authenticated')
} else {
  console.log('User is not authenticated')
}
```

## Stocks

### Get top picks

```typescript
import { stocksApi } from '@/api'

const getTopPicks = async () => {
  try {
    const topPicks = await stocksApi.getTopPicks({
      market: 'KOSPI',
      limit: 20,
      category: 'valuation',
    })
    console.log('Top picks:', topPicks.data)
  } catch (error) {
    console.error('Failed to get top picks:', error)
  }
}
```

### Get stock detail

```typescript
const getStockDetail = async (stockCode: string) => {
  try {
    const stockDetail = await stocksApi.getStockDetail(stockCode)
    console.log('Stock detail:', stockDetail)
    console.log('Value score:', stockDetail.value_score)
    console.log('AI analysis:', stockDetail.ai_analysis)
  } catch (error) {
    console.error('Failed to get stock detail:', error)
  }
}

// Usage
getStockDetail('005930') // Samsung Electronics
```

## Screener

### Screen stocks with filters

```typescript
import { screenerApi } from '@/api'

const screenStocks = async () => {
  try {
    const results = await screenerApi.screenStocks({
      filters: {
        market: ['KOSPI', 'KOSDAQ'],
        PER_max: 10,
        ROE_min: 12,
        debt_ratio_max: 50,
        dividend_yield_min: 2,
      },
      sort_by: 'value_score',
      order: 'desc',
      limit: 50,
    })
    console.log('Screener results:', results.results)
    console.log('Total count:', results.total_count)
  } catch (error) {
    console.error('Screening failed:', error)
  }
}
```

## Watchlist

### Get watchlist

```typescript
import { watchlistApi } from '@/api'

const getWatchlist = async () => {
  try {
    const watchlist = await watchlistApi.getWatchlist()
    console.log('Watchlist:', watchlist.watchlist)
  } catch (error) {
    console.error('Failed to get watchlist:', error)
  }
}
```

### Add to watchlist

```typescript
const addToWatchlist = async (stockCode: string) => {
  try {
    await watchlistApi.addToWatchlist({
      stock_code: stockCode,
      target_price: 75000,
      alert_enabled: true,
    })
    console.log('Added to watchlist')
  } catch (error) {
    console.error('Failed to add to watchlist:', error)
  }
}
```

### Update watchlist item

```typescript
const updateWatchlistItem = async (id: number) => {
  try {
    await watchlistApi.updateWatchlistItem(id, {
      target_price: 80000,
      alert_enabled: false,
    })
    console.log('Updated watchlist item')
  } catch (error) {
    console.error('Failed to update watchlist item:', error)
  }
}
```

### Remove from watchlist

```typescript
const removeFromWatchlist = async (id: number) => {
  try {
    await watchlistApi.removeFromWatchlist(id)
    console.log('Removed from watchlist')
  } catch (error) {
    console.error('Failed to remove from watchlist:', error)
  }
}
```

## Chat

### Send message to AI chatbot

```typescript
import { chatApi } from '@/api'

const sendChatMessage = async (message: string, conversationId?: string) => {
  try {
    const response = await chatApi.sendMessage({
      message,
      conversation_id: conversationId,
    })
    console.log('AI reply:', response.reply)
    console.log('Conversation ID:', response.conversation_id)
    console.log('Related links:', response.related_links)
    return response
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}

// Usage
await sendChatMessage('ROE가 뭔가요?')
```

## Error Handling

All API calls can throw errors. Here's how to handle them:

```typescript
import { AxiosError } from 'axios'

try {
  const data = await stocksApi.getTopPicks()
} catch (error) {
  if (error instanceof AxiosError) {
    // HTTP error
    console.error('Status:', error.response?.status)
    console.error('Error data:', error.response?.data)

    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      // Forbidden - premium required
      alert('Premium subscription required')
    } else if (error.response?.status === 404) {
      // Not found
      alert('Resource not found')
    }
  } else {
    // Network error or other
    console.error('Unexpected error:', error)
  }
}
```

## React Component Example

```typescript
import { useState, useEffect } from 'react'
import { stocksApi, type TopPicksResponse } from '@/api'

function TopPicksPage() {
  const [topPicks, setTopPicks] = useState<TopPicksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopPicks = async () => {
      try {
        setLoading(true)
        const data = await stocksApi.getTopPicks({
          market: 'KOSPI',
          limit: 20,
        })
        setTopPicks(data)
      } catch (err) {
        setError('Failed to load top picks')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTopPicks()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!topPicks) return null

  return (
    <div>
      <h1>Top {topPicks.total_count} Picks</h1>
      <ul>
        {topPicks.data.map((stock) => (
          <li key={stock.stock_code}>
            {stock.rank}. {stock.stock_name} - Score: {stock.value_score}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Custom Hooks Example

Create a custom hook for easier API usage:

```typescript
// hooks/useTopPicks.ts
import { useState, useEffect } from 'react'
import { stocksApi, type TopPicksResponse, type TopPicksParams } from '@/api'

export function useTopPicks(params?: TopPicksParams) {
  const [data, setData] = useState<TopPicksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await stocksApi.getTopPicks(params)
        setData(result)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [JSON.stringify(params)])

  return { data, loading, error }
}

// Usage in component
function TopPicksPage() {
  const { data, loading, error } = useTopPicks({ market: 'KOSPI', limit: 20 })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{/* Render top picks */}</div>
}
```

## Automatic Token Refresh

The API client automatically handles token refresh:

1. If an API call returns 401 Unauthorized
2. The client automatically tries to refresh the access token
3. If refresh succeeds, the original request is retried
4. If refresh fails, the user is redirected to login page

No manual handling required!

## Type Safety

All API responses are fully typed with TypeScript:

```typescript
import type { TopPickItem, StockDetail, WatchlistItem } from '@/api'

// TypeScript knows the exact shape of the data
const topPick: TopPickItem = {
  rank: 1,
  stock_code: '005930',
  stock_name: '삼성전자',
  // ... all other required fields
}
```

## Best Practices

1. **Always use try-catch** when calling API functions
2. **Handle loading states** in your components
3. **Show user-friendly error messages** instead of raw errors
4. **Use custom hooks** to encapsulate API logic
5. **Leverage TypeScript** for type safety
6. **Don't store sensitive data** in component state
7. **Clear tokens on logout** (handled automatically by authApi.logout())

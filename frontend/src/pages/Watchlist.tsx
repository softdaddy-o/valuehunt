import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { watchlistApi } from '@/api'
import { WatchlistItem as WatchlistItemType } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatPrice } from '@/utils/styles'

export function Watchlist() {
  const navigate = useNavigate()
  const [watchlist, setWatchlist] = useState<WatchlistItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWatchlist()
  }, [])

  const loadWatchlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await watchlistApi.getWatchlist()
      setWatchlist(data.items)
    } catch (err) {
      setError('Failed to load watchlist. Please login first.')
      console.error('Error loading watchlist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (stockCode: string) => {
    try {
      await watchlistApi.removeFromWatchlist(stockCode)
      // Update local state
      setWatchlist(watchlist.filter(item => item.stock_code !== stockCode))
    } catch (err) {
      console.error('Error removing from watchlist:', err)
      alert('Failed to remove from watchlist')
    }
  }

  const handleStockClick = (stockCode: string) => {
    navigate(`/stocks/${stockCode}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading watchlist...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Watchlist</h1>
        <p className="text-gray-600">
          Track your favorite stocks and monitor their performance
        </p>
      </div>

      {watchlist.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <p className="text-lg font-medium">Your watchlist is empty</p>
            <p className="text-sm mt-2">
              Add stocks to your watchlist to keep track of them
            </p>
          </div>
          <Button onClick={() => navigate('/')}>Browse Top Picks</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {watchlist.map((item) => (
            <Card
              key={item.stock_code}
              hover
              className="flex items-center justify-between p-6"
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => handleStockClick(item.stock_code)}
              >
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.stock_name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {item.stock_code}
                  </span>
                  <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                    {item.market}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(item.current_price)}원
                    </div>
                    <div
                      className={`text-sm ${
                        Number(item.change_rate) >= 0
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {Number(item.change_rate) >= 0 ? '▲' : '▼'}{' '}
                      {Math.abs(Number(item.change_rate)).toFixed(2)}%
                    </div>
                  </div>

                  {item.value_score !== null && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">
                        Value Score
                      </div>
                      <div
                        className={`text-xl font-bold ${
                          Number(item.value_score) >= 70
                            ? 'text-green-600'
                            : Number(item.value_score) >= 50
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {Number(item.value_score).toFixed(1)}
                      </div>
                    </div>
                  )}
                </div>

                {item.note && (
                  <div className="mt-3 text-sm text-gray-600 italic">
                    Note: {item.note}
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-400">
                  Added on {new Date(item.added_at).toLocaleDateString()}
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(item.stock_code)
                }}
              >
                Remove
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

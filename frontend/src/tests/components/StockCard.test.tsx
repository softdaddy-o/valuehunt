import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { StockCard } from '@/components/StockCard'
import { TopPickItem } from '@/types/api'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockStock: TopPickItem = {
  rank: 1,
  stock_code: '005930',
  stock_name: '삼성전자',
  market: 'KOSPI',
  current_price: 75000,
  change_rate: 2.5,
  value_score: 85.5,
  category_scores: {
    valuation: 35.0,
    profitability: 28.0,
    stability: 18.0,
    dividend: 4.5,
  },
  key_metrics: {
    PER: 8.5,
    PBR: 0.9,
    ROE: 18.5,
  },
  ai_summary: 'Strong fundamentals with excellent profitability',
}

describe('StockCard Component', () => {
  const renderStockCard = (stock = mockStock) => {
    return render(
      <BrowserRouter>
        <StockCard stock={stock} />
      </BrowserRouter>
    )
  }

  it('renders stock basic information', () => {
    renderStockCard()

    expect(screen.getByText('삼성전자')).toBeInTheDocument()
    expect(screen.getByText('005930')).toBeInTheDocument()
    expect(screen.getByText('KOSPI')).toBeInTheDocument()
  })

  it('displays rank badge', () => {
    renderStockCard()
    expect(screen.getByText('#1')).toBeInTheDocument()
  })

  it('shows current price formatted', () => {
    renderStockCard()
    expect(screen.getByText(/75,000/)).toBeInTheDocument()
  })

  it('displays positive change rate in red', () => {
    renderStockCard()
    const changeElement = screen.getByText(/2.50%/)
    expect(changeElement).toHaveClass('text-red-600')
  })

  it('displays negative change rate in blue', () => {
    const negativeStock = { ...mockStock, change_rate: -1.5 }
    renderStockCard(negativeStock)

    const changeElement = screen.getByText(/-1.50%/)
    expect(changeElement).toHaveClass('text-blue-600')
  })

  it('shows Value Score with correct color', () => {
    renderStockCard()
    const scoreElement = screen.getByText('85.5')
    expect(scoreElement).toBeInTheDocument()
    // Score >= 70 should have green background
    expect(scoreElement.parentElement).toHaveClass('bg-green-600')
  })

  it('displays category scores as badges', () => {
    renderStockCard()

    expect(screen.getByText('35.0')).toBeInTheDocument() // Valuation
    expect(screen.getByText('28.0')).toBeInTheDocument() // Profitability
    expect(screen.getByText('18.0')).toBeInTheDocument() // Stability
    expect(screen.getByText('4.5')).toBeInTheDocument() // Dividend
  })

  it('shows key financial metrics', () => {
    renderStockCard()

    expect(screen.getByText(/8.50/)).toBeInTheDocument() // PER
    expect(screen.getByText(/0.90/)).toBeInTheDocument() // PBR
    expect(screen.getByText(/18.50%/)).toBeInTheDocument() // ROE
  })

  it('displays AI summary when available', () => {
    renderStockCard()
    expect(screen.getByText('Strong fundamentals with excellent profitability')).toBeInTheDocument()
  })

  it('handles missing AI summary gracefully', () => {
    const stockWithoutSummary = { ...mockStock, ai_summary: null }
    renderStockCard(stockWithoutSummary)

    // Should still render without errors
    expect(screen.getByText('삼성전자')).toBeInTheDocument()
  })

  it('navigates to stock detail on click', () => {
    renderStockCard()

    const card = screen.getByText('삼성전자').closest('.cursor-pointer')
    fireEvent.click(card!)

    expect(mockNavigate).toHaveBeenCalledWith('/stocks/005930')
  })

  it('applies hover effect class', () => {
    renderStockCard()

    const card = screen.getByText('삼성전자').closest('div')
    expect(card).toHaveClass('hover:shadow-lg')
  })

  it('handles different Value Score ranges correctly', () => {
    // Test different score colors
    const scores = [
      { score: 75, expectedClass: 'bg-green-600' },
      { score: 60, expectedClass: 'bg-yellow-600' },
      { score: 40, expectedClass: 'bg-gray-600' },
    ]

    scores.forEach(({ score, expectedClass }) => {
      const stock = { ...mockStock, value_score: score }
      const { container } = renderStockCard(stock)

      const scoreElement = container.querySelector(`[class*="${expectedClass}"]`)
      expect(scoreElement).toBeInTheDocument()
    })
  })

  it('handles null key metrics gracefully', () => {
    const stockWithNullMetrics = {
      ...mockStock,
      key_metrics: {
        PER: null,
        PBR: null,
        ROE: null,
      },
    }

    renderStockCard(stockWithNullMetrics)

    // Should show N/A or handle null values
    expect(screen.getByText('삼성전자')).toBeInTheDocument()
  })
})

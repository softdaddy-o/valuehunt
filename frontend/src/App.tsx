import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navigation } from '@/components/Navigation'
import { Home } from '@/pages/Home'
import { StockDetail } from '@/pages/StockDetail'
import { Screener } from '@/pages/Screener'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Watchlist } from '@/pages/Watchlist'
import { Chat } from '@/pages/Chat'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stocks/:stockCode" element={<StockDetail />} />
          <Route path="/screener" element={<Screener />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navigation } from '@/components/Navigation'
import { Home } from '@/pages/Home'
import { StockDetail } from '@/pages/StockDetail'
import { Screener } from '@/pages/Screener'
import { Login } from '@/pages/Login'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stocks/:stockCode" element={<StockDetail />} />
          <Route path="/screener" element={<Screener />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

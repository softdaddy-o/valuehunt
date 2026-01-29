import { Card } from '@/components/ui/Card'
import { TermTooltip } from '@/components/ui/TermTooltip'
import type { InsiderTradingList } from '@/types/api'

interface InsiderTradingCardProps {
  data: InsiderTradingList
}

export function InsiderTradingCard({ data }: InsiderTradingCardProps) {
  const { summary, data: transactions } = data

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case '매수우세':
        return 'text-red-500 bg-red-50'
      case '매도우세':
        return 'text-blue-500 bg-blue-50'
      default:
        return 'text-gray-500 bg-gray-50'
    }
  }

  const getTransactionColor = (type: string | null) => {
    switch (type) {
      case '매수':
        return 'text-red-600'
      case '매도':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatNumber = (num: number | null) => {
    if (num === null) return '-'
    return num.toLocaleString()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        <TermTooltip term="내부자거래">
          <span className="border-b border-dotted border-gray-400 cursor-help">
            내부자 거래
          </span>
        </TermTooltip>
      </h2>

      {/* Summary Section */}
      <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {summary.total_transactions}
          </div>
          <div className="text-xs text-gray-500">총 거래</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500">
            {summary.net_buy_count}
          </div>
          <div className="text-xs text-gray-500">매수</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">
            {summary.net_sell_count}
          </div>
          <div className="text-xs text-gray-500">매도</div>
        </div>
        <div className="text-center">
          <div
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTrendColor(summary.recent_trend)}`}
          >
            {summary.recent_trend}
          </div>
          <div className="text-xs text-gray-500 mt-1">최근 동향</div>
        </div>
      </div>

      {/* Largest Holder */}
      {summary.largest_holder && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <span className="font-medium">최대주주:</span> {summary.largest_holder}
            {summary.largest_holding_rate && (
              <span className="ml-2">
                ({summary.largest_holding_rate.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {transactions.slice(0, 10).map((tx) => (
          <div
            key={tx.rcept_no}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {tx.repror || '미공개'}
                </span>
                {tx.isu_exctv_ofcps && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    {tx.isu_exctv_ofcps}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDate(tx.rcept_dt)}
                {(tx.isu_exctv_rgist_at || tx.isu_main_shrholdr) && (
                  <span className="ml-2">
                    {tx.isu_exctv_rgist_at || tx.isu_main_shrholdr}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div
                className={`font-bold ${getTransactionColor(tx.transaction_type)}`}
              >
                {tx.sp_stock_lmp_irds_cnt !== null &&
                tx.sp_stock_lmp_irds_cnt !== 0 ? (
                  <>
                    {tx.sp_stock_lmp_irds_cnt > 0 ? '+' : ''}
                    {formatNumber(tx.sp_stock_lmp_irds_cnt)}주
                  </>
                ) : (
                  '변동없음'
                )}
              </div>
              {tx.sp_stock_lmp_rate !== null && (
                <div className="text-xs text-gray-500">
                  보유: {tx.sp_stock_lmp_rate.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {transactions.length > 10 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          외 {transactions.length - 10}건 더 있음
        </div>
      )}

      {transactions.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          내부자 거래 데이터가 없습니다.
        </div>
      )}
    </Card>
  )
}

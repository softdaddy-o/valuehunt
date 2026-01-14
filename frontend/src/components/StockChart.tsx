import { useMemo } from 'react'

interface DataPoint {
  date: string
  value: number
}

interface StockChartProps {
  data: DataPoint[]
  title?: string
  height?: number
  color?: string
}

export function StockChart({
  data,
  title,
  height = 200,
  color = '#3b82f6'
}: StockChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return null

    const values = data.map(d => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const valueRange = maxValue - minValue

    // Calculate SVG path points
    const width = 100 // percentage
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((point.value - minValue) / valueRange) * (height - 20)
      return { x, y, ...point }
    })

    return { points, minValue, maxValue, valueRange }
  }, [data, height])

  if (!chartData || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height: `${height}px` }}
      >
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const { points, minValue, maxValue } = chartData
  const pathD = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ')

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      )}

      <div className="relative bg-white rounded-lg border border-gray-200 p-4">
        {/* Y-axis labels */}
        <div className="absolute left-2 top-4 text-xs text-gray-500">
          {maxValue.toLocaleString()}
        </div>
        <div className="absolute left-2 bottom-4 text-xs text-gray-500">
          {minValue.toLocaleString()}
        </div>

        {/* Chart SVG */}
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={`${pathD} L 100 ${height} L 0 ${height} Z`}
            fill={`url(#${gradientId})`}
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* Dots on hover */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="1"
                fill={color}
                vectorEffect="non-scaling-stroke"
                className="hover:r-2 transition-all"
              >
                <title>{`${point.date}: ${point.value.toLocaleString()}`}</title>
              </circle>
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{data[0]?.date}</span>
          {data.length > 2 && (
            <span>{data[Math.floor(data.length / 2)]?.date}</span>
          )}
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs text-gray-600 px-4">
        <div>
          <span className="font-medium">변화: </span>
          <span className={
            data[data.length - 1].value > data[0].value
              ? 'text-red-600'
              : 'text-blue-600'
          }>
            {(((data[data.length - 1].value - data[0].value) / data[0].value) * 100).toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="font-medium">최고: </span>
          {maxValue.toLocaleString()}
        </div>
        <div>
          <span className="font-medium">최저: </span>
          {minValue.toLocaleString()}
        </div>
      </div>
    </div>
  )
}

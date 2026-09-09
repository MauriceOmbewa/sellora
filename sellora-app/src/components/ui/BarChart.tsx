import React from 'react'

interface BarChartProps {
  data: { label: string; value: number; highlight?: boolean }[]
  height?: number
  color?: string
  highlightColor?: string
  formatValue?: (v: number) => string
  className?: string
  showLabels?: boolean
  showValues?: boolean
}

export function BarChart({
  data,
  height = 180,
  color = '#171B21',
  highlightColor = '#C79A3D',
  formatValue,
  className = '',
  showLabels = true,
  showValues = false,
}: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div className={['w-full', className].join(' ')}>
      <div
        className="flex items-end gap-[5px] w-full"
        style={{ height }}
        role="img"
        aria-label="Bar chart"
      >
        {data.map((d, i) => {
          const pct = (d.value / max) * 100
          const isHighlight = d.highlight ?? false

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-ink text-ivory text-[11px] font-medium px-2 py-1 rounded-[6px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                {formatValue ? formatValue(d.value) : d.value.toLocaleString()}
              </div>
              {showValues && (
                <span className="text-[10px] text-slate font-medium">
                  {formatValue ? formatValue(d.value) : d.value.toLocaleString()}
                </span>
              )}
              <div
                className="w-full rounded-t-[4px] transition-all duration-300 cursor-default min-h-[4px]"
                style={{
                  height: `${pct}%`,
                  background: isHighlight ? highlightColor : color,
                  opacity: isHighlight ? 1 : 0.75,
                }}
              />
            </div>
          )
        })}
      </div>
      {showLabels && (
        <div className="flex gap-[5px] mt-2">
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[11px] text-slate font-medium">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Simple mini sparkline using SVG
interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
  className?: string
}

export function Sparkline({
  data,
  width = 80,
  height = 32,
  color = '#C79A3D',
  fill = true,
  className = '',
}: SparklineProps) {
  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })

  const polyline = pts.join(' ')
  const area = `0,${height} ${polyline} ${width},${height}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      {fill && (
        <polygon
          points={area}
          fill={color}
          fillOpacity={0.12}
        />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

import React, { useRef, useState } from 'react'

export interface LineSeries {
  label: string
  color: string
  data: number[]           // same length as `labels`
  dashed?: boolean
}

interface LineChartProps {
  labels: string[]         // x-axis labels
  series: LineSeries[]
  height?: number
  formatValue?: (v: number) => string
  showDots?: boolean
  className?: string
  yMin?: number            // force y-axis minimum (e.g. 0)
}

/**
 * Multi-series SVG line chart.
 * Handles negative values (profit/loss) and renders a zero-line when needed.
 */
export function LineChart({
  labels,
  series,
  height = 220,
  formatValue,
  showDots = true,
  className = '',
  yMin,
}: LineChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 600   // internal viewBox width
  const H = height
  const padL = 8
  const padR = 8
  const padT = 12
  const padB = 28  // room for x-labels

  const allValues = series.flatMap(s => s.data)
  const dataMax = Math.max(...allValues, 1)
  const dataMin = Math.min(...allValues, 0)
  const effectiveMin = yMin !== undefined ? Math.min(yMin, dataMin) : dataMin
  const range = dataMax - effectiveMin || 1

  const n = labels.length
  const xStep = n > 1 ? (W - padL - padR) / (n - 1) : W - padL - padR

  const toX = (i: number) => padL + i * xStep
  const toY = (v: number) => padT + ((dataMax - v) / range) * (H - padT - padB)

  const zeroY = toY(0)

  const buildPolyline = (data: number[]) =>
    data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')

  const buildAreaPath = (data: number[]) => {
    if (data.length === 0) return ''
    const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
    const firstX = toX(0)
    const lastX  = toX(data.length - 1)
    return `M ${firstX},${zeroY} L ${points
      .split(' ')
      .map((p, i) => (i === 0 ? p : p))
      .join(' L ')} L ${lastX},${zeroY} Z`
  }

  return (
    <div className={['relative', className].join(' ')}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Line chart"
        onMouseLeave={() => setTooltip(null)}
        onMouseMove={e => {
          const svg = svgRef.current
          if (!svg) return
          const rect = svg.getBoundingClientRect()
          const svgX = ((e.clientX - rect.left) / rect.width) * W
          if (n < 2) return
          const idx = Math.round((svgX - padL) / xStep)
          const clamped = Math.max(0, Math.min(n - 1, idx))
          setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, idx: clamped })
        }}
      >
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = padT + frac * (H - padT - padB)
          return (
            <line
              key={frac}
              x1={padL} y1={y} x2={W - padR} y2={y}
              stroke="#E8E3DA" strokeWidth={1}
            />
          )
        })}

        {/* Zero line (highlighted when there are negative values) */}
        {effectiveMin < 0 && (
          <line
            x1={padL} y1={zeroY} x2={W - padR} y2={zeroY}
            stroke="#94A3B8" strokeWidth={1} strokeDasharray="4 3"
          />
        )}

        {/* Area fills (subtle) */}
        {series.map((s, si) => (
          <path
            key={`area-${si}`}
            d={buildAreaPath(s.data)}
            fill={s.color}
            fillOpacity={0.06}
          />
        ))}

        {/* Lines */}
        {series.map((s, si) => (
          <polyline
            key={`line-${si}`}
            points={buildPolyline(s.data)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={s.dashed ? '6 4' : undefined}
          />
        ))}

        {/* Dots */}
        {showDots && series.map((s, si) =>
          s.data.map((v, i) => (
            <circle
              key={`dot-${si}-${i}`}
              cx={toX(i)}
              cy={toY(v)}
              r={3}
              fill="white"
              stroke={s.color}
              strokeWidth={2}
            />
          ))
        )}

        {/* Hover crosshair */}
        {tooltip && (
          <line
            x1={toX(tooltip.idx)} y1={padT}
            x2={toX(tooltip.idx)} y2={H - padB}
            stroke="#171B21" strokeWidth={1} strokeDasharray="3 2" strokeOpacity={0.3}
          />
        )}

        {/* X-axis labels */}
        {labels.map((l, i) => {
          // Show every Nth label to avoid overlap
          const showEvery = Math.ceil(n / 12)
          if (i % showEvery !== 0 && i !== n - 1) return null
          return (
            <text
              key={i}
              x={toX(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#94A3B8"
              fontFamily="system-ui, sans-serif"
            >
              {l}
            </text>
          )
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-ink text-ivory text-[12px] rounded-[8px] px-3 py-2 shadow-lg z-20 whitespace-nowrap"
          style={{
            left: Math.min(tooltip.x + 12, 200),
            top: Math.max(tooltip.y - 60, 4),
          }}
        >
          <p className="font-semibold mb-1 text-ivory/70">{labels[tooltip.idx]}</p>
          {series.map((s, si) => (
            <div key={si} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              <span className="text-ivory/80">{s.label}:</span>
              <span className="font-semibold">
                {formatValue ? formatValue(s.data[tooltip.idx] ?? 0) : (s.data[tooltip.idx] ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {series.length > 1 && (
        <div className="flex flex-wrap gap-4 mt-3 justify-center">
          {series.map((s, si) => (
            <div key={si} className="flex items-center gap-1.5 text-[12px] text-slate">
              <div className="w-6 h-0.5" style={{ background: s.color, borderTop: s.dashed ? '2px dashed' : undefined }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

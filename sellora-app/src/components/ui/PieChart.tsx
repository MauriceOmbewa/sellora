import React from 'react'

export interface PieSlice {
  label: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieSlice[]
  size?: number
  thickness?: number   // donut thickness as fraction of radius, 0–1
  showLegend?: boolean
  formatValue?: (v: number) => string
  className?: string
}

/**
 * Pure-SVG donut / pie chart.
 * No third-party library — uses arc math to build SVG path segments.
 */
export function PieChart({
  data,
  size = 180,
  thickness = 0.55,
  showLegend = true,
  formatValue,
  className = '',
}: PieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className={['flex flex-col items-center', className].join(' ')}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill="none" stroke="#E8E3DA" strokeWidth={size * thickness * 0.5} />
        </svg>
        {showLegend && (
          <p className="text-[13px] text-slate mt-3">No data</p>
        )}
      </div>
    )
  }

  const cx = size / 2
  const cy = size / 2
  const r  = size / 2 - 4
  const innerR = r * (1 - thickness)

  // Build SVG arc paths
  const paths: { d: string; color: string; label: string; value: number }[] = []
  let cumAngle = -Math.PI / 2   // start at top

  data.forEach(slice => {
    const angle = (slice.value / total) * 2 * Math.PI
    const startAngle = cumAngle
    const endAngle   = cumAngle + angle
    cumAngle = endAngle

    const largeArcFlag = angle > Math.PI ? 1 : 0

    // outer arc
    const ox1 = cx + r * Math.cos(startAngle)
    const oy1 = cy + r * Math.sin(startAngle)
    const ox2 = cx + r * Math.cos(endAngle)
    const oy2 = cy + r * Math.sin(endAngle)
    // inner arc (reverse)
    const ix1 = cx + innerR * Math.cos(endAngle)
    const iy1 = cy + innerR * Math.sin(endAngle)
    const ix2 = cx + innerR * Math.cos(startAngle)
    const iy2 = cy + innerR * Math.sin(startAngle)

    const d = [
      `M ${ox1} ${oy1}`,
      `A ${r} ${r} 0 ${largeArcFlag} 1 ${ox2} ${oy2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ')

    paths.push({ d, color: slice.color, label: slice.label, value: slice.value })
  })

  return (
    <div className={['flex flex-col items-center', className].join(' ')}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Pie chart"
      >
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth={1.5}>
            <title>{p.label}: {formatValue ? formatValue(p.value) : p.value.toLocaleString()}</title>
          </path>
        ))}
      </svg>

      {showLegend && (
        <div className="w-full mt-4 space-y-2">
          {data.map((slice, i) => {
            const pct = total > 0 ? ((slice.value / total) * 100).toFixed(1) : '0.0'
            return (
              <div key={i} className="flex items-center justify-between text-[12.5px]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: slice.color }} />
                  <span className="text-slate">{slice.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">
                    {formatValue ? formatValue(slice.value) : slice.value.toLocaleString()}
                  </span>
                  <span className="text-slate/60 w-10 text-right">{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

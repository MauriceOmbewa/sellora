import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Sparkline } from './BarChart'

interface KpiCardProps {
  label: string
  value: string
  change?: number
  changePeriod?: string
  icon?: React.ReactNode
  sparklineData?: number[]
  className?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function KpiCard({
  label,
  value,
  change,
  changePeriod = 'vs last period',
  icon,
  sparklineData,
  className = '',
  trend,
}: KpiCardProps) {
  const isPositive = (change ?? 0) >= 0
  const effectiveTrend = trend ?? (isPositive ? 'up' : 'down')

  return (
    <div className={['bg-white border border-sand rounded-[14px] p-5', className].join(' ')}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-medium text-slate uppercase tracking-wide mb-2">{label}</p>
          <p className="font-serif text-[26px] font-semibold text-ink leading-none">{value}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
          {icon && (
            <div className="w-9 h-9 rounded-[9px] bg-ivory border border-sand flex items-center justify-center text-slate">
              {icon}
            </div>
          )}
          {sparklineData && (
            <Sparkline
              data={sparklineData}
              color={effectiveTrend === 'up' ? '#3F6B4F' : '#B84A3E'}
            />
          )}
        </div>
      </div>
      {change != null && (
        <div className="flex items-center gap-1.5">
          <span
            className={[
              'flex items-center gap-1 text-[12px] font-semibold',
              effectiveTrend === 'up' ? 'text-green' : effectiveTrend === 'down' ? 'text-red' : 'text-slate',
            ].join(' ')}
          >
            {effectiveTrend === 'up' ? (
              <TrendingUp size={12} />
            ) : effectiveTrend === 'down' ? (
              <TrendingDown size={12} />
            ) : null}
            {Math.abs(change)}%
          </span>
          <span className="text-[12px] text-slate">{changePeriod}</span>
        </div>
      )}
    </div>
  )
}

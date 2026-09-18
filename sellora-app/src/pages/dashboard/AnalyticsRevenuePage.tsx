import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, ShoppingBag, DollarSign, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader, KpiCard, BarChart, LineChart, Skeleton } from '@/components/ui'
import { analyticsService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { MonthlyDataPoint } from '@/types'

const CURRENT_YEAR = new Date().getFullYear()
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
// 5 years back including current
const YEAR_RANGE = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 4 + i)
// Colours assigned per year (oldest → most recent)
const YEAR_COLORS = ['#94A3B8','#64748B','#3F6B4F','#171B21','#C79A3D']

const fmtK  = (n: number) => n >= 1000 ? `KSh ${(n / 1000).toFixed(1)}K` : `KSh ${n}`
const fmtKs = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`

// ── Small reusable year pill ──────────────────────────────────────────────────
function YearPill({
  year, active, color, onClick,
}: { year: number; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold transition-all border',
        active
          ? 'text-ivory border-transparent shadow-sm'
          : 'text-slate bg-white border-sand hover:border-ink/20',
      ].join(' ')}
      style={active ? { background: color, borderColor: color } : undefined}
    >
      {year}
    </button>
  )
}

export default function AnalyticsRevenuePage() {
  const { currentBusiness } = useAuth()

  // ── Per-year monthly data cache ───────────────────────────────────────────
  const [dataByYear, setDataByYear] = useState<Record<number, MonthlyDataPoint[]>>({})
  const [loadingYears, setLoadingYears] = useState<Set<number>>(new Set())

  // Which years are toggled on in the multi-year comparison chart
  const [activeYears, setActiveYears] = useState<number[]>([CURRENT_YEAR])

  // Selected year for the single-year detail section
  const [detailYear, setDetailYear] = useState(CURRENT_YEAR)

  // Highlighted month index (0-based) for the detail drill-down
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  // ── Fetch for each year as needed ─────────────────────────────────────────
  const fetchYear = (year: number) => {
    if (!currentBusiness || dataByYear[year] || loadingYears.has(year)) return
    setLoadingYears(prev => new Set(prev).add(year))
    analyticsService.getMonthly(currentBusiness.id, year)
      .then(data => setDataByYear(prev => ({ ...prev, [year]: data })))
      .catch(() => {})
      .finally(() => setLoadingYears(prev => { const s = new Set(prev); s.delete(year); return s }))
  }

  useEffect(() => {
    if (!currentBusiness) return
    // Pre-fetch current year + any active years
    const toFetch = new Set([CURRENT_YEAR, detailYear, ...activeYears])
    toFetch.forEach(fetchYear)
  }, [currentBusiness?.id]) // eslint-disable-line

  // Also fetch whenever activeYears / detailYear changes
  useEffect(() => {
    if (!currentBusiness) return
    const toFetch = new Set([detailYear, ...activeYears])
    toFetch.forEach(fetchYear)
  }, [activeYears, detailYear]) // eslint-disable-line

  const toggleYear = (year: number) => {
    setActiveYears(prev =>
      prev.includes(year)
        ? prev.length > 1 ? prev.filter(y => y !== year) : prev   // keep at least 1
        : [...prev, year].sort()
    )
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const detailData: MonthlyDataPoint[] = dataByYear[detailYear] ?? []
  const isDetailLoading = loadingYears.has(detailYear)

  // KPIs from detail year
  const totalRevenue = detailData.reduce((s, m) => s + m.revenue, 0)
  const totalOrders  = detailData.reduce((s, m) => s + m.orders,  0)
  const bestMonth    = detailData.reduce((best, m) => m.revenue > best.revenue ? m : best, detailData[0] ?? { monthName: '—', revenue: 0 })
  const avgMonthly   = detailData.length ? totalRevenue / detailData.length : 0

  // Single-year bar chart data (Jan–Dec)
  const singleYearBars = detailData.map((m, i) => ({
    label:     m.monthName,
    value:     m.revenue,
    highlight: i === selectedMonth,
  }))

  // Multi-year comparison: one LineSeries per active year
  const multiYearSeries = activeYears.map((year, i) => {
    const yearData = dataByYear[year] ?? Array.from({ length: 12 }, (_, mi) => ({ monthName: MONTHS[mi], revenue: 0 }))
    const colorIdx = YEAR_RANGE.indexOf(year)
    return {
      label:  String(year),
      color:  YEAR_COLORS[colorIdx] ?? '#171B21',
      data:   yearData.map(m => m.revenue),
    }
  })
  const multiYearLoading = activeYears.some(y => loadingYears.has(y))

  // Monthly revenue growth rate vs prev month (for sparkline hint)
  const growthRates = detailData.map((m, i) => {
    if (i === 0) return 0
    const prev = detailData[i - 1].revenue
    return prev > 0 ? ((m.revenue - prev) / prev) * 100 : 0
  })

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Revenue"
        subtitle="Monthly sales performance and year-over-year trends"
        breadcrumb={[{ label: 'Analytics', href: '/app/analytics' }, { label: 'Revenue' }]}
        actions={
          <div className="flex items-center gap-1.5 bg-white border border-sand rounded-[10px] p-1">
            <button
              onClick={() => setDetailYear(y => Math.max(y - 1, YEAR_RANGE[0]))}
              className="p-1.5 rounded-[7px] hover:bg-sand transition-colors text-slate"
              disabled={detailYear <= YEAR_RANGE[0]}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[13.5px] font-semibold text-ink px-2">{detailYear}</span>
            <button
              onClick={() => setDetailYear(y => Math.min(y + 1, CURRENT_YEAR))}
              className="p-1.5 rounded-[7px] hover:bg-sand transition-colors text-slate"
              disabled={detailYear >= CURRENT_YEAR}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        }
      />

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      {isDetailLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} height={96} className="rounded-[14px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label={`${detailYear} Revenue`}
            value={fmtK(totalRevenue)}
            icon={<DollarSign size={15} className="text-gold-deep" />}
            sparklineData={detailData.map(m => m.revenue)}
          />
          <KpiCard
            label="Total orders"
            value={totalOrders.toLocaleString()}
            icon={<ShoppingBag size={15} className="text-ink" />}
            sparklineData={detailData.map(m => m.orders)}
          />
          <KpiCard
            label="Best month"
            value={bestMonth.monthName}
            subValue={fmtK(bestMonth.revenue)}
            icon={<TrendingUp size={15} className="text-green" />}
          />
          <KpiCard
            label="Avg. monthly"
            value={fmtK(avgMonthly)}
            icon={<Users size={15} className="text-blue" />}
            sparklineData={detailData.map(m => m.revenue)}
          />
        </div>
      )}

      {/* ── Single-year monthly bars + month detail ───────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-sand rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-serif text-[17px] font-medium text-ink">Monthly revenue — {detailYear}</h3>
              <p className="text-[12.5px] text-slate mt-0.5">Click a bar to see that month's detail</p>
            </div>
          </div>
          {isDetailLoading ? (
            <Skeleton height={200} className="rounded-[10px]" />
          ) : detailData.some(m => m.revenue > 0) ? (
            <div
              onClick={e => {
                // Find which bar index was clicked based on x position
                const el = (e.currentTarget as HTMLDivElement)
                const rect = el.getBoundingClientRect()
                const rel  = (e.clientX - rect.left) / rect.width
                const idx  = Math.floor(rel * 12)
                setSelectedMonth(prev => prev === idx ? null : idx)
              }}
              className="cursor-pointer"
            >
              <BarChart
                data={singleYearBars}
                height={200}
                formatValue={v => `KSh ${(v/1000).toFixed(1)}K`}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-[14px] text-slate">No revenue data for {detailYear}.</p>
            </div>
          )}
        </div>

        {/* Month detail panel */}
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-4">
            {selectedMonth !== null ? `${MONTHS[selectedMonth]} ${detailYear}` : 'Month detail'}
          </h3>
          {selectedMonth === null ? (
            <p className="text-[13px] text-slate">Click a bar on the left to see that month's breakdown.</p>
          ) : (() => {
            const m = detailData[selectedMonth]
            if (!m) return <p className="text-[13px] text-slate">No data.</p>
            const prev = selectedMonth > 0 ? detailData[selectedMonth - 1] : null
            const change = prev && prev.revenue > 0 ? ((m.revenue - prev.revenue) / prev.revenue) * 100 : null
            return (
              <div className="space-y-4">
                {[
                  { label: 'Revenue',  value: fmtK(m.revenue),         sub: change !== null ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs ${MONTHS[selectedMonth - 1]}` : undefined, positive: change !== null ? change >= 0 : true },
                  { label: 'Orders',   value: m.orders.toLocaleString(), sub: undefined },
                  { label: 'Avg. order value', value: m.orders > 0 ? fmtK(m.revenue / m.orders) : '—', sub: undefined },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between py-3 border-b border-sand last:border-0">
                    <span className="text-[13px] text-slate">{row.label}</span>
                    <div className="text-right">
                      <p className="text-[14px] font-semibold text-ink">{row.value}</p>
                      {row.sub && (
                        <p className={['text-[11.5px] mt-0.5', row.positive ? 'text-green' : 'text-red'].join(' ')}>
                          {row.sub}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Mini growth rate sparkline */}
                <div>
                  <p className="text-[12px] font-semibold text-slate uppercase tracking-wide mb-2">MoM growth rate</p>
                  <div className="flex items-end gap-1 h-10">
                    {growthRates.map((r, i) => {
                      const isPos  = r >= 0
                      const height = Math.min(Math.abs(r), 100)
                      return (
                        <div
                          key={i}
                          className={['flex-1 rounded-sm min-h-[2px]', i === selectedMonth ? 'opacity-100' : 'opacity-40'].join(' ')}
                          style={{
                            height: `${height}%`,
                            background: isPos ? '#3F6B4F' : '#E55050',
                            alignSelf: isPos ? 'flex-end' : 'flex-start',
                          }}
                          title={`${MONTHS[i]}: ${r.toFixed(1)}%`}
                        />
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate mt-1">
                    <span>Jan</span><span>Dec</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── Multi-year comparison line chart ─────────────────────────────── */}
      <div className="bg-white border border-sand rounded-[14px] p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <h3 className="font-serif text-[17px] font-medium text-ink">Year-over-year comparison</h3>
            <p className="text-[12.5px] text-slate mt-0.5">Compare revenue across up to 5 years — Jan to Dec</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {YEAR_RANGE.map((year, i) => (
              <YearPill
                key={year}
                year={year}
                active={activeYears.includes(year)}
                color={YEAR_COLORS[i]}
                onClick={() => { toggleYear(year); fetchYear(year) }}
              />
            ))}
          </div>
        </div>
        {multiYearLoading ? (
          <Skeleton height={240} className="rounded-[10px]" />
        ) : (
          <LineChart
            labels={MONTHS}
            series={multiYearSeries}
            height={240}
            formatValue={v => `KSh ${(v/1000).toFixed(1)}K`}
            showDots={activeYears.length <= 2}
          />
        )}
      </div>

      {/* ── Month-by-month table ──────────────────────────────────────────── */}
      <div className="bg-white border border-sand rounded-[14px] p-5">
        <h3 className="font-serif text-[17px] font-medium text-ink mb-4">{detailYear} — month by month</h3>
        {isDetailLoading ? (
          <Skeleton height={320} className="rounded-[10px]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-sand">
                  {['Month','Revenue','Orders','Avg. order','MoM change'].map(h => (
                    <th key={h} className="text-left py-2.5 pr-4 text-[11.5px] font-semibold text-slate uppercase tracking-wide last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailData.map((m, i) => {
                  const prev   = i > 0 ? detailData[i - 1] : null
                  const change = prev && prev.revenue > 0
                    ? ((m.revenue - prev.revenue) / prev.revenue * 100)
                    : null
                  const isActive = i === selectedMonth
                  return (
                    <tr
                      key={m.month}
                      onClick={() => setSelectedMonth(prev => prev === i ? null : i)}
                      className={[
                        'border-b border-sand/60 last:border-0 cursor-pointer transition-colors',
                        isActive ? 'bg-gold/10' : 'hover:bg-ivory',
                      ].join(' ')}
                    >
                      <td className="py-3 pr-4 font-semibold text-ink">{m.monthName}</td>
                      <td className="py-3 pr-4 font-semibold text-ink">{fmtK(m.revenue)}</td>
                      <td className="py-3 pr-4 text-slate">{m.orders}</td>
                      <td className="py-3 pr-4 text-slate">
                        {m.orders > 0 ? fmtK(m.revenue / m.orders) : '—'}
                      </td>
                      <td className="py-3 text-right">
                        {change === null ? (
                          <span className="text-slate/50">—</span>
                        ) : (
                          <span className={change >= 0 ? 'text-green font-semibold' : 'text-red font-semibold'}>
                            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-sand">
                  <td className="py-3 pr-4 font-bold text-ink">Total</td>
                  <td className="py-3 pr-4 font-bold text-ink">{fmtK(totalRevenue)}</td>
                  <td className="py-3 pr-4 font-bold text-ink">{totalOrders}</td>
                  <td className="py-3 pr-4 font-semibold text-slate">
                    {totalOrders > 0 ? fmtK(totalRevenue / totalOrders) : '—'}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

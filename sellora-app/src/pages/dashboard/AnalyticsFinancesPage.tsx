import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react'
import { PageHeader, KpiCard, LineChart, PieChart, BarChart, Skeleton } from '@/components/ui'
import type { PieSlice } from '@/components/ui'
import { analyticsService, financesService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { MonthlyDataPoint, Expense } from '@/types'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_RANGE   = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 4 + i)
const MONTHS       = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const fmtK = (n: number) => {
  const abs = Math.abs(n)
  const str = abs >= 1000 ? `KSh ${(abs / 1000).toFixed(1)}K` : `KSh ${abs}`
  return n < 0 ? `−${str}` : str
}

// Expense category colours
const CAT_COLORS: Record<string, string> = {
  rent:        '#C79A3D',
  utilities:   '#3F6B4F',
  salaries:    '#171B21',
  marketing:   '#4F6BB0',
  supplies:    '#E59050',
  transport:   '#9B5DE5',
  maintenance: '#64748B',
  other:       '#94A3B8',
}
function catColor(cat: string) {
  return CAT_COLORS[cat.toLowerCase()] ?? '#94A3B8'
}

export default function AnalyticsFinancesPage() {
  const { currentBusiness } = useAuth()

  const [year, setYear]             = useState(CURRENT_YEAR)
  const [monthly, setMonthly]       = useState<MonthlyDataPoint[]>([])
  const [expenses, setExpenses]     = useState<Expense[]>([])
  const [loadingMonthly, setLM]     = useState(true)
  const [loadingExpenses, setLE]    = useState(true)

  useEffect(() => {
    if (!currentBusiness) return
    setLM(true)
    analyticsService.getMonthly(currentBusiness.id, year)
      .then(setMonthly)
      .catch(() => {})
      .finally(() => setLM(false))
  }, [currentBusiness?.id, year]) // eslint-disable-line

  useEffect(() => {
    if (!currentBusiness) return
    setLE(true)
    // Fetch expenses for the whole year — use a large page size
    financesService.getExpenses(currentBusiness.id, 'all')
      .then(r => setExpenses(r.expenses))
      .catch(() => {})
      .finally(() => setLE(false))
  }, [currentBusiness?.id]) // eslint-disable-line

  // ── Derived KPIs ─────────────────────────────────────────────────────────
  const totalRevenue  = monthly.reduce((s, m) => s + m.revenue, 0)
  const totalExpenses = monthly.reduce((s, m) => s + m.expenses, 0)
  const totalProfit   = monthly.reduce((s, m) => s + m.netProfit, 0)
  const profitMargin  = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const profitableMonths   = monthly.filter(m => m.netProfit > 0).length
  const unprofitableMonths = monthly.filter(m => m.netProfit < 0).length

  // ── Line chart: revenue vs expenses vs profit ─────────────────────────────
  const lineSeries = [
    { label: 'Revenue',  color: '#C79A3D', data: monthly.map(m => m.revenue)  },
    { label: 'Expenses', color: '#E55050', data: monthly.map(m => m.expenses), dashed: true },
    { label: 'Profit',   color: '#3F6B4F', data: monthly.map(m => m.netProfit) },
  ]

  // ── Bar chart: net profit per month (positive = green, negative = red) ───
  const profitBars = monthly.map(m => ({
    label:     m.monthName,
    value:     m.netProfit,
    highlight: m.netProfit < 0,   // red-highlight losses
  }))

  // ── Expense pie by category (filter to selected year) ────────────────────
  const yearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === year)
  const catTotals: Record<string, number> = {}
  yearExpenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] ?? 0) + e.amount
  })
  const expensePie: PieSlice[] = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => ({ label: cat, value: val, color: catColor(cat) }))

  // ── Monthly table ─────────────────────────────────────────────────────────
  const loading = loadingMonthly

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Finances"
        subtitle="Revenue, expenses, and profit broken down by month"
        breadcrumb={[{ label: 'Analytics', href: '/app/analytics' }, { label: 'Finances' }]}
        actions={
          <div className="flex items-center gap-1.5 bg-white border border-sand rounded-[10px] p-1">
            <button
              onClick={() => setYear(y => Math.max(y - 1, YEAR_RANGE[0]))}
              disabled={year <= YEAR_RANGE[0]}
              className="p-1.5 rounded-[7px] hover:bg-sand transition-colors text-slate disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[13.5px] font-semibold text-ink px-2">{year}</span>
            <button
              onClick={() => setYear(y => Math.min(y + 1, CURRENT_YEAR))}
              disabled={year >= CURRENT_YEAR}
              className="p-1.5 rounded-[7px] hover:bg-sand transition-colors text-slate disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        }
      />

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} height={96} className="rounded-[14px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total revenue"
            value={fmtK(totalRevenue)}
            icon={<DollarSign size={15} className="text-gold-deep" />}
            sparklineData={monthly.map(m => m.revenue)}
          />
          <KpiCard
            label="Total expenses"
            value={fmtK(totalExpenses)}
            icon={<Receipt size={15} className="text-red" />}
            sparklineData={monthly.map(m => m.expenses)}
          />
          <KpiCard
            label="Net profit"
            value={fmtK(totalProfit)}
            icon={totalProfit >= 0
              ? <TrendingUp size={15} className="text-green" />
              : <TrendingDown size={15} className="text-red" />
            }
            sparklineData={monthly.map(m => m.netProfit)}
          />
          <KpiCard
            label="Profit margin"
            value={`${profitMargin.toFixed(1)}%`}
            subValue={`${profitableMonths} profitable months`}
            icon={<TrendingUp size={15} className="text-blue" />}
          />
        </div>
      )}

      {/* Revenue vs Expenses vs Profit line chart */}
      <div className="bg-white border border-sand rounded-[14px] p-5">
        <div className="mb-5">
          <h3 className="font-serif text-[17px] font-medium text-ink">Revenue vs expenses vs profit — {year}</h3>
          <p className="text-[12.5px] text-slate mt-0.5">Dashed line = expenses. Hover to see exact values.</p>
        </div>
        {loading ? (
          <Skeleton height={240} className="rounded-[10px]" />
        ) : monthly.some(m => m.revenue > 0 || m.expenses > 0) ? (
          <LineChart
            labels={MONTHS}
            series={lineSeries}
            height={240}
            formatValue={fmtK}
            showDots={false}
          />
        ) : (
          <div className="flex items-center justify-center h-[240px]">
            <p className="text-[14px] text-slate">No financial data for {year}.</p>
          </div>
        )}
      </div>

      {/* Net profit bar + expense breakdown pie */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Net profit per month */}
        <div className="lg:col-span-2 bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-1">Net profit per month</h3>
          <p className="text-[12.5px] text-slate mb-5">
            Gold = profitable&nbsp;·&nbsp;Red = loss
          </p>
          {loading ? (
            <Skeleton height={180} className="rounded-[10px]" />
          ) : (
            /* We manually render bars so losses can be red */
            <div>
              <div className="flex items-end gap-[5px] w-full" style={{ height: 180 }}>
                {(() => {
                  const maxAbs = Math.max(...monthly.map(m => Math.abs(m.netProfit)), 1)
                  return monthly.map((m, i) => {
                    const pct    = (Math.abs(m.netProfit) / maxAbs) * 100
                    const isLoss = m.netProfit < 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                        <div
                          className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-ink text-ivory text-[11px] px-2 py-1 rounded-[6px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity"
                        >
                          {fmtK(m.netProfit)}
                        </div>
                        <div
                          className="w-full rounded-t-[3px] min-h-[4px] transition-all duration-300"
                          style={{
                            height: `${pct}%`,
                            background: isLoss ? '#E55050' : '#C79A3D',
                            opacity: 0.85,
                          }}
                        />
                      </div>
                    )
                  })
                })()}
              </div>
              <div className="flex gap-[5px] mt-2">
                {MONTHS.map(m => (
                  <div key={m} className="flex-1 text-center">
                    <span className="text-[10px] text-slate">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profitable vs loss summary strip */}
          {!loading && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-sand">
              <div className="flex items-center gap-2 text-[12.5px]">
                <div className="w-3 h-3 rounded-full bg-gold" />
                <span className="text-slate">{profitableMonths} profitable months</span>
              </div>
              <div className="flex items-center gap-2 text-[12.5px]">
                <div className="w-3 h-3 rounded-full bg-red" />
                <span className="text-slate">{unprofitableMonths} loss months</span>
              </div>
            </div>
          )}
        </div>

        {/* Expense breakdown pie */}
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-1">Expenses by category</h3>
          <p className="text-[12.5px] text-slate mb-4">{year} total</p>
          {loadingExpenses ? (
            <Skeleton height={200} className="rounded-[10px]" />
          ) : expensePie.length > 0 ? (
            <PieChart
              data={expensePie}
              size={160}
              thickness={0.5}
              showLegend
              formatValue={v => fmtK(v)}
            />
          ) : (
            <div className="flex items-center justify-center h-[160px]">
              <p className="text-[13px] text-slate text-center">No expenses recorded for {year}.</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly P&L table */}
      <div className="bg-white border border-sand rounded-[14px] p-5">
        <h3 className="font-serif text-[17px] font-medium text-ink mb-4">
          {year} — profit & loss by month
        </h3>
        {loading ? (
          <Skeleton height={340} className="rounded-[10px]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-sand">
                  {['Month','Revenue','Expenses','Gross profit','Net profit','Margin'].map(h => (
                    <th
                      key={h}
                      className="text-left py-2.5 pr-4 text-[11.5px] font-semibold text-slate uppercase tracking-wide last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.map(m => {
                  const margin = m.revenue > 0 ? (m.netProfit / m.revenue) * 100 : 0
                  const isLoss = m.netProfit < 0
                  return (
                    <tr key={m.month} className="border-b border-sand/60 last:border-0 hover:bg-ivory transition-colors">
                      <td className="py-3 pr-4 font-semibold text-ink">{m.monthName}</td>
                      <td className="py-3 pr-4 text-ink">{fmtK(m.revenue)}</td>
                      <td className="py-3 pr-4 text-slate">{m.expenses > 0 ? fmtK(m.expenses) : '—'}</td>
                      <td className="py-3 pr-4 text-ink">{fmtK(m.revenue - m.expenses)}</td>
                      <td className={['py-3 pr-4 font-semibold', isLoss ? 'text-red' : 'text-green'].join(' ')}>
                        {fmtK(m.netProfit)}
                      </td>
                      <td className="py-3 text-right">
                        {m.revenue > 0 ? (
                          <span className={['font-semibold', isLoss ? 'text-red' : 'text-slate'].join(' ')}>
                            {margin.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate/40">—</span>
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
                  <td className="py-3 pr-4 font-semibold text-slate">{fmtK(totalExpenses)}</td>
                  <td className="py-3 pr-4 font-bold text-ink">{fmtK(totalRevenue - totalExpenses)}</td>
                  <td className={['py-3 pr-4 font-bold', totalProfit < 0 ? 'text-red' : 'text-green'].join(' ')}>
                    {fmtK(totalProfit)}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate">
                    {profitMargin.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

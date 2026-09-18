import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import { PageHeader, Skeleton } from '@/components/ui'
import { financesService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { FinanceSummary } from '@/types'

type Period = '7d' | '30d' | '90d' | 'all'

const fmtK = (n: number) => {
  const abs = Math.abs(n)
  return `KSh ${abs >= 1000 ? `${(abs / 1000).toFixed(1)}K` : abs.toLocaleString()}`
}

// Thin horizontal bar showing a value's proportion of revenue
function ProportionBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(Math.abs(value) / max, 1) * 100 : 0
  return (
    <div className="h-1 bg-sand rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

export default function FinancesPage() {
  const { currentBusiness } = useAuth()
  const navigate = useNavigate()
  const [period, setPeriod]   = useState<Period>('30d')
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentBusiness) return
    setLoading(true)
    financesService.getSummary(currentBusiness.id, period)
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentBusiness?.id, period]) // eslint-disable-line

  const plCards = summary ? [
    { label: 'Revenue',       value: fmtK(summary.revenue),     icon: <TrendingUp   size={15} className="text-gold-deep" />, sub: undefined,                               highlight: false },
    { label: 'Cost of goods', value: fmtK(summary.costOfGoods), icon: <TrendingDown size={15} className="text-slate" />,     sub: undefined,                               highlight: false },
    { label: 'Gross profit',  value: fmtK(summary.grossProfit), icon: <TrendingUp   size={15} className="text-green" />,     sub: `${summary.grossMargin.toFixed(1)}% margin`, highlight: false },
    { label: 'Expenses',      value: fmtK(summary.expenses),    icon: <TrendingDown size={15} className="text-red" />,       sub: undefined,                               highlight: false },
    { label: 'Net profit',    value: fmtK(summary.netProfit),   icon: <ArrowUpRight size={15} className="text-green" />,     sub: `${summary.netMargin.toFixed(1)}% margin`,   highlight: true  },
  ] : []

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Finances"
        subtitle="Profit & loss summary"
        breadcrumb={[{ label: 'Finances' }]}
        actions={
          <div className="flex gap-1 bg-ivory border border-sand rounded-[9px] p-1">
            {(['7d', '30d', '90d', 'all'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={['px-3 py-1.5 text-[12.5px] font-semibold rounded-[7px] transition-colors', period === p ? 'bg-white text-ink shadow-sm' : 'text-slate hover:text-ink'].join(' ')}>
                {p}
              </button>
            ))}
          </div>
        }
      />

      {/* P&L Cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} height={96} className="rounded-[14px]" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {plCards.map(card => (
            <div key={card.label} className={['rounded-[14px] p-4', card.highlight ? 'bg-ink text-ivory' : 'bg-white border border-sand'].join(' ')}>
              <div className="flex items-center justify-between mb-3">
                <p className={['text-[12px] font-medium uppercase tracking-wide', card.highlight ? 'text-ivory/60' : 'text-slate'].join(' ')}>{card.label}</p>
                <div className={['w-8 h-8 rounded-[8px] flex items-center justify-center', card.highlight ? 'bg-white/10' : 'bg-ivory border border-sand'].join(' ')}>{card.icon}</div>
              </div>
              <p className={['font-serif text-[22px] font-semibold', card.highlight ? 'text-ivory' : 'text-ink'].join(' ')}>{card.value}</p>
              {card.sub && <p className={['text-[12px] mt-1 font-semibold', card.highlight ? 'text-gold' : 'text-green'].join(' ')}>{card.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── Redesigned breakdown + nav section ────────────────────────────── */}
      {!loading && summary && (
        <div className="grid lg:grid-cols-5 gap-5">

          {/* P&L waterfall — 3 cols wide */}
          <div className="lg:col-span-3 bg-white border border-sand rounded-[16px] overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-sand">
              <h3 className="font-serif text-[16px] font-medium text-ink">How it breaks down</h3>
              <p className="text-[12.5px] text-slate mt-0.5">Where your money comes from and goes</p>
            </div>

            <div className="px-5 py-4 space-y-0 divide-y divide-sand/60">
              {/* Revenue */}
              <div className="py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[7px] bg-gold/10 flex items-center justify-center shrink-0">
                      <TrendingUp size={13} className="text-gold-deep" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-ink">Revenue</p>
                      <p className="text-[11.5px] text-slate">Completed & paid orders</p>
                    </div>
                  </div>
                  <p className="text-[14px] font-bold text-ink">{fmtK(summary.revenue)}</p>
                </div>
                <ProportionBar value={summary.revenue} max={summary.revenue} color="#C79A3D" />
              </div>

              {/* Cost of goods */}
              <div className="py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[7px] bg-sand flex items-center justify-center shrink-0">
                      <TrendingDown size={13} className="text-slate" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-medium text-slate">− Cost of goods</p>
                      <p className="text-[11.5px] text-slate/60">Cost price × units sold</p>
                    </div>
                  </div>
                  <p className="text-[13.5px] font-semibold text-slate">−{fmtK(summary.costOfGoods)}</p>
                </div>
                <ProportionBar value={summary.costOfGoods} max={summary.revenue} color="#64748B" />
              </div>

              {/* Gross profit — separator result */}
              <div className="py-3.5 bg-green/4 -mx-5 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[7px] bg-green/10 flex items-center justify-center shrink-0">
                      <ArrowUpRight size={13} className="text-green" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-ink">= Gross profit</p>
                      <p className="text-[11.5px] text-slate">{summary.grossMargin.toFixed(1)}% gross margin</p>
                    </div>
                  </div>
                  <p className="text-[14px] font-bold text-green">{fmtK(summary.grossProfit)}</p>
                </div>
                <ProportionBar value={summary.grossProfit} max={summary.revenue} color="#3F6B4F" />
              </div>

              {/* Expenses */}
              <div className="py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[7px] bg-red/8 flex items-center justify-center shrink-0">
                      <ArrowDownRight size={13} className="text-red" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-medium text-slate">− Expenses</p>
                      <p className="text-[11.5px] text-slate/60">Operating costs you logged</p>
                    </div>
                  </div>
                  <p className="text-[13.5px] font-semibold text-red">−{fmtK(summary.expenses)}</p>
                </div>
                <ProportionBar value={summary.expenses} max={summary.revenue} color="#E55050" />
              </div>

              {/* Net profit — final result */}
              <div className={['py-3.5 -mx-5 px-5', summary.netProfit >= 0 ? 'bg-green/4' : 'bg-red/4'].join(' ')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={['w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0', summary.netProfit >= 0 ? 'bg-green/10' : 'bg-red/10'].join(' ')}>
                      {summary.netProfit >= 0
                        ? <TrendingUp size={13} className="text-green" />
                        : <TrendingDown size={13} className="text-red" />
                      }
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-ink">= Net profit</p>
                      <p className="text-[11.5px] text-slate">{summary.netMargin.toFixed(1)}% net margin</p>
                    </div>
                  </div>
                  <p className={['text-[15px] font-bold', summary.netProfit >= 0 ? 'text-green' : 'text-red'].join(' ')}>
                    {summary.netProfit < 0 ? '−' : ''}{fmtK(summary.netProfit)}
                  </p>
                </div>
                <ProportionBar value={summary.netProfit} max={summary.revenue} color={summary.netProfit >= 0 ? '#3F6B4F' : '#E55050'} />
              </div>
            </div>
          </div>

          {/* Right column — nav cards */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Income card */}
            <button
              onClick={() => navigate('/app/finances/income')}
              className="flex-1 group bg-white border border-sand rounded-[16px] p-5 text-left hover:border-green/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-[10px] bg-green/8 flex items-center justify-center">
                  <TrendingUp size={18} className="text-green" />
                </div>
                <ChevronRight size={16} className="text-slate/40 group-hover:text-green group-hover:translate-x-0.5 transition-all mt-0.5" />
              </div>
              <div>
                <p className="font-serif text-[17px] font-medium text-ink mb-1">Income</p>
                <p className="text-[12.5px] text-slate leading-relaxed">Payments from completed orders, searchable by date, customer and method.</p>
              </div>
              <div className="mt-3 pt-3 border-t border-sand flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green" />
                <p className="text-[12px] font-semibold text-green">{fmtK(summary.revenue)} this period</p>
              </div>
            </button>

            {/* Expenses card */}
            <button
              onClick={() => navigate('/app/finances/expenses')}
              className="flex-1 group bg-white border border-sand rounded-[16px] p-5 text-left hover:border-red/30 hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-[10px] bg-red/6 flex items-center justify-center">
                  <TrendingDown size={18} className="text-red" />
                </div>
                <ChevronRight size={16} className="text-slate/40 group-hover:text-red group-hover:translate-x-0.5 transition-all mt-0.5" />
              </div>
              <div>
                <p className="font-serif text-[17px] font-medium text-ink mb-1">Expenses</p>
                <p className="text-[12.5px] text-slate leading-relaxed">Log operating costs, browse by category and date, and track what eats into profit.</p>
              </div>
              <div className="mt-3 pt-3 border-t border-sand flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red" />
                <p className="text-[12px] font-semibold text-red">{fmtK(summary.expenses)} spent this period</p>
              </div>
            </button>

          </div>
        </div>
      )}

      {/* Loading skeleton for the bottom section */}
      {loading && (
        <div className="grid lg:grid-cols-5 gap-5">
          <Skeleton height={360} className="lg:col-span-3 rounded-[16px]" />
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Skeleton height={172} className="rounded-[16px]" />
            <Skeleton height={172} className="rounded-[16px]" />
          </div>
        </div>
      )}
    </div>
  )
}

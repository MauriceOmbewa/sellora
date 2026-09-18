import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { PageHeader, Skeleton } from '@/components/ui'
import { financesService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { FinanceSummary } from '@/types'

type Period = '7d' | '30d' | '90d' | 'all'

const fmtK = (n: number) =>
  `KSh ${Math.abs(n) >= 1000 ? `${(Math.abs(n) / 1000).toFixed(1)}K` : Math.abs(n).toLocaleString()}`

export default function FinancesPage() {
  const { currentBusiness } = useAuth()
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
    {
      label:     'Revenue',
      value:     fmtK(summary.revenue),
      icon:      <TrendingUp size={15} className="text-gold-deep" />,
      highlight: false,
    },
    {
      label:     'Cost of goods',
      value:     fmtK(summary.costOfGoods),
      icon:      <TrendingDown size={15} className="text-slate" />,
      highlight: false,
    },
    {
      label:     'Gross profit',
      value:     fmtK(summary.grossProfit),
      sub:       `${summary.grossMargin.toFixed(1)}% margin`,
      icon:      <TrendingUp size={15} className="text-green" />,
      highlight: false,
    },
    {
      label:     'Expenses',
      value:     fmtK(summary.expenses),
      icon:      <TrendingDown size={15} className="text-red" />,
      highlight: false,
    },
    {
      label:     'Net profit',
      value:     fmtK(summary.netProfit),
      sub:       `${summary.netMargin.toFixed(1)}% margin`,
      icon:      <ArrowUpRight size={15} className="text-green" />,
      highlight: true,
    },
  ] : []

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Finances"
        subtitle="Profit & loss summary"
        breadcrumb={[{ label: 'Finances' }]}
        actions={
          <div className="flex gap-1 bg-ivory border border-sand rounded-[9px] p-1">
            {(['7d', '30d', '90d', 'all'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={[
                  'px-3 py-1.5 text-[12.5px] font-semibold rounded-[7px] transition-colors',
                  period === p ? 'bg-white text-ink shadow-sm' : 'text-slate hover:text-ink',
                ].join(' ')}
              >
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
            <div
              key={card.label}
              className={[
                'rounded-[14px] p-4',
                card.highlight ? 'bg-ink text-ivory' : 'bg-white border border-sand',
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-3">
                <p className={[
                  'text-[12px] font-medium uppercase tracking-wide',
                  card.highlight ? 'text-ivory/60' : 'text-slate',
                ].join(' ')}>
                  {card.label}
                </p>
                <div className={[
                  'w-8 h-8 rounded-[8px] flex items-center justify-center',
                  card.highlight ? 'bg-white/10' : 'bg-ivory border border-sand',
                ].join(' ')}>
                  {card.icon}
                </div>
              </div>
              <p className={[
                'font-serif text-[22px] font-semibold',
                card.highlight ? 'text-ivory' : 'text-ink',
              ].join(' ')}>
                {card.value}
              </p>
              {card.sub && (
                <p className={[
                  'text-[12px] mt-1 font-semibold',
                  card.highlight ? 'text-gold' : 'text-green',
                ].join(' ')}>
                  {card.sub}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* P&L breakdown explanation */}
      {!loading && summary && (
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-4">How it breaks down</h3>
          <div className="space-y-3">
            {[
              {
                label: 'Revenue',
                amount: summary.revenue,
                desc: 'Total from completed, paid orders',
                color: 'bg-gold',
              },
              {
                label: '− Cost of goods',
                amount: -summary.costOfGoods,
                desc: 'Product cost price × units sold',
                color: 'bg-slate',
              },
              {
                label: '= Gross profit',
                amount: summary.grossProfit,
                desc: `${summary.grossMargin.toFixed(1)}% gross margin`,
                color: 'bg-green',
                bold: true,
              },
              {
                label: '− Expenses',
                amount: -summary.expenses,
                desc: 'Operating expenses you logged',
                color: 'bg-red',
              },
              {
                label: '= Net profit',
                amount: summary.netProfit,
                desc: `${summary.netMargin.toFixed(1)}% net margin — your take-home`,
                color: summary.netProfit >= 0 ? 'bg-green' : 'bg-red',
                bold: true,
              },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <div className={['w-2.5 h-2.5 rounded-full shrink-0', row.color].join(' ')} />
                <div className="flex-1 flex items-center justify-between gap-4">
                  <div>
                    <span className={['text-[13.5px]', row.bold ? 'font-bold text-ink' : 'text-slate'].join(' ')}>
                      {row.label}
                    </span>
                    <span className="text-[12px] text-slate/60 ml-2">{row.desc}</span>
                  </div>
                  <span className={[
                    'text-[13.5px] shrink-0',
                    row.bold ? 'font-bold text-ink' : 'font-medium text-slate',
                    row.amount < 0 ? 'text-red' : '',
                  ].join(' ')}>
                    {row.amount < 0 ? `−${fmtK(row.amount)}` : fmtK(row.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick-links to sub-pages */}
      {!loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title:   'Income',
              desc:    'View all payments received from completed orders',
              href:    '/app/finances/income',
              accent:  'border-l-green',
            },
            {
              title:   'Expenses',
              desc:    'Log and manage your operating expenses',
              href:    '/app/finances/expenses',
              accent:  'border-l-red',
            },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className={[
                'bg-white border border-sand border-l-4 rounded-[14px] p-5 flex items-center justify-between hover:border-ink/20 hover:-translate-y-0.5 transition-all',
                link.accent,
              ].join(' ')}
            >
              <div>
                <p className="font-semibold text-[14px] text-ink">{link.title}</p>
                <p className="text-[12.5px] text-slate mt-0.5">{link.desc}</p>
              </div>
              <ArrowUpRight size={16} className="text-slate shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Search, ChevronLeft, ChevronRight, ExternalLink, Smartphone, Banknote, CreditCard, Building2, MessageCircle, X } from 'lucide-react'
import { PageHeader, Skeleton, Badge, SearchInput } from '@/components/ui'
import { incomeService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { IncomeEntry } from '@/types'

type Period = '7d' | '30d' | '90d' | 'all'

const fmtK = (n: number) => `KSh ${n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString()}`

const PAYMENT_METHODS = [
  { value: '',             label: 'All methods' },
  { value: 'mpesa',        label: 'M-PESA' },
  { value: 'cash',         label: 'Cash' },
  { value: 'card',         label: 'Card' },
  { value: 'bank_transfer',label: 'Bank transfer' },
  { value: 'whatsapp',     label: 'WhatsApp' },
]

const CHANNELS = [
  { value: 'online',    label: 'Online' },
  { value: 'walk-in',   label: 'Walk-in' },
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'phone',     label: 'Phone' },
]

function methodIcon(m: string) {
  switch (m) {
    case 'mpesa':         return <Smartphone  size={12} />
    case 'cash':          return <Banknote    size={12} />
    case 'card':          return <CreditCard  size={12} />
    case 'bank_transfer': return <Building2   size={12} />
    case 'whatsapp':      return <MessageCircle size={12} />
    default:              return null
  }
}

function methodLabel(m: string) {
  return PAYMENT_METHODS.find(p => p.value === m)?.label ?? m
}

function channelBadgeVariant(c: string): 'info' | 'gold' | 'outline' | 'success' {
  switch (c) {
    case 'online':   return 'info'
    case 'walk-in':  return 'gold'
    case 'whatsapp': return 'success'
    default:         return 'outline'
  }
}

export default function IncomePage() {
  const { currentBusiness } = useAuth()
  const navigate = useNavigate()

  const [entries, setEntries]       = useState<IncomeEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(true)

  // Filters
  const [period, setPeriod]               = useState<Period>('30d')
  const [search, setSearch]               = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [page, setPage]                   = useState(1)

  const totalAmount = entries.reduce((s, e) => s + e.amount, 0)

  const load = useCallback(() => {
    if (!currentBusiness) return
    setLoading(true)
    incomeService.getAll(currentBusiness.id, {
      period,
      search:         search || undefined,
      payment_method: paymentMethod || undefined,
      page,
      page_size:      20,
    })
      .then(r => { setEntries(r.entries); setTotalCount(r.count); setTotalPages(r.totalPages) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentBusiness?.id, period, search, paymentMethod, page]) // eslint-disable-line

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [period, search, paymentMethod])
  useEffect(() => { load() }, [load])

  const hasFilters = search || paymentMethod

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Income"
        subtitle="Payments received from completed orders"
        breadcrumb={[{ label: 'Finances', href: '/app/finances' }, { label: 'Income' }]}
      />

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: period === 'all' ? 'Total income' : `Income (${period})`,
            value: fmtK(totalAmount),
            icon: <TrendingUp size={15} className="text-gold-deep" />,
            highlight: true,
          },
          {
            label: 'Transactions',
            value: totalCount.toLocaleString(),
            icon: <ExternalLink size={15} className="text-ink" />,
            highlight: false,
          },
          {
            label: 'Avg. per order',
            value: totalCount > 0 ? fmtK(totalAmount / totalCount) : '—',
            icon: <TrendingUp size={15} className="text-green" />,
            highlight: false,
          },
        ].map(card => (
          <div
            key={card.label}
            className={[
              'rounded-[14px] p-4',
              card.highlight ? 'bg-ink text-ivory' : 'bg-white border border-sand',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-3">
              <p className={['text-[12px] font-medium uppercase tracking-wide', card.highlight ? 'text-ivory/60' : 'text-slate'].join(' ')}>
                {card.label}
              </p>
              <div className={['w-8 h-8 rounded-[8px] flex items-center justify-center', card.highlight ? 'bg-white/10' : 'bg-ivory border border-sand'].join(' ')}>
                {card.icon}
              </div>
            </div>
            <p className={['font-serif text-[22px] font-semibold', card.highlight ? 'text-ivory' : 'text-ink'].join(' ')}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filters bar ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-sand rounded-[14px] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search order number or customer…"
            />
          </div>

          {/* Period */}
          <div className="flex gap-1 bg-ivory border border-sand rounded-[9px] p-1 shrink-0">
            {(['7d','30d','90d','all'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={[
                  'px-3 py-1.5 text-[12px] font-semibold rounded-[7px] transition-colors',
                  period === p ? 'bg-white text-ink shadow-sm' : 'text-slate hover:text-ink',
                ].join(' ')}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Payment method */}
          <select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            className="shrink-0 h-[38px] px-3 rounded-[9px] border border-sand bg-ivory text-[13px] text-ink font-medium focus:outline-none focus:border-ink/30"
          >
            {PAYMENT_METHODS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {search && (
              <span className="inline-flex items-center gap-1.5 text-[12px] bg-ink/6 border border-ink/10 text-ink px-2.5 py-1 rounded-full">
                "{search}"
                <button onClick={() => setSearch('')}><X size={11} /></button>
              </span>
            )}
            {paymentMethod && (
              <span className="inline-flex items-center gap-1.5 text-[12px] bg-ink/6 border border-ink/10 text-ink px-2.5 py-1 rounded-full">
                {methodLabel(paymentMethod)}
                <button onClick={() => setPaymentMethod('')}><X size={11} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Ledger table ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-sand rounded-[14px] overflow-hidden">
        {/* Table header */}
        <div className="px-5 py-3.5 border-b border-sand">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-[16px] font-medium text-ink">
              Income ledger
            </h3>
            <p className="text-[12.5px] text-slate">
              {loading ? '—' : `${totalCount.toLocaleString()} entries`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} height={52} className="rounded-[8px]" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-ivory border border-sand flex items-center justify-center">
              <TrendingUp size={20} className="text-slate/40" />
            </div>
            <p className="text-[14px] text-slate font-medium">No income found</p>
            <p className="text-[13px] text-slate/60">
              {hasFilters ? 'Try adjusting your filters.' : 'Income appears here once orders are completed and paid.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-sand bg-ivory/50">
                    {['Date & time','Order','Customer','Items','Method','Channel','Amount'].map(h => (
                      <th
                        key={h}
                        className={[
                          'px-4 py-2.5 text-[11px] font-semibold text-slate uppercase tracking-wide',
                          h === 'Amount' ? 'text-right' : 'text-left',
                        ].join(' ')}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => {
                    const d = new Date(entry.date)
                    const dateStr = d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                    const timeStr = d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })

                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-sand/60 last:border-0 hover:bg-ivory/60 transition-colors group"
                      >
                        {/* Date + time */}
                        <td className="px-4 py-3.5">
                          <p className="text-[13px] font-medium text-ink">{dateStr}</p>
                          <p className="text-[11.5px] text-slate mt-0.5">{timeStr}</p>
                        </td>

                        {/* Order number — clickable */}
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => navigate(`/app/orders/${entry.orderId}`)}
                            className="flex items-center gap-1.5 text-[13px] font-semibold text-ink hover:text-gold transition-colors"
                          >
                            {entry.orderNumber}
                            <ExternalLink size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                          </button>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3.5">
                          <p className="text-[13px] font-medium text-ink">{entry.customerName}</p>
                          <p className="text-[11.5px] text-slate mt-0.5">{entry.customerPhone}</p>
                        </td>

                        {/* Items summary */}
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <p className="text-[12.5px] text-slate truncate" title={entry.itemsSummary}>
                            {entry.itemsSummary || '—'}
                          </p>
                        </td>

                        {/* Payment method */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink bg-ivory border border-sand rounded-full px-2.5 py-1">
                            {methodIcon(entry.paymentMethod)}
                            {methodLabel(entry.paymentMethod)}
                          </span>
                        </td>

                        {/* Channel */}
                        <td className="px-4 py-3.5">
                          <Badge variant={channelBadgeVariant(entry.channel)}>
                            {CHANNELS.find(c => c.value === entry.channel)?.label ?? entry.channel}
                          </Badge>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5 text-right">
                          <p className="text-[14px] font-bold text-green">
                            +{fmtK(entry.amount)}
                          </p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3.5 border-t border-sand flex items-center justify-between">
                <p className="text-[12.5px] text-slate">
                  Page {page} of {totalPages} · {totalCount.toLocaleString()} entries
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-[7px] border border-sand text-slate hover:text-ink hover:border-ink/20 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i
                    if (pageNum > totalPages) return null
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={[
                          'w-8 h-8 rounded-[7px] text-[13px] font-semibold transition-colors',
                          pageNum === page
                            ? 'bg-ink text-ivory'
                            : 'border border-sand text-slate hover:text-ink hover:border-ink/20',
                        ].join(' ')}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-[7px] border border-sand text-slate hover:text-ink hover:border-ink/20 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react'
import { PageHeader, KpiCard, BarChart, Skeleton } from '@/components/ui'
import { analyticsService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { AnalyticsSummary } from '@/types'

type Period = '7d' | '30d' | '90d'

const fmtKes = (n: number) => n >= 1000 ? `KSh ${(n / 1000).toFixed(0)}K` : `KSh ${n}`

export default function AnalyticsPage() {
  const { currentBusiness } = useAuth()
  const [period, setPeriod]       = useState<Period>('30d')
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!currentBusiness) return
    setLoading(true)
    analyticsService.getAll(currentBusiness.id, period)
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentBusiness?.id, period]) // eslint-disable-line

  const revenueBar = (analytics?.revenueData ?? []).slice(-14).map((d, i, arr) => ({
    label: i === arr.length - 1 ? 'Today' : new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    value: d.revenue,
    highlight: i === arr.length - 1,
  }))

  const customerBar = (analytics?.customerGrowth ?? []).map(d => ({
    label: d.date.slice(5),   // MM-DD
    value: d.newCustomers,
    highlight: false,
  }))

  const categoryBar = (analytics?.categoryPerformance ?? []).map((c, i) => ({
    label: c.categoryName.split(' ')[0],
    value: c.revenue,
    highlight: i === 0,
  }))

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Analytics"
        subtitle="Understand what's driving your business"
        actions={
          <div className="flex gap-1 bg-ivory border border-sand rounded-[9px] p-1">
            {(['7d', '30d', '90d'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={['px-3 py-1.5 text-[12.5px] font-semibold rounded-[7px]', period === p ? 'bg-white text-ink shadow-sm' : 'text-slate'].join(' ')}>
                {p}
              </button>
            ))}
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
            label="Revenue"
            value={analytics ? fmtKes(analytics.totalRevenue) : '—'}
            change={analytics?.revenueChange}
            icon={<DollarSign size={15} className="text-gold-deep" />}
            sparklineData={(analytics?.revenueData ?? []).map(d => d.revenue)}
          />
          <KpiCard
            label="Orders"
            value={analytics ? analytics.totalOrders.toLocaleString() : '—'}
            change={analytics?.ordersChange}
            icon={<ShoppingBag size={15} className="text-ink" />}
            sparklineData={(analytics?.revenueData ?? []).map(d => d.orders)}
          />
          <KpiCard
            label="Customers"
            value={analytics ? analytics.totalCustomers.toLocaleString() : '—'}
            change={analytics?.customersChange}
            icon={<Users size={15} className="text-green" />}
            sparklineData={(analytics?.customerGrowth ?? []).map(d => d.newCustomers)}
          />
          <KpiCard
            label="Avg. Order Value"
            value={analytics ? fmtKes(analytics.averageOrderValue) : '—'}
            change={analytics?.aovChange}
            icon={<TrendingUp size={15} className="text-blue" />}
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-5">Revenue trend</h3>
          {loading ? <Skeleton height={180} /> : revenueBar.length > 0 ? (
            <BarChart data={revenueBar} height={180} formatValue={v => `KSh ${(v/1000).toFixed(0)}K`} />
          ) : <p className="text-[14px] text-slate text-center py-10">No data for this period.</p>}
        </div>

        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-5">New customers</h3>
          {loading ? <Skeleton height={180} /> : customerBar.length > 0 ? (
            <BarChart data={customerBar} height={180} color="#3F6B4F" />
          ) : <p className="text-[14px] text-slate text-center py-10">No data for this period.</p>}
        </div>
      </div>

      {/* Top products */}
      {!loading && (analytics?.topProducts ?? []).length > 0 && (
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-5">Top selling products</h3>
          <div className="space-y-4">
            {analytics!.topProducts.map((p, i) => (
              <div key={p.productId}>
                <div className="flex items-center justify-between mb-1.5 text-[13.5px]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[12px] font-bold text-slate w-5 text-center">{i + 1}</span>
                    <div className="w-7 h-7 bg-sand rounded-[6px]" />
                    <span className="font-semibold text-ink">{p.productName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-ink">{fmtKes(p.revenue)}</span>
                    <span className="text-slate ml-2">({p.totalSold} sold)</span>
                  </div>
                </div>
                <div className="h-1.5 bg-sand rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${p.percentageOfTotal / (analytics!.topProducts[0]?.percentageOfTotal ?? 1) * 100}%`,
                      background: i === 0 ? '#C79A3D' : '#171B21',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category performance + insights */}
      <div className="grid lg:grid-cols-3 gap-5">
        {!loading && categoryBar.length > 0 && (
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[17px] font-medium text-ink mb-5">Sales by category</h3>
            <BarChart data={categoryBar} height={180} formatValue={v => `KSh ${(v/1000).toFixed(0)}K`} />
            <div className="mt-4 space-y-2">
              {analytics!.categoryPerformance.map(c => (
                <div key={c.categoryId} className="flex items-center justify-between text-[12.5px]">
                  <span className="text-slate">{c.categoryName}</span>
                  <span className="font-semibold text-ink">{c.percentageOfTotal.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && analytics && (
          <div className={['bg-white border border-sand rounded-[14px] p-5', categoryBar.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'].join(' ')}>
            <h3 className="font-serif text-[17px] font-medium text-ink mb-4">Actionable insights</h3>
            <div className={['grid gap-4', categoryBar.length > 0 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'].join(' ')}>
              {[
                {
                  title: 'Revenue trend',
                  body: analytics.revenueChange > 0
                    ? `Revenue is up ${analytics.revenueChange.toFixed(1)}% vs the prior period. Keep it up!`
                    : `Revenue is down ${Math.abs(analytics.revenueChange).toFixed(1)}% vs the prior period.`,
                  color: analytics.revenueChange >= 0 ? 'border-l-green' : 'border-l-red',
                },
                {
                  title: 'Orders trend',
                  body: analytics.ordersChange > 0
                    ? `You received ${analytics.ordersChange.toFixed(1)}% more orders than last period.`
                    : `Orders declined ${Math.abs(analytics.ordersChange).toFixed(1)}% vs last period.`,
                  color: analytics.ordersChange >= 0 ? 'border-l-gold' : 'border-l-red',
                },
                {
                  title: 'Top product',
                  body: analytics.topProducts[0]
                    ? `"${analytics.topProducts[0].productName}" is your best seller with ${analytics.topProducts[0].totalSold} units sold.`
                    : 'No product sales data yet for this period.',
                  color: 'border-l-ink',
                },
                {
                  title: 'Customer growth',
                  body: analytics.customersChange > 0
                    ? `Your customer base grew ${analytics.customersChange.toFixed(1)}% this period.`
                    : 'Customer growth is flat this period — consider running a promotion.',
                  color: analytics.customersChange >= 0 ? 'border-l-blue' : 'border-l-slate',
                },
              ].map(ins => (
                <div key={ins.title} className={['border-l-4 pl-4 py-1', ins.color].join(' ')}>
                  <p className="text-[14px] font-semibold text-ink mb-1">{ins.title}</p>
                  <p className="text-[13px] text-slate leading-relaxed">{ins.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

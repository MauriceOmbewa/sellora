import { useEffect, useState } from 'react'
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react'
import { PageHeader, KpiCard, BarChart } from '@/components/ui'
import { analyticsService } from '@/services'
import { useAuth } from '@/context/AuthContext'
import type { AnalyticsSummary } from '@/types'

const fmtKes = (n: number) => n >= 1000 ? `KSh ${(n / 1000).toFixed(0)}K` : `KSh ${n}`

export default function AnalyticsPage() {
  const { currentBusiness } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    if (!currentBusiness) return
    analyticsService.getSummary(currentBusiness.id).then(setAnalytics)
  }, [currentBusiness, period])

  const revenueBar = (analytics?.revenueData ?? []).slice(-7).map(d => ({
    label: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    value: d.revenue,
    highlight: false,
  }))
  if (revenueBar.length > 0) revenueBar[revenueBar.length - 1].highlight = true

  const customerBar = (analytics?.customerGrowth ?? []).map(d => ({
    label: d.date,
    value: d.newCustomers,
    highlight: false,
  }))

  const categoryBar = (analytics?.categoryPerformance ?? []).map(c => ({
    label: c.categoryName.split(' ')[0],
    value: c.revenue,
    highlight: false,
  }))
  if (categoryBar.length > 0) categoryBar[0].highlight = true

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Analytics"
        subtitle="Understand what's driving your business"
        actions={
          <div className="flex gap-1 bg-ivory border border-sand rounded-[9px] p-1">
            {['7d', '30d', '90d'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={['px-3 py-1.5 text-[12.5px] font-semibold rounded-[7px]', period === p ? 'bg-white text-ink shadow-sm' : 'text-slate'].join(' ')}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Revenue"
          value={analytics ? fmtKes(analytics.totalRevenue) : '—'}
          change={analytics?.revenueChange}
          icon={<DollarSign size={15} className="text-gold-deep" />}
        />
        <KpiCard
          label="Orders"
          value={analytics ? analytics.totalOrders.toLocaleString() : '—'}
          change={analytics?.ordersChange}
          icon={<ShoppingBag size={15} className="text-ink" />}
        />
        <KpiCard
          label="Customers"
          value={analytics ? analytics.totalCustomers.toLocaleString() : '—'}
          change={analytics?.customersChange}
          icon={<Users size={15} className="text-green" />}
        />
        <KpiCard
          label="Avg. Order Value"
          value={analytics ? fmtKes(analytics.averageOrderValue) : '—'}
          change={analytics?.aovChange}
          icon={<TrendingUp size={15} className="text-blue" />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue trend */}
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-5">Revenue trend (7 days)</h3>
          <BarChart
            data={revenueBar}
            height={180}
            formatValue={v => `KSh ${(v / 1000).toFixed(0)}K`}
          />
        </div>

        {/* Customer growth */}
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-5">New customers per month</h3>
          <BarChart
            data={customerBar}
            height={180}
            color="#3F6B4F"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Top products */}
        <div className="lg:col-span-2 bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-5">Top selling products</h3>
          <div className="space-y-4">
            {(analytics?.topProducts ?? []).map((p, i) => (
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
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${p.percentageOfTotal / (analytics?.topProducts[0]?.percentageOfTotal ?? 1) * 100}%`,
                      background: i === 0 ? '#C79A3D' : '#171B21',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by category */}
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-5">Sales by category</h3>
          <BarChart
            data={categoryBar}
            height={180}
            formatValue={v => `KSh ${(v / 1000).toFixed(0)}K`}
          />
          <div className="mt-4 space-y-2">
            {(analytics?.categoryPerformance ?? []).map(c => (
              <div key={c.categoryId} className="flex items-center justify-between text-[12.5px]">
                <span className="text-slate">{c.categoryName}</span>
                <span className="font-semibold text-ink">{c.percentageOfTotal.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable insights */}
      <div className="bg-white border border-sand rounded-[14px] p-5">
        <h3 className="font-serif text-[17px] font-medium text-ink mb-4">Actionable insights</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: 'Peak sales day',
              body: 'Saturday and Sunday drive the most revenue. Consider launching promotions on Fridays.',
              color: 'border-l-gold',
            },
            {
              title: 'Top category growth',
              body: 'Oud & Oriental fragrances grew 24% this month. Consider expanding this range.',
              color: 'border-l-green',
            },
            {
              title: 'Customer retention',
              body: '68% of your customers have placed more than one order. Your repeat customer rate is strong.',
              color: 'border-l-blue',
            },
            {
              title: 'Revenue opportunity',
              body: 'Gift Sets have the highest margin at 60%. Feature them more prominently on your homepage.',
              color: 'border-l-ink',
            },
          ].map(ins => (
            <div key={ins.title} className={['border-l-4 pl-4 py-1', ins.color].join(' ')}>
              <p className="text-[14px] font-semibold text-ink mb-1">{ins.title}</p>
              <p className="text-[13px] text-slate leading-relaxed">{ins.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

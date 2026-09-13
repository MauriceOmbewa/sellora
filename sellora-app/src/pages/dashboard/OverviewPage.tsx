import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, ShoppingBag, Users, Package,
  TrendingUp, AlertTriangle, ArrowRight, ExternalLink,
} from 'lucide-react'
import { KpiCard, Badge, Avatar, BarChart, Sparkline, Skeleton } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { analyticsService, orderService, inventoryService } from '@/services/remainingServices'
import type { AnalyticsSummary, Order, InventoryItem } from '@/types'

const fmtKes = (n: number) =>
  n >= 1_000_000 ? `KSh ${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `KSh ${(n / 1_000).toFixed(0)}K`
  : `KSh ${n.toLocaleString()}`

const payVariant: Record<string, 'success'|'warning'|'danger'|'outline'> = {
  paid: 'success', pending: 'warning', failed: 'danger', refunded: 'outline',
}

export default function OverviewPage() {
  const { user, currentBusiness } = useAuth()
  const navigate = useNavigate()
  const [analytics, setAnalytics]   = useState<AnalyticsSummary | null>(null)
  const [recentOrders, setOrders]   = useState<Order[]>([])
  const [lowStock, setLowStock]     = useState<InventoryItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [period, setPeriod]         = useState<'7d'|'30d'>('7d')

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  useEffect(() => {
    if (!currentBusiness) return
    setLoading(true)
    Promise.all([
      analyticsService.getAll(currentBusiness.id, period),
      orderService.getAll(currentBusiness.id, { page_size: 5 }),
      inventoryService.getAll(currentBusiness.id, true),  // low stock only
    ]).then(([a, { orders }, { items }]) => {
      setAnalytics(a)
      setOrders(orders)
      setLowStock(items)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [currentBusiness?.id, period]) // eslint-disable-line

  const weeklyBars = (analytics?.revenueData ?? []).slice(-7).map((d, i, arr) => ({
    label: i === arr.length - 1 ? 'Today' : new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    value: d.revenue,
    highlight: i >= arr.length - 2,
  }))

  const sparkRevenue = (analytics?.revenueData ?? []).map(d => d.revenue)

  return (
    <div className="space-y-6 fade-in">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-[26px] font-medium text-ink">
            {greeting}, {firstName}
          </h1>
          <p className="text-[13.5px] text-slate mt-1">
            {currentBusiness?.name} ·{' '}
            <a href={`/store/${currentBusiness?.slug}`} target="_blank" rel="noreferrer"
              className="hover:text-ink transition-colors inline-flex items-center gap-1">
              {currentBusiness?.slug}.sellora.co.ke <ExternalLink size={11} />
            </a>
          </p>
        </div>
        <div className="flex gap-1 bg-ivory border border-sand rounded-[9px] p-1">
          {(['7d','30d'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={['px-3 py-1.5 text-[12.5px] font-semibold rounded-[7px]', period===p ? 'bg-white text-ink shadow-sm' : 'text-slate'].join(' ')}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} height={96} className="rounded-[14px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Revenue"
            value={fmtKes(analytics?.totalRevenue ?? 0)}
            change={analytics?.revenueChange}
            changePeriod={`vs prior ${period}`}
            icon={<DollarSign size={15} className="text-gold-deep" />}
            sparklineData={sparkRevenue}
          />
          <KpiCard
            label="Orders"
            value={(analytics?.totalOrders ?? 0).toLocaleString()}
            change={analytics?.ordersChange}
            changePeriod={`vs prior ${period}`}
            icon={<ShoppingBag size={15} className="text-ink" />}
            sparklineData={(analytics?.revenueData ?? []).map(d => d.orders)}
          />
          <KpiCard
            label="Customers"
            value={(analytics?.totalCustomers ?? 0).toLocaleString()}
            change={analytics?.customersChange}
            changePeriod={`vs prior ${period}`}
            icon={<Users size={15} className="text-green" />}
          />
          <KpiCard
            label="Avg. Order Value"
            value={fmtKes(analytics?.averageOrderValue ?? 0)}
            change={analytics?.aovChange}
            changePeriod={`vs prior ${period}`}
            icon={<TrendingUp size={15} className="text-blue" />}
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Revenue chart */}
        <div className="lg:col-span-3 bg-white border border-sand rounded-[14px] p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-serif text-[17px] font-medium text-ink">Revenue this week</h3>
              <p className="text-[13px] text-slate mt-0.5">Daily sales performance</p>
            </div>
          </div>
          {loading ? <Skeleton height={200} /> : weeklyBars.length > 0 ? (
            <BarChart data={weeklyBars} height={200} formatValue={v => `KSh ${(v/1000).toFixed(0)}K`} />
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-[14px] text-slate">No revenue data yet.</p>
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white border border-sand rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-[17px] font-medium text-ink">Latest orders</h3>
            <button onClick={() => navigate('/app/orders')}
              className="text-[12.5px] text-slate hover:text-ink flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-3 items-center py-2">
                  <Skeleton width={32} height={32} rounded />
                  <div className="flex-1 space-y-1.5"><Skeleton height={12} className="w-1/2" /><Skeleton height={11} className="w-1/3" /></div>
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingBag size={24} className="text-sand-dark mb-3" />
              <p className="text-[13.5px] font-medium text-ink">No orders yet</p>
              <p className="text-[12.5px] text-slate mt-1">Orders from your store appear here.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentOrders.map(order => (
                <button key={order.id} onClick={() => navigate(`/app/orders/${order.id}`)}
                  className="w-full flex items-center gap-3 py-3 border-b border-sand last:border-0 hover:bg-ivory/50 -mx-2 px-2 rounded-[8px] text-left">
                  <Avatar name={order.customerName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">{order.customerName}</p>
                    <p className="text-[11.5px] text-slate truncate">
                      {order.items[0]?.productName}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-semibold text-ink">KSh {order.total.toLocaleString()}</p>
                    <Badge variant={payVariant[order.paymentStatus]} className="mt-0.5">{order.paymentStatus}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Top products */}
        <div className="lg:col-span-2 bg-white border border-sand rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-[17px] font-medium text-ink">Best sellers</h3>
            <button onClick={() => navigate('/app/products')}
              className="text-[12.5px] text-slate hover:text-ink flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {loading ? <Skeleton height={160} /> : (analytics?.topProducts ?? []).length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Package size={24} className="text-sand-dark mb-3" />
              <p className="text-[13.5px] font-medium text-ink">No sales data yet</p>
              <p className="text-[12.5px] text-slate mt-1 max-w-[200px]">Complete orders to see top products.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-sand">
                    {['Product','Sold','Revenue','Trend'].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-slate pb-3 pr-4 first:pl-0 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics!.topProducts.map(p => (
                    <tr key={p.productId} className="border-b border-sand last:border-0">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[7px] bg-sand shrink-0" />
                          <p className="text-[13px] font-semibold text-ink">{p.productName}</p>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-[13px] text-ink">{p.totalSold} units</td>
                      <td className="py-3.5 pr-4 text-[13px] text-ink">{fmtKes(p.revenue)}</td>
                      <td className="py-3.5"><Sparkline data={[40,55,48,70,60,82,75]} color="#C79A3D" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Needs attention */}
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-4">Needs attention</h3>
          {loading ? <Skeleton height={160} /> : lowStock.length === 0 && recentOrders.filter(o => o.status === 'new').length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-full bg-green-light flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={18} className="text-green" />
              </div>
              <p className="text-[13.5px] font-medium text-ink">All good!</p>
              <p className="text-[12.5px] text-slate mt-1">No urgent actions needed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStock.map(item => (
                <div key={item.productId} className="flex items-start gap-3 py-3 border-b border-sand last:border-0">
                  <div className={['w-2 h-2 rounded-full mt-1.5 shrink-0', item.stockStatus === 'out-of-stock' ? 'bg-red' : 'bg-gold-deep'].join(' ')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink">{item.productName}</p>
                    <p className="text-[12px] text-slate mt-0.5">
                      {item.stockStatus === 'out-of-stock' ? 'Out of stock' : `Only ${item.currentStock} left`}
                    </p>
                  </div>
                  <button onClick={() => navigate('/app/inventory')}
                    className="text-[11.5px] text-slate hover:text-ink shrink-0">Restock</button>
                </div>
              ))}
              {recentOrders.filter(o => o.status === 'new').map(o => (
                <div key={o.id} className="flex items-start gap-3 py-3 border-b border-sand last:border-0">
                  <div className="w-2 h-2 rounded-full bg-gold-deep mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink">New order {o.orderNumber}</p>
                    <p className="text-[12px] text-slate mt-0.5">Awaiting confirmation</p>
                  </div>
                  <button onClick={() => navigate(`/app/orders/${o.id}`)}
                    className="text-[11.5px] text-slate hover:text-ink shrink-0">Review</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Business insights */}
      {analytics && !loading && (
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-4">Business insights</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: <TrendingUp size={16} className="text-green" />,
                bg: 'bg-green-light',
                text: analytics.revenueChange >= 0
                  ? `Revenue increased ${analytics.revenueChange.toFixed(1)}% this period.`
                  : `Revenue decreased ${Math.abs(analytics.revenueChange).toFixed(1)}% this period.`,
              },
              {
                icon: <Package size={16} className="text-gold-deep" />,
                bg: 'bg-gold-light',
                text: analytics.topProducts[0]
                  ? `${analytics.topProducts[0].productName} is your best-selling product.`
                  : 'No sales data yet for this period.',
              },
              {
                icon: <AlertTriangle size={16} className="text-red" />,
                bg: 'bg-red-light',
                text: lowStock.length > 0
                  ? `${lowStock.length} product${lowStock.length !== 1 ? 's are' : ' is'} running low on stock.`
                  : 'All products are well stocked.',
              },
            ].map((ins, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-[12px] bg-ivory border border-sand">
                <div className={['w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0', ins.bg].join(' ')}>
                  {ins.icon}
                </div>
                <p className="text-[13.5px] text-ink-soft leading-relaxed">{ins.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

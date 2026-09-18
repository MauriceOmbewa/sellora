import { useEffect, useState } from 'react'
import { Package, Tag, TrendingUp, ShoppingBag } from 'lucide-react'
import { PageHeader, KpiCard, BarChart, PieChart, Skeleton } from '@/components/ui'
import type { PieSlice } from '@/components/ui'
import { analyticsService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { AnalyticsSummary } from '@/types'

type Period = '7d' | '30d' | '90d'

const fmtK = (n: number) => n >= 1000 ? `KSh ${(n / 1000).toFixed(1)}K` : `KSh ${n}`

// Distinct palette for category slices
const CAT_PALETTE = [
  '#C79A3D','#171B21','#3F6B4F','#4F6BB0',
  '#E59050','#9B5DE5','#E55050','#64748B',
]

export default function AnalyticsProductsPage() {
  const { currentBusiness } = useAuth()
  const [period, setPeriod]       = useState<Period>('30d')
  const [data, setData]           = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading]     = useState(true)
  const [activeProductIdx, setActiveProductIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!currentBusiness) return
    setLoading(true)
    setActiveProductIdx(null)
    analyticsService.getAll(currentBusiness.id, period)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentBusiness?.id, period]) // eslint-disable-line

  // ── Derived ───────────────────────────────────────────────────────────────
  const products   = data?.topProducts ?? []
  const categories = data?.categoryPerformance ?? []

  const totalProductRevenue = products.reduce((s, p) => s + p.revenue, 0)
  const totalUnitsSold      = products.reduce((s, p) => s + p.totalSold, 0)

  // Category pie slices
  const catPie: PieSlice[] = categories.map((c, i) => ({
    label: c.categoryName,
    value: c.revenue,
    color: CAT_PALETTE[i % CAT_PALETTE.length],
  }))

  // Category bar chart
  const catBars = categories.map((c, i) => ({
    label:     c.categoryName.split(' ')[0],
    value:     c.revenue,
    highlight: i === 0,
  }))

  // Top-product bar chart (by units sold)
  const productBars = products.map((p, i) => ({
    label:     p.productName.split(' ')[0],
    value:     p.totalSold,
    highlight: i === activeProductIdx,
  }))

  const selectedProduct = activeProductIdx !== null ? products[activeProductIdx] : null

  const periodLabel: Record<Period, string> = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days' }

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Products"
        subtitle="Top sellers, category performance, and product insights"
        breadcrumb={[{ label: 'Analytics', href: '/app/analytics' }, { label: 'Products' }]}
        actions={
          <div className="flex gap-1 bg-ivory border border-sand rounded-[9px] p-1">
            {(['7d', '30d', '90d'] as Period[]).map(p => (
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

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} height={96} className="rounded-[14px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Product revenue"
            value={fmtK(totalProductRevenue)}
            icon={<TrendingUp size={15} className="text-gold-deep" />}
            sparklineData={products.map(p => p.revenue)}
          />
          <KpiCard
            label="Units sold"
            value={totalUnitsSold.toLocaleString()}
            icon={<ShoppingBag size={15} className="text-ink" />}
            sparklineData={products.map(p => p.totalSold)}
          />
          <KpiCard
            label="Top product"
            value={products[0]?.productName ?? '—'}
            subValue={products[0] ? `${products[0].totalSold} units` : undefined}
            icon={<Package size={15} className="text-green" />}
          />
          <KpiCard
            label="Categories"
            value={categories.length.toString()}
            subValue={categories[0] ? `${categories[0].categoryName} leads` : undefined}
            icon={<Tag size={15} className="text-blue" />}
          />
        </div>
      )}

      {/* ── Top products: bar chart + detail panel ────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Bar chart — units sold */}
        <div className="lg:col-span-2 bg-white border border-sand rounded-[14px] p-5">
          <div className="mb-5">
            <h3 className="font-serif text-[17px] font-medium text-ink">Units sold — top products</h3>
            <p className="text-[12.5px] text-slate mt-0.5">{periodLabel[period]} · Click a bar to drill in</p>
          </div>
          {loading ? (
            <Skeleton height={200} className="rounded-[10px]" />
          ) : productBars.length > 0 ? (
            <div
              onClick={e => {
                const el   = e.currentTarget as HTMLDivElement
                const rect = el.getBoundingClientRect()
                const rel  = (e.clientX - rect.left) / rect.width
                const idx  = Math.floor(rel * products.length)
                const clamped = Math.max(0, Math.min(products.length - 1, idx))
                setActiveProductIdx(prev => prev === clamped ? null : clamped)
              }}
              className="cursor-pointer"
            >
              <BarChart
                data={productBars}
                height={200}
                color="#171B21"
                highlightColor="#C79A3D"
                formatValue={v => `${v} units`}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-[14px] text-slate">No product sales data for this period.</p>
            </div>
          )}
        </div>

        {/* Product detail panel */}
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-4">
            {selectedProduct ? selectedProduct.productName : 'Product detail'}
          </h3>
          {!selectedProduct ? (
            <p className="text-[13px] text-slate">Click a bar on the left to see that product's performance.</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Revenue',           value: fmtK(selectedProduct.revenue) },
                { label: 'Units sold',        value: selectedProduct.totalSold.toLocaleString() },
                { label: 'Avg. unit price',   value: selectedProduct.totalSold > 0 ? fmtK(selectedProduct.revenue / selectedProduct.totalSold) : '—' },
                { label: '% of total revenue', value: `${selectedProduct.percentageOfTotal.toFixed(1)}%` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-sand last:border-0">
                  <span className="text-[13px] text-slate">{row.label}</span>
                  <span className="text-[13.5px] font-semibold text-ink">{row.value}</span>
                </div>
              ))}

              {/* Share-of-revenue bar */}
              <div className="pt-1">
                <p className="text-[11.5px] text-slate mb-1.5">Share of period revenue</p>
                <div className="h-2 bg-sand rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-500"
                    style={{ width: `${Math.min(selectedProduct.percentageOfTotal, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10.5px] text-slate mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Rank badge */}
              <div className="pt-1 flex items-center gap-2">
                <div className={[
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px]',
                  activeProductIdx === 0 ? 'bg-gold text-ink' : 'bg-sand text-slate',
                ].join(' ')}>
                  #{(activeProductIdx ?? 0) + 1}
                </div>
                <span className="text-[12.5px] text-slate">
                  {activeProductIdx === 0
                    ? 'Best seller this period'
                    : `Rank ${(activeProductIdx ?? 0) + 1} of ${products.length}`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Category breakdown ────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Donut pie */}
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-1">Revenue by category</h3>
          <p className="text-[12.5px] text-slate mb-5">{periodLabel[period]}</p>
          {loading ? (
            <Skeleton height={220} className="rounded-[10px]" />
          ) : catPie.length > 0 ? (
            <PieChart
              data={catPie}
              size={180}
              thickness={0.52}
              showLegend
              formatValue={fmtK}
            />
          ) : (
            <div className="flex items-center justify-center h-[180px]">
              <p className="text-[13px] text-slate">No category data for this period.</p>
            </div>
          )}
        </div>

        {/* Category bar chart */}
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-1">Category revenue bar</h3>
          <p className="text-[12.5px] text-slate mb-5">{periodLabel[period]}</p>
          {loading ? (
            <Skeleton height={220} className="rounded-[10px]" />
          ) : catBars.length > 0 ? (
            <BarChart
              data={catBars}
              height={180}
              formatValue={v => `KSh ${(v/1000).toFixed(1)}K`}
            />
          ) : (
            <div className="flex items-center justify-center h-[180px]">
              <p className="text-[13px] text-slate">No category data for this period.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Full top-products table ───────────────────────────────────────── */}
      <div className="bg-white border border-sand rounded-[14px] p-5">
        <h3 className="font-serif text-[17px] font-medium text-ink mb-4">
          Top products — {periodLabel[period]}
        </h3>
        {loading ? (
          <Skeleton height={280} className="rounded-[10px]" />
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-sand">
                  {['#','Product','Units sold','Revenue','Avg. price','Share'].map(h => (
                    <th
                      key={h}
                      className={[
                        'py-2.5 pr-4 text-[11.5px] font-semibold text-slate uppercase tracking-wide',
                        h === '#' ? 'w-8' : '',
                        h === 'Share' ? 'text-right' : 'text-left',
                      ].join(' ')}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr
                    key={p.productId || i}
                    onClick={() => setActiveProductIdx(prev => prev === i ? null : i)}
                    className={[
                      'border-b border-sand/60 last:border-0 cursor-pointer transition-colors',
                      activeProductIdx === i ? 'bg-gold/10' : 'hover:bg-ivory',
                    ].join(' ')}
                  >
                    <td className="py-3 pr-4">
                      <span className={[
                        'w-6 h-6 inline-flex items-center justify-center rounded-full text-[11px] font-bold',
                        i === 0 ? 'bg-gold text-ink' : 'bg-sand text-slate',
                      ].join(' ')}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-[6px] bg-sand shrink-0" />
                        <span className="font-semibold text-ink truncate max-w-[160px]">{p.productName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-ink">{p.totalSold.toLocaleString()}</td>
                    <td className="py-3 pr-4 font-semibold text-ink">{fmtK(p.revenue)}</td>
                    <td className="py-3 pr-4 text-slate">
                      {p.totalSold > 0 ? fmtK(p.revenue / p.totalSold) : '—'}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-sand rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold rounded-full"
                            style={{ width: `${Math.min(p.percentageOfTotal, 100)}%` }}
                          />
                        </div>
                        <span className="text-slate w-10 text-right">{p.percentageOfTotal.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-sand">
                  <td colSpan={2} className="py-3 pr-4 font-bold text-ink">Total</td>
                  <td className="py-3 pr-4 font-bold text-ink">{totalUnitsSold.toLocaleString()}</td>
                  <td className="py-3 pr-4 font-bold text-ink">{fmtK(totalProductRevenue)}</td>
                  <td className="py-3 pr-4 text-slate">
                    {totalUnitsSold > 0 ? fmtK(totalProductRevenue / totalUnitsSold) : '—'}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <Package size={32} className="text-slate/30" />
            <p className="text-[14px] text-slate">No product sales data for this period.</p>
          </div>
        )}
      </div>
    </div>
  )
}

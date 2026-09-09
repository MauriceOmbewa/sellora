import React from 'react'
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { PageHeader, BarChart } from '@/components/ui'

const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
const revenueData = [480000, 562000, 491000, 623000, 718000, 840000]
const expenseData = [120000, 145000, 133000, 168000, 192000, 215000]

const expenseCategories = [
  { name: 'Stock purchases', amount: 1240000, pct: 62 },
  { name: 'Staff salaries', amount: 320000, pct: 16 },
  { name: 'Rent & utilities', amount: 180000, pct: 9 },
  { name: 'Marketing', amount: 120000, pct: 6 },
  { name: 'Delivery costs', amount: 80000, pct: 4 },
  { name: 'Other', amount: 60000, pct: 3 },
]

const recentActivity = [
  { type: 'income', desc: 'Order #1089 – Fatuma N.', amount: 8300, date: 'Today, 10:30am', cat: 'Sales' },
  { type: 'income', desc: 'Order #1088 – Brian K.', amount: 5900, date: 'Today, 09:15am', cat: 'Sales' },
  { type: 'expense', desc: 'Stock reorder – Velvet Oud x20', amount: -36000, date: 'Yesterday', cat: 'Inventory' },
  { type: 'income', desc: 'Order #1087 – Aisha M.', amount: 7800, date: 'Yesterday', cat: 'Sales' },
  { type: 'expense', desc: 'Delivery partner – weekly', amount: -4500, date: '2 days ago', cat: 'Delivery' },
]

const barData = months.map((m, i) => ({
  label: m,
  value: revenueData[i],
  highlight: i === months.length - 1,
}))

export default function FinancesPage() {
  const totalRevenue = revenueData.reduce((s, v) => s + v, 0)
  const totalExpenses = expenseData.reduce((s, v) => s + v, 0)
  const totalCogs = 1240000
  const grossProfit = totalRevenue - totalCogs
  const netProfit = totalRevenue - totalExpenses
  const grossMargin = Math.round((grossProfit / totalRevenue) * 100)
  const netMargin = Math.round((netProfit / totalRevenue) * 100)

  const fmtK = (n: number) => `KSh ${Math.abs(n) >= 1000 ? `${(Math.abs(n) / 1000).toFixed(0)}K` : Math.abs(n).toLocaleString()}`

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Finances"
        subtitle="6-month financial summary"
        actions={
          <select className="bg-white border border-sand rounded-[8px] px-3 py-2 text-[13px] focus:outline-none">
            <option>Last 6 months</option>
            <option>Last 3 months</option>
            <option>This year</option>
          </select>
        }
      />

      {/* P&L Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Revenue', value: fmtK(totalRevenue), icon: <DollarSign size={15} className="text-gold-deep" />, positive: true },
          { label: 'Cost of goods', value: fmtK(totalCogs), icon: <TrendingDown size={15} className="text-slate" />, positive: false },
          { label: 'Gross profit', value: fmtK(grossProfit), sub: `${grossMargin}% margin`, icon: <TrendingUp size={15} className="text-green" />, positive: true },
          { label: 'Expenses', value: fmtK(totalExpenses), icon: <TrendingDown size={15} className="text-red" />, positive: false },
          { label: 'Net profit', value: fmtK(netProfit), sub: `${netMargin}% margin`, icon: <ArrowUpRight size={15} className="text-green" />, positive: true, highlight: true },
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
            <p className={['font-serif text-[22px] font-semibold', card.highlight ? 'text-ivory' : card.positive ? 'text-ink' : 'text-ink'].join(' ')}>
              {card.value}
            </p>
            {card.sub && (
              <p className={['text-[12px] mt-1 font-semibold', card.highlight ? 'text-gold' : 'text-green'].join(' ')}>
                {card.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white border border-sand rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-serif text-[17px] font-medium text-ink">Revenue trend</h3>
            <div className="flex items-center gap-4 text-[12px] text-slate">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-ink inline-block" />Revenue</span>
            </div>
          </div>
          <BarChart
            data={barData}
            height={200}
            formatValue={v => `KSh ${(v / 1000).toFixed(0)}K`}
          />
        </div>

        {/* Expense breakdown */}
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <h3 className="font-serif text-[17px] font-medium text-ink mb-4">Expenses breakdown</h3>
          <div className="space-y-3">
            {expenseCategories.map(cat => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1 text-[13px]">
                  <span className="text-ink font-medium">{cat.name}</span>
                  <span className="text-slate">{fmtK(cat.amount)}</span>
                </div>
                <div className="h-1.5 bg-sand rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ink rounded-full transition-all"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white border border-sand rounded-[14px] p-5">
        <h3 className="font-serif text-[17px] font-medium text-ink mb-4">Recent activity</h3>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-sand">
                {['Type', 'Description', 'Category', 'Date', 'Amount'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate pb-3 pr-4 first:pl-0 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((row, i) => (
                <tr key={i} className="border-b border-sand last:border-0">
                  <td className="py-3.5 pr-4">
                    <div className={['w-7 h-7 rounded-full flex items-center justify-center', row.type === 'income' ? 'bg-green-light' : 'bg-red-light'].join(' ')}>
                      {row.type === 'income' ? <TrendingUp size={12} className="text-green" /> : <TrendingDown size={12} className="text-red" />}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-[13.5px] font-medium text-ink">{row.desc}</td>
                  <td className="py-3.5 pr-4 text-[12.5px] text-slate">{row.cat}</td>
                  <td className="py-3.5 pr-4 text-[12.5px] text-slate whitespace-nowrap">{row.date}</td>
                  <td className={['py-3.5 text-[13.5px] font-semibold', row.type === 'income' ? 'text-green' : 'text-red'].join(' ')}>
                    {row.type === 'income' ? '+' : '−'} KSh {Math.abs(row.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

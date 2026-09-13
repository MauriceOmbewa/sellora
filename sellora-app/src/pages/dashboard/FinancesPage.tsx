import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, ArrowUpRight, Plus, Trash2 } from 'lucide-react'
import { PageHeader, BarChart, Button, Input, Select, useToast, ConfirmModal, Skeleton } from '@/components/ui'
import { financesService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { FinanceSummary, Expense } from '@/types'

type Period = '7d' | '30d' | '90d' | 'all'

const EXPENSE_CATEGORIES = [
  { value: 'stock_purchases',  label: 'Stock purchases' },
  { value: 'staff_salaries',   label: 'Staff salaries' },
  { value: 'rent_utilities',   label: 'Rent & utilities' },
  { value: 'marketing',        label: 'Marketing' },
  { value: 'delivery_costs',   label: 'Delivery costs' },
  { value: 'equipment',        label: 'Equipment' },
  { value: 'other',            label: 'Other' },
]

function AddExpenseModal({ businessId, onClose, onSaved }: { businessId: string; onClose: () => void; onSaved: (e: Expense) => void }) {
  const { toast } = useToast()
  const [form, setForm] = useState({ category: 'other', description: '', amount: '', date: new Date().toISOString().slice(0,10) })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount || !form.date) { toast('error', 'All fields required'); return }
    setSaving(true)
    try {
      const created = await financesService.createExpense(businessId, { ...form, amount: form.amount })
      onSaved(created)
      toast('success', 'Expense added')
      onClose()
    } catch (err: unknown) {
      toast('error', 'Save failed', err instanceof Error ? err.message : '')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-enter">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[16px] shadow-2xl border border-sand/50 p-6 w-full max-w-sm fade-in space-y-4">
        <h2 className="font-serif text-[18px] font-medium text-ink">Add expense</h2>
        <Select label="Category" options={EXPENSE_CATEGORIES} value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} />
        <Input label="Description" placeholder="e.g. Supplier payment" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Amount (KSh)" type="number" placeholder="0" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))} />
          <Input label="Date" type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} />
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-semibold border border-sand rounded-[8px] text-ink hover:border-ink">Cancel</button>
          <Button variant="primary" loading={saving} onClick={handleSave}>Add expense</Button>
        </div>
      </div>
    </div>
  )
}

const fmtK = (n: number) => `KSh ${Math.abs(n) >= 1000 ? `${(Math.abs(n)/1000).toFixed(0)}K` : Math.abs(n).toLocaleString()}`

export default function FinancesPage() {
  const { currentBusiness } = useAuth()
  const { toast } = useToast()
  const [period, setPeriod]   = useState<Period>('30d')
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = (p: Period) => {
    if (!currentBusiness) return
    setLoading(true)
    Promise.all([
      financesService.getSummary(currentBusiness.id, p),
      financesService.getExpenses(currentBusiness.id, p === 'all' ? '90d' : p),
    ]).then(([s, { expenses }]) => { setSummary(s); setExpenses(expenses) })
      .catch(() => toast('error', 'Failed to load finances'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(period) }, [currentBusiness?.id, period]) // eslint-disable-line

  const handleDeleteExpense = async () => {
    if (!deleteTarget || !currentBusiness) return
    setDeleting(true)
    try {
      await financesService.deleteExpense(currentBusiness.id, deleteTarget.id)
      setExpenses(prev => prev.filter(e => e.id !== deleteTarget.id))
      toast('success', 'Expense deleted')
    } catch { toast('error', 'Delete failed') }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  const plCards = summary ? [
    { label: 'Revenue',       value: fmtK(summary.revenue),    icon: <TrendingUp size={15} className="text-gold-deep" />, positive: true },
    { label: 'Cost of goods', value: fmtK(summary.costOfGoods), icon: <TrendingDown size={15} className="text-slate" />, positive: false },
    { label: 'Gross profit',  value: fmtK(summary.grossProfit), sub: `${summary.grossMargin.toFixed(1)}% margin`, icon: <TrendingUp size={15} className="text-green" />, positive: true },
    { label: 'Expenses',      value: fmtK(summary.expenses),    icon: <TrendingDown size={15} className="text-red" />, positive: false },
    { label: 'Net profit',    value: fmtK(summary.netProfit),   sub: `${summary.netMargin.toFixed(1)}% margin`, icon: <ArrowUpRight size={15} className="text-green" />, highlight: true },
  ] : []

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Finances"
        subtitle="Profit & loss summary"
        actions={
          <div className="flex gap-3">
            <div className="flex gap-1 bg-ivory border border-sand rounded-[9px] p-1">
              {(['7d','30d','90d','all'] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={['px-3 py-1.5 text-[12.5px] font-semibold rounded-[7px]', period===p ? 'bg-white text-ink shadow-sm' : 'text-slate'].join(' ')}>
                  {p}
                </button>
              ))}
            </div>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Add Expense</Button>
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
            <div key={card.label} className={['rounded-[14px] p-4', (card as any).highlight ? 'bg-ink text-ivory' : 'bg-white border border-sand'].join(' ')}>
              <div className="flex items-center justify-between mb-3">
                <p className={['text-[12px] font-medium uppercase tracking-wide', (card as any).highlight ? 'text-ivory/60' : 'text-slate'].join(' ')}>{card.label}</p>
                <div className={['w-8 h-8 rounded-[8px] flex items-center justify-center', (card as any).highlight ? 'bg-white/10' : 'bg-ivory border border-sand'].join(' ')}>{card.icon}</div>
              </div>
              <p className={['font-serif text-[22px] font-semibold', (card as any).highlight ? 'text-ivory' : 'text-ink'].join(' ')}>{card.value}</p>
              {(card as any).sub && <p className={['text-[12px] mt-1 font-semibold', (card as any).highlight ? 'text-gold' : 'text-green'].join(' ')}>{(card as any).sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Expenses list */}
      <div className="bg-white border border-sand rounded-[14px] p-5">
        <h3 className="font-serif text-[17px] font-medium text-ink mb-4">Expenses</h3>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} height={44} className="rounded-[8px]" />)}</div>
        ) : expenses.length === 0 ? (
          <p className="text-[14px] text-slate py-6 text-center">No expenses for this period.</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-sand">
                  {['Date','Category','Description','Amount',''].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate pb-3 pr-4 first:pl-0 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} className="border-b border-sand last:border-0 group">
                    <td className="py-3.5 pr-4 text-[12.5px] text-slate whitespace-nowrap">{exp.date}</td>
                    <td className="py-3.5 pr-4 text-[13px] text-slate capitalize">{exp.category.replace('_',' ')}</td>
                    <td className="py-3.5 pr-4 text-[13.5px] font-medium text-ink">{exp.description}</td>
                    <td className="py-3.5 pr-4 text-[13.5px] font-semibold text-ink">KSh {exp.amount.toLocaleString()}</td>
                    <td className="py-3.5">
                      <button onClick={() => setDeleteTarget(exp)} className="p-1.5 text-slate hover:text-red hover:bg-red-light rounded-[6px] opacity-0 group-hover:opacity-100">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && currentBusiness && (
        <AddExpenseModal
          businessId={currentBusiness.id}
          onClose={() => setShowAdd(false)}
          onSaved={e => setExpenses(prev => [e, ...prev])}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteExpense}
        title="Delete expense?"
        description={`"${deleteTarget?.description}" (KSh ${deleteTarget?.amount.toLocaleString()}) will be permanently removed.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader, Button, Input, Select, useToast, ConfirmModal, Skeleton } from '@/components/ui'
import { financesService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { Expense } from '@/types'

type Period = '7d' | '30d' | '90d' | 'all'

const EXPENSE_CATEGORIES = [
  { value: 'stock_purchases', label: 'Stock purchases' },
  { value: 'staff_salaries',  label: 'Staff salaries' },
  { value: 'rent_utilities',  label: 'Rent & utilities' },
  { value: 'marketing',       label: 'Marketing' },
  { value: 'delivery_costs',  label: 'Delivery costs' },
  { value: 'equipment',       label: 'Equipment' },
  { value: 'other',           label: 'Other' },
]

const fmtK = (n: number) =>
  `KSh ${n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString()}`

// ── Add expense modal ─────────────────────────────────────────────────────────
function AddExpenseModal({
  businessId,
  onClose,
  onSaved,
}: {
  businessId: string
  onClose: () => void
  onSaved: (e: Expense) => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    category:    'other',
    description: '',
    amount:      '',
    date:        new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount || !form.date) {
      toast('error', 'All fields required')
      return
    }
    setSaving(true)
    try {
      const created = await financesService.createExpense(businessId, { ...form, amount: form.amount })
      onSaved(created)
      toast('success', 'Expense added')
      onClose()
    } catch (err: unknown) {
      toast('error', 'Save failed', err instanceof Error ? err.message : '')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[16px] shadow-2xl border border-sand/50 p-6 w-full max-w-sm fade-in space-y-4">
        <h2 className="font-serif text-[18px] font-medium text-ink">Add expense</h2>
        <Select
          label="Category"
          options={EXPENSE_CATEGORIES}
          value={form.category}
          onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
        />
        <Input
          label="Description"
          placeholder="e.g. Supplier payment"
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount (KSh)"
            type="number"
            placeholder="0"
            value={form.amount}
            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[14px] font-semibold border border-sand rounded-[8px] text-ink hover:border-ink transition-colors"
          >
            Cancel
          </button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Add expense
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const { currentBusiness } = useAuth()
  const { toast }           = useToast()

  const [period, setPeriod]         = useState<Period>('30d')
  const [expenses, setExpenses]     = useState<Expense[]>([])
  const [loading, setLoading]       = useState(true)
  const [showAdd, setShowAdd]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [deleting, setDeleting]     = useState(false)

  useEffect(() => {
    if (!currentBusiness) return
    setLoading(true)
    financesService.getExpenses(currentBusiness.id, period === 'all' ? '90d' : period)
      .then(({ expenses }) => setExpenses(expenses))
      .catch(() => toast('error', 'Failed to load expenses'))
      .finally(() => setLoading(false))
  }, [currentBusiness?.id, period]) // eslint-disable-line

  const handleDelete = async () => {
    if (!deleteTarget || !currentBusiness) return
    setDeleting(true)
    try {
      await financesService.deleteExpense(currentBusiness.id, deleteTarget.id)
      setExpenses(prev => prev.filter(e => e.id !== deleteTarget.id))
      toast('success', 'Expense deleted')
    } catch {
      toast('error', 'Delete failed')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  // Group by category for the summary strip
  const byCategory: Record<string, number> = {}
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount
  })
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Expenses"
        subtitle="Log and track your operating costs"
        breadcrumb={[{ label: 'Finances', href: '/app/finances' }, { label: 'Expenses' }]}
        actions={
          <div className="flex gap-3">
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
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
              Add expense
            </Button>
          </div>
        }
      />

      {/* Summary strip */}
      {!loading && expenses.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: `Total (${period})`,   value: fmtK(totalExpenses) },
            { label: 'Transactions',         value: expenses.length.toString() },
            { label: 'Largest category',     value: topCategory ? EXPENSE_CATEGORIES.find(c => c.value === topCategory[0])?.label ?? topCategory[0] : '—', sub: topCategory ? fmtK(topCategory[1]) : undefined },
          ].map(card => (
            <div key={card.label} className="bg-white border border-sand rounded-[14px] p-4">
              <p className="text-[12px] font-medium text-slate uppercase tracking-wide mb-2">{card.label}</p>
              <p className="font-serif text-[20px] font-semibold text-ink">{card.value}</p>
              {card.sub && <p className="text-[12px] text-slate mt-0.5">{card.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Expenses table */}
      <div className="bg-white border border-sand rounded-[14px] p-5">
        <h3 className="font-serif text-[17px] font-medium text-ink mb-4">All expenses</h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} height={44} className="rounded-[8px]" />)}
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-[14px] text-slate">No expenses for this period.</p>
            <Button variant="outline" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
              Add first expense
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-sand">
                  {['Date', 'Category', 'Description', 'Amount', ''].map(h => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-slate pb-3 pr-4 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} className="border-b border-sand last:border-0 group hover:bg-ivory/60 transition-colors">
                    <td className="py-3.5 pr-4 text-[12.5px] text-slate whitespace-nowrap">{exp.date}</td>
                    <td className="py-3.5 pr-4 text-[13px] text-slate capitalize">
                      {EXPENSE_CATEGORIES.find(c => c.value === exp.category)?.label ?? exp.category.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 pr-4 text-[13.5px] font-medium text-ink">{exp.description}</td>
                    <td className="py-3.5 pr-4 text-[13.5px] font-semibold text-red">
                      −{fmtK(exp.amount)}
                    </td>
                    <td className="py-3.5">
                      <button
                        onClick={() => setDeleteTarget(exp)}
                        className="p-1.5 text-slate hover:text-red hover:bg-red-light rounded-[6px] opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-sand">
                  <td colSpan={3} className="py-3 pr-4 font-bold text-ink text-[13.5px]">Total</td>
                  <td className="py-3 font-bold text-red text-[13.5px]">−{fmtK(totalExpenses)}</td>
                  <td />
                </tr>
              </tfoot>
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
        onConfirm={handleDelete}
        title="Delete expense?"
        description={`"${deleteTarget?.description}" (KSh ${deleteTarget?.amount.toLocaleString()}) will be permanently removed.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}

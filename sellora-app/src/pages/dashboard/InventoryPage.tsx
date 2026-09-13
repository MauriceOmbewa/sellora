import { useEffect, useState, useCallback } from 'react'
import { Archive, AlertTriangle, Plus, Minus } from 'lucide-react'
import { Badge, PageHeader, Input, useToast, EmptyState, Skeleton, Button } from '@/components/ui'
import { inventoryService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { InventoryItem } from '@/types'

function AdjustModal({ item, onClose, onSave }: {
  item: InventoryItem | null
  onClose: () => void
  onSave: (productId: string, delta: number, reason: string) => Promise<void>
}) {
  const [qty, setQty]     = useState('')
  const [reason, setReason] = useState('')
  const [type, setType]   = useState<'add' | 'remove'>('add')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  if (!item) return null

  const delta     = parseInt(qty) || 0
  const newStock  = Math.max(0, item.currentStock + (type === 'add' ? delta : -delta))

  const handleSave = async () => {
    if (!delta || delta <= 0) { toast('error', 'Enter a valid quantity'); return }
    setSaving(true)
    await onSave(item.productId, type === 'add' ? delta : -delta, reason)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-enter">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[16px] shadow-2xl border border-sand/50 p-6 w-full max-w-sm fade-in">
        <h2 className="font-serif text-[18px] font-medium text-ink mb-1">Adjust stock</h2>
        <p className="text-[13px] text-slate mb-5">{item.productName} · SKU: {item.sku}</p>
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['add', 'remove'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={['flex-1 py-2.5 text-[13px] font-semibold rounded-[8px] border flex items-center justify-center gap-2', type === t ? 'bg-ink text-ivory border-ink' : 'bg-white text-slate border-sand'].join(' ')}>
                {t === 'add' ? <Plus size={13} /> : <Minus size={13} />}
                {t === 'add' ? 'Add stock' : 'Remove stock'}
              </button>
            ))}
          </div>
          <Input label="Quantity" type="number" min="1" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} />
          <Input label="Reason (optional)" placeholder="e.g. Received new shipment" value={reason} onChange={e => setReason(e.target.value)} />
          <div className="bg-ivory border border-sand rounded-[10px] p-3 text-[13px] flex items-center gap-3">
            <span className="text-slate">Current:</span>
            <strong className="text-ink">{item.currentStock}</strong>
            <span className="text-slate">→</span>
            <strong className={newStock === 0 ? 'text-red' : newStock <= item.lowStockThreshold ? 'text-gold-deep' : 'text-green'}>
              {newStock}
            </strong>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-semibold border border-sand rounded-[8px] text-ink hover:border-ink">Cancel</button>
          <Button variant="primary" loading={saving} onClick={handleSave} disabled={!qty || parseInt(qty) <= 0}>Confirm</Button>
        </div>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const { currentBusiness } = useAuth()
  const { toast } = useToast()
  const [items, setItems]           = useState<InventoryItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null)

  const load = useCallback(() => {
    if (!currentBusiness) return
    setLoading(true)
    inventoryService.getAll(currentBusiness.id)
      .then(({ items }) => setItems(items))
      .catch(() => toast('error', 'Failed to load inventory'))
      .finally(() => setLoading(false))
  }, [currentBusiness?.id]) // eslint-disable-line

  useEffect(() => { load() }, [currentBusiness?.id]) // eslint-disable-line

  const handleAdjust = async (productId: string, delta: number, reason: string) => {
    if (!currentBusiness) return
    try {
      const updated = await inventoryService.adjustStock(currentBusiness.id, productId, delta, reason)
      setItems(prev => prev.map(i => i.productId === productId ? updated : i))
      toast('success', 'Stock updated')
    } catch (err: unknown) {
      toast('error', 'Failed to update stock', err instanceof Error ? err.message : '')
      throw err
    }
  }

  const total      = items.reduce((s, i) => s + i.currentStock, 0)
  const stockValue = items.reduce((s, i) => s + i.stockValue, 0)
  const lowStock   = items.filter(i => i.stockStatus === 'low-stock')
  const outOfStock = items.filter(i => i.stockStatus === 'out-of-stock')

  const stockBadge = (item: InventoryItem) => {
    if (item.stockStatus === 'out-of-stock') return <Badge variant="danger">Out of stock</Badge>
    if (item.stockStatus === 'low-stock')    return <Badge variant="warning">Low stock</Badge>
    return                                          <Badge variant="success">In stock</Badge>
  }

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Inventory" subtitle="Track and manage your product stock" />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total units',  value: total.toLocaleString(),                       color: 'text-ink' },
          { label: 'Stock value',  value: `KSh ${(stockValue / 1000).toFixed(0)}K`,    color: 'text-green' },
          { label: 'Low stock',    value: lowStock.length.toString(),                   color: lowStock.length > 0 ? 'text-gold-deep' : 'text-green' },
          { label: 'Out of stock', value: outOfStock.length.toString(),                 color: outOfStock.length > 0 ? 'text-red' : 'text-green' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-sand rounded-[14px] p-4">
            <p className={['font-serif text-[24px] font-semibold', s.color].join(' ')}>{s.value}</p>
            <p className="text-[12.5px] text-slate mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="bg-red-light border border-red/20 rounded-[12px] px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red mt-0.5 shrink-0" />
          <p className="text-[13.5px] text-ink">
            <strong>{outOfStock.length + lowStock.length} product{outOfStock.length + lowStock.length !== 1 ? 's' : ''}</strong> need restocking.
            {outOfStock.length > 0 && <span className="text-red font-semibold"> {outOfStock.length} out of stock.</span>}
            {lowStock.length > 0 && <span className="text-gold-deep font-semibold"> {lowStock.length} low stock.</span>}
          </p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-sand rounded-[14px] p-5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={48} className="rounded-[8px]" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-sand rounded-[14px]">
          <EmptyState icon={<Archive size={22} />} title="No inventory data" description="Add products to start tracking inventory." />
        </div>
      ) : (
        <div className="bg-white border border-sand rounded-[14px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-sand bg-ivory/50">
                  {['Product', 'SKU', 'Category', 'In Stock', 'Threshold', 'Value', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate py-3.5 px-4 first:pl-5 last:pr-5 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.productId} className="border-b border-sand last:border-0 hover:bg-ivory/30 group">
                    <td className="py-3.5 pl-5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-sand rounded-[7px] shrink-0" />
                        <p className="text-[13.5px] font-semibold text-ink">{item.productName}</p>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-[12.5px] font-mono text-slate">{item.sku || '—'}</td>
                    <td className="py-3.5 pr-4 text-[13px] text-slate">{item.categoryName || '—'}</td>
                    <td className="py-3.5 pr-4">
                      <span className={['font-serif text-[18px] font-semibold',
                        item.stockStatus === 'out-of-stock' ? 'text-red' :
                        item.stockStatus === 'low-stock' ? 'text-gold-deep' : 'text-ink'].join(' ')}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-[13px] text-slate">{item.lowStockThreshold}</td>
                    <td className="py-3.5 pr-4 text-[13.5px] text-ink">KSh {item.stockValue.toLocaleString()}</td>
                    <td className="py-3.5 pr-4">{stockBadge(item)}</td>
                    <td className="py-3.5 pr-5">
                      <button onClick={() => setAdjustTarget(item)}
                        className="px-3 py-1.5 text-[12px] font-semibold text-ink border border-sand rounded-[7px] opacity-0 group-hover:opacity-100 transition-all hover:border-ink">
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdjustModal item={adjustTarget} onClose={() => setAdjustTarget(null)} onSave={handleAdjust} />
    </div>
  )
}

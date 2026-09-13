import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, Mail, MapPin, ShoppingBag } from 'lucide-react'
import { PageHeader, Badge, Avatar, useToast, Skeleton, Button, Textarea } from '@/components/ui'
import { customerService, orderService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { Customer, Order } from '@/types'

const payVariant: Record<string, 'success' | 'warning' | 'danger' | 'outline'> = {
  paid: 'success', pending: 'warning', failed: 'danger', refunded: 'outline',
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentBusiness } = useAuth()
  const { toast } = useToast()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders]     = useState<Order[]>([])
  const [loading, setLoading]   = useState(true)
  const [savingNotes, setSavingNotes] = useState(false)
  const [notes, setNotes]       = useState('')

  useEffect(() => {
    if (!id || !currentBusiness) return
    Promise.all([
      customerService.getById(currentBusiness.id, id),
      orderService.getAll(currentBusiness.id, { customer_id: id, page_size: 20 }),
    ]).then(([c, o]) => {
      setCustomer(c); setOrders(o.orders); setNotes(c.notes ?? '')
    }).catch(() => { toast('error', 'Failed to load customer'); navigate('/app/customers') })
      .finally(() => setLoading(false))
  }, [id, currentBusiness?.id]) // eslint-disable-line

  const handleSaveNotes = async () => {
    if (!customer || !currentBusiness) return
    setSavingNotes(true)
    try {
      const updated = await customerService.update(currentBusiness.id, customer.id, { notes })
      setCustomer(updated)
      toast('success', 'Notes saved')
    } catch { toast('error', 'Save failed') }
    finally { setSavingNotes(false) }
  }

  if (loading) return <div className="space-y-4">{Array.from({length:3}).map((_,i) => <Skeleton key={i} height={96} className="rounded-[14px]" />)}</div>
  if (!customer) return null

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title={customer.name} breadcrumb={[{ label: 'Customers', href: '/app/customers' }, { label: customer.name }]} />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Profile */}
        <div className="space-y-5">
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <div className="flex flex-col items-center text-center pb-5 border-b border-sand">
              <Avatar name={customer.name} size="xl" className="mb-3" />
              <h2 className="font-serif text-[18px] font-medium text-ink">{customer.name}</h2>
              {customer.location && <p className="text-[13px] text-slate mt-0.5">{customer.location}</p>}
              <div className="flex gap-1.5 mt-3 flex-wrap justify-center">
                {customer.tags.map(t => <Badge key={t} variant={t === 'vip' ? 'gold' : 'outline'} className="capitalize">{t}</Badge>)}
              </div>
            </div>
            <div className="pt-4 space-y-3">
              <a href={`tel:${customer.phone}`} className="flex items-center gap-3 text-[13.5px] text-slate hover:text-ink">
                <Phone size={15} />{customer.phone}
              </a>
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-3 text-[13.5px] text-slate hover:text-ink">
                  <Mail size={15} />{customer.email}
                </a>
              )}
              {customer.location && (
                <div className="flex items-center gap-3 text-[13.5px] text-slate"><MapPin size={15} />{customer.location}</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-sand rounded-[14px] p-5 space-y-4">
            <h3 className="font-serif text-[16px] font-medium text-ink">Lifetime value</h3>
            {[
              { label: 'Total spent',     value: `KSh ${customer.totalSpent.toLocaleString()}` },
              { label: 'Total orders',    value: customer.totalOrders.toString() },
              { label: 'Avg. order value', value: customer.totalOrders > 0 ? `KSh ${Math.round(customer.totalSpent / customer.totalOrders).toLocaleString()}` : '—' },
              { label: 'First purchase',  value: customer.firstPurchaseAt ? new Date(customer.firstPurchaseAt).toLocaleDateString('en-KE') : '—' },
              { label: 'Last purchase',   value: customer.lastPurchaseAt  ? new Date(customer.lastPurchaseAt).toLocaleDateString('en-KE') : '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-[13.5px]">
                <span className="text-slate">{row.label}</span>
                <span className="font-semibold text-ink">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="bg-white border border-sand rounded-[14px] p-5 space-y-3">
            <h3 className="font-serif text-[16px] font-medium text-ink">Notes</h3>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Private notes about this customer…" />
            <Button variant="secondary" loading={savingNotes} onClick={handleSaveNotes} fullWidth>Save notes</Button>
          </div>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[16px] font-medium text-ink mb-4">Order history</h3>
            {orders.length === 0 ? (
              <div className="py-10 text-center"><ShoppingBag size={28} className="text-slate mx-auto mb-3" /><p className="text-[14px] text-slate">No orders yet</p></div>
            ) : (
              <div className="space-y-0">
                {orders.map(order => (
                  <button key={order.id} onClick={() => navigate(`/app/orders/${order.id}`)}
                    className="w-full flex items-center gap-4 py-4 border-b border-sand last:border-0 hover:bg-ivory/50 -mx-5 px-5 transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-mono font-semibold text-ink">{order.orderNumber}</span>
                        <Badge variant={payVariant[order.paymentStatus]}>{order.paymentStatus}</Badge>
                      </div>
                      <p className="text-[12.5px] text-slate">{order.items.map(i => i.productName).join(', ')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13.5px] font-semibold text-ink">KSh {order.total.toLocaleString()}</p>
                      <p className="text-[11.5px] text-slate">{new Date(order.createdAt).toLocaleDateString('en-KE')}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, MessageSquare, Check } from 'lucide-react'
import { Badge, Button, PageHeader, useToast } from '@/components/ui'
import { orderService } from '@/services'
import type { Order, OrderStatus } from '@/types'

const statusSteps: OrderStatus[] = ['new', 'confirmed', 'processing', 'ready', 'completed']
const statusLabel: Record<OrderStatus, string> = {
  new: 'New', confirmed: 'Confirmed', processing: 'Processing',
  ready: 'Ready for pickup', completed: 'Completed', cancelled: 'Cancelled',
}
const statusVariant: Record<string, any> = {
  new: 'info', confirmed: 'gold', processing: 'warning',
  ready: 'success', completed: 'success', cancelled: 'danger',
}
const payVariant: Record<string, any> = {
  paid: 'success', pending: 'warning', failed: 'danger', refunded: 'outline',
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id) return
    orderService.getById(id).then(o => { setOrder(o); setLoading(false) })
  }, [id])

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order) return
    setUpdating(true)
    const updated = await orderService.updateStatus(order.id, status)
    setOrder(updated)
    toast('success', 'Order updated', `Status changed to ${statusLabel[status]}`)
    setUpdating(false)
  }

  if (loading || !order) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-sand rounded-[14px]" />)}
      </div>
    )
  }

  const currentStepIndex = statusSteps.indexOf(order.status as OrderStatus)
  const isCancelled = order.status === 'cancelled'

  const nextStatus = !isCancelled && currentStepIndex < statusSteps.length - 1
    ? statusSteps[currentStepIndex + 1]
    : null

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        breadcrumb={[{ label: 'Orders', href: '/app/orders' }, { label: order.orderNumber }]}
        actions={
          <div className="flex gap-2">
            {nextStatus && (
              <Button
                variant="primary"
                loading={updating}
                onClick={() => handleStatusChange(nextStatus)}
              >
                Mark as {statusLabel[nextStatus]}
              </Button>
            )}
            {!isCancelled && order.status !== 'completed' && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange('cancelled')}
              >
                Cancel Order
              </Button>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status timeline */}
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-[16px] font-medium text-ink">Order status</h3>
              <Badge variant={statusVariant[order.status]}>{statusLabel[order.status as OrderStatus]}</Badge>
            </div>

            {!isCancelled ? (
              <div className="flex items-center gap-0">
                {statusSteps.map((step, i) => {
                  const done = i <= currentStepIndex
                  const active = i === currentStepIndex
                  return (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={[
                          'w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors',
                          done ? 'bg-ink text-ivory' : 'bg-sand text-slate',
                        ].join(' ')}>
                          {done ? <Check size={13} /> : i + 1}
                        </div>
                        <span className={['text-[11px] text-center w-14', active ? 'font-semibold text-ink' : 'text-slate'].join(' ')}>
                          {statusLabel[step]}
                        </span>
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div className={['flex-1 h-0.5 mb-4 transition-colors', i < currentStepIndex ? 'bg-ink' : 'bg-sand'].join(' ')} />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-red-light rounded-[10px] px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-red flex items-center justify-center">
                  <span className="text-white text-[14px]">×</span>
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-ink">Order Cancelled</p>
                  <p className="text-[12px] text-slate mt-0.5">
                    {order.timeline.find(t => t.status === 'cancelled')?.note ?? 'No reason provided'}
                  </p>
                </div>
              </div>
            )}

            {/* Timeline events */}
            <div className="mt-5 pt-5 border-t border-sand space-y-3">
              {[...order.timeline].reverse().map((event, i) => (
                <div key={i} className="flex items-start gap-3 text-[13px]">
                  <div className="w-1.5 h-1.5 bg-ink rounded-full mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-ink">{statusLabel[event.status as OrderStatus]}</span>
                    {event.note && <span className="text-slate"> · {event.note}</span>}
                    <p className="text-[11.5px] text-slate mt-0.5">
                      {new Date(event.timestamp).toLocaleString('en-KE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[16px] font-medium text-ink mb-4">Order items</h3>
            <div className="space-y-0">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-3.5 border-b border-sand last:border-0">
                  <div className="w-11 h-11 bg-sand rounded-[8px] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-ink">{item.productName}</p>
                    <p className="text-[12px] text-slate">{item.sku} · Qty {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-semibold text-ink">KSh {item.totalPrice.toLocaleString()}</p>
                    <p className="text-[12px] text-slate">@ {item.unitPrice.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-sand space-y-2">
              {[
                { label: 'Subtotal', value: `KSh ${order.subtotal.toLocaleString()}` },
                { label: 'Delivery', value: order.deliveryFee === 0 ? 'Free' : `KSh ${order.deliveryFee.toLocaleString()}` },
                ...(order.discount > 0 ? [{ label: 'Discount', value: `−KSh ${order.discount.toLocaleString()}` }] : []),
              ].map(row => (
                <div key={row.label} className="flex justify-between text-[13.5px]">
                  <span className="text-slate">{row.label}</span>
                  <span className="text-ink">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between text-[15px] font-bold text-ink pt-2 border-t border-sand">
                <span>Total</span>
                <span>KSh {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[16px] font-medium text-ink mb-4">Customer</h3>
            <p className="text-[14px] font-semibold text-ink">{order.customerName}</p>
            <div className="mt-3 space-y-2">
              <a
                href={`tel:${order.customerPhone}`}
                className="flex items-center gap-2 text-[13px] text-slate hover:text-ink"
              >
                <Phone size={13} />
                {order.customerPhone}
              </a>
              {order.customerEmail && (
                <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-2 text-[13px] text-slate hover:text-ink">
                  <MessageSquare size={13} />
                  {order.customerEmail}
                </a>
              )}
            </div>
            {order.deliveryAddress && (
              <div className="mt-3 pt-3 border-t border-sand">
                <p className="text-[12px] font-semibold text-slate uppercase tracking-wide mb-1">Delivery address</p>
                <p className="text-[13.5px] text-ink">{order.deliveryAddress}</p>
              </div>
            )}
            {order.orderNotes && (
              <div className="mt-3 pt-3 border-t border-sand">
                <p className="text-[12px] font-semibold text-slate uppercase tracking-wide mb-1">Note</p>
                <p className="text-[13.5px] text-ink">{order.orderNotes}</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[16px] font-medium text-ink mb-4">Payment</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate">Status</span>
                <Badge variant={payVariant[order.paymentStatus]}>{order.paymentStatus}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate">Method</span>
                <span className="text-[13.5px] font-semibold text-ink capitalize">{order.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate">Channel</span>
                <span className="text-[13.5px] font-semibold text-ink capitalize">{order.channel.replace('-', ' ')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

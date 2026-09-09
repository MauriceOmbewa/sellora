import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { Badge, PageHeader, SearchInput, EmptyState, Avatar } from '@/components/ui'
import { orderService } from '@/services'
import { useAuth } from '@/context/AuthContext'
import type { Order } from '@/types'

const statusVariant: Record<string, any> = {
  new: 'info', confirmed: 'gold', processing: 'warning',
  ready: 'success', completed: 'success', cancelled: 'danger',
}
const payVariant: Record<string, any> = {
  paid: 'success', pending: 'warning', failed: 'danger', refunded: 'outline',
}

const statusLabel: Record<string, string> = {
  new: 'New', confirmed: 'Confirmed', processing: 'Processing',
  ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled',
}

const channelLabel: Record<string, string> = {
  online: 'Online', whatsapp: 'WhatsApp', 'walk-in': 'Walk-in', phone: 'Phone',
}

export default function OrdersPage() {
  const { currentBusiness } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [payFilter, setPayFilter] = useState('all')

  useEffect(() => {
    if (!currentBusiness) return
    orderService.getAll(currentBusiness.id).then(o => {
      setOrders(o)
      setLoading(false)
    })
  }, [currentBusiness])

  const filtered = orders.filter(o => {
    if (search) {
      const q = search.toLowerCase()
      if (!o.customerName.toLowerCase().includes(q) &&
          !o.orderNumber.toLowerCase().includes(q)) return false
    }
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (payFilter !== 'all' && o.paymentStatus !== payFilter) return false
    return true
  })

  // Summary counts
  const counts = {
    all: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    processing: orders.filter(o => ['confirmed', 'processing'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
  }

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total orders`}
      />

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: `All (${counts.all})` },
          { id: 'new', label: `New (${counts.new})` },
          { id: 'processing', label: `Processing (${counts.processing})` },
          { id: 'completed', label: `Completed (${counts.completed})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id === 'processing' ? 'confirmed' : tab.id)}
            className={[
              'px-4 py-2 rounded-[8px] text-[13px] font-semibold border transition-colors',
              statusFilter === (tab.id === 'processing' ? 'confirmed' : tab.id)
                ? 'bg-ink text-ivory border-ink'
                : 'bg-white text-slate border-sand hover:border-ink hover:text-ink',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-sand rounded-[14px] p-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or order #…"
          className="w-full sm:w-72"
        />
        <select
          value={payFilter}
          onChange={e => setPayFilter(e.target.value)}
          className="bg-white border border-sand rounded-[8px] px-3 py-2 text-[13px] text-ink focus:outline-none"
        >
          <option value="all">All payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-sand rounded-[14px] p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-4 border-b border-sand last:border-0">
              <div className="w-9 h-9 skeleton rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 skeleton rounded w-1/3" />
                <div className="h-3 skeleton rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-sand rounded-[14px]">
          <EmptyState
            icon={<ShoppingBag size={22} />}
            title="No orders found"
            description="Try adjusting your filters."
          />
        </div>
      ) : (
        <div className="bg-white border border-sand rounded-[14px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-sand bg-ivory/50">
                  {['Order', 'Customer', 'Date', 'Items', 'Total', 'Payment', 'Status', 'Channel', ''].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate py-3.5 px-4 first:pl-5 last:pr-5 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/app/orders/${order.id}`)}
                    className="border-b border-sand last:border-0 hover:bg-ivory/40 cursor-pointer group"
                  >
                    <td className="py-3.5 pl-5 pr-4">
                      <p className="text-[13px] font-mono font-semibold text-ink">{order.orderNumber}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={order.customerName} size="sm" />
                        <div>
                          <p className="text-[13px] font-semibold text-ink">{order.customerName}</p>
                          <p className="text-[11.5px] text-slate">{order.customerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-[12.5px] text-slate whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3.5 pr-4 text-[13px] text-slate">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="py-3.5 pr-4">
                      <p className="text-[13.5px] font-semibold text-ink whitespace-nowrap">KSh {order.total.toLocaleString()}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <Badge variant={payVariant[order.paymentStatus]}>{order.paymentStatus}</Badge>
                    </td>
                    <td className="py-3.5 pr-4">
                      <Badge variant={statusVariant[order.status]}>{statusLabel[order.status]}</Badge>
                    </td>
                    <td className="py-3.5 pr-4 text-[12.5px] text-slate">{channelLabel[order.channel]}</td>
                    <td className="py-3.5 pr-5">
                      <ArrowRight size={14} className="text-slate group-hover:text-ink transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
